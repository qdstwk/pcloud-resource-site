// 全局状态
let configData = null;
let currentPath = [];
const fileCache = {};

// 主入口
document.addEventListener('DOMContentLoaded', () => {
  fetch('final_config.json')
    .then(res => res.json())
    .then(config => {
      configData = config;
      initNavigation();
      initSearch();
    })
    .catch(error => {
      console.error('加载配置失败:', error);
      document.getElementById('content').innerHTML = 
        '<p class="error">加载配置失败，请刷新页面</p>';
    });
});

// 初始化导航系统
function initNavigation() {
  window.addEventListener('hashchange', () => {
    currentPath = decodeURIComponent(window.location.hash.slice(1))
      .split('/')
      .filter(Boolean);
    renderView();
  });
  
  // 初始加载
  currentPath = decodeURIComponent(window.location.hash.slice(1))
    .split('/')
    .filter(Boolean);
  renderView();
}

// 初始化搜索系统
function initSearch() {
  const searchBox = document.getElementById('searchBox');
  let searchTimer = null;

  searchBox.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const keyword = searchBox.value.trim();
    
    if (keyword.length === 0) {
      renderView();
      return;
    }

    searchTimer = setTimeout(() => {
      performSearch(keyword.toLowerCase());
    }, 300);
  });
}

// 获取当前节点
function getCurrentNode() {
  let current = { subcategories: configData.categories };
  for (const segment of currentPath) {
    const next = (current.subcategories || []).find(
      item => item.type === segment || item.subtype === segment
    );
    if (!next) break;
    current = next;
  }
  return current;
}

// 主渲染函数
function renderView() {
  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const backLink = document.getElementById('backLink');
  const searchBox = document.getElementById('searchBox');

  // 重置搜索框
  searchBox.value = '';
  
  const current = getCurrentNode();
  title.textContent = currentPath[currentPath.length - 1] || '资源分类';
  
  // 更新返回链接
  backLink.style.display = currentPath.length ? 'inline' : 'none';
  backLink.href = currentPath.length > 1 ? 
    '#' + currentPath.slice(0, -1).join('/') : '#';

  // 渲染内容
  content.innerHTML = '<p class="loading">加载中...</p>';

  if (current.sources?.[0]?.pcloudCode) {
    renderPCloudFolder(current.sources[0].pcloudCode, content);
  } else if (current.subcategories?.length > 0) {
    renderCategoryList(current.subcategories, content);
  } else {
    content.innerHTML = '<p class="empty">此分类暂无内容</p>';
  }
}

// 渲染分类列表
function renderCategoryList(subcategories, container) {
  const ul = document.createElement('ul');
  
  subcategories.forEach(item => {
    const li = document.createElement('li');
    li.className = 'category-item';
    
    const a = document.createElement('a');
    a.textContent = item.subtype || item.type;
    a.href = '#' + [...currentPath, item.subtype || item.type].join('/');
    
    li.appendChild(a);
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}

// 渲染pCloud文件夹内容
function renderPCloudFolder(pcloudCode, container) {
  if (fileCache[pcloudCode]) {
    renderFileList(fileCache[pcloudCode], container);
    return;
  }

  container.innerHTML = '<p class="loading">加载文件列表...</p>';
  
  // 使用iframe方案（兼容性最好）
  container.innerHTML = `
    <iframe 
      src="https://e.pcloud.link/publink/show?code=${pcloudCode}"
      style="width:100%; height:70vh; border:none;"
    ></iframe>
  `;

  // 可选：如果你想用API获取文件列表（需处理跨域）
  // fetchPCloudFiles(pcloudCode).then(files => {
  //   fileCache[pcloudCode] = files;
  //   renderFileList(files, container);
  // });
}

// 执行搜索
async function performSearch(keyword) {
  const content = document.getElementById('content');
  content.innerHTML = '<p class="loading">搜索中...</p>';

  const currentNode = getCurrentNode();
  const pcloudCodes = collectPCloudCodes(currentNode);
  
  const allFiles = [];
  for (const code of pcloudCodes) {
    const files = await fetchPCloudFiles(code);
    allFiles.push(...files);
  }

  const results = allFiles.filter(file => 
    file.name.toLowerCase().includes(keyword)
  );

  renderSearchResults(results, content);
}

// 收集所有pCloud codes（递归子分类）
function collectPCloudCodes(node) {
  let codes = [];
  
  if (node.sources?.[0]?.pcloudCode) {
    codes.push(node.sources[0].pcloudCode);
  }
  
  if (node.subcategories) {
    node.subcategories.forEach(sub => {
      codes.push(...collectPCloudCodes(sub));
    });
  }
  
  return [...new Set(codes)]; // 去重
}

// 获取pCloud文件列表（需处理跨域问题）
async function fetchPCloudFiles(pcloudCode) {
  if (fileCache[pcloudCode]) return fileCache[pcloudCode];
  
  try {
    // 注意：实际使用时需要代理或处理跨域
    const response = await fetch(
      `https://api.pcloud.com/listfolder?code=${pcloudCode}&showdeleted=0&nofiles=0`
    );
    const data = await response.json();
    
    const files = data.metadata?.contents
      ?.filter(item => !item.isfolder)
      ?.map(file => ({
        name: file.name,
        url: `https://e.pcloud.link/publink/show?code=${pcloudCode}&fileid=${file.fileid}`
      })) || [];
    
    fileCache[pcloudCode] = files;
    return files;
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
}

// 渲染文件列表
function renderFileList(files, container) {
  const ul = document.createElement('ul');
  
  files.forEach(file => {
    const li = document.createElement('li');
    li.className = 'file-item';
    
    const a = document.createElement('a');
    a.textContent = file.name;
    a.href = file.url;
    a.target = '_blank';
    
    li.appendChild(a);
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}

// 渲染搜索结果
function renderSearchResults(results, container) {
  if (results.length === 0) {
    container.innerHTML = '<p class="empty">没有找到匹配的文件</p>';
    return;
  }

  const ul = document.createElement('ul');
  
  results.forEach(file => {
    const li = document.createElement('li');
    li.className = 'file-item search-result';
    
    const a = document.createElement('a');
    a.textContent = file.name;
    a.href = file.url;
    a.target = '_blank';
    
    li.appendChild(a);
    ul.appendChild(li);
  });

  container.innerHTML = '<h3>搜索结果</h3>';
  container.appendChild(ul);
}
