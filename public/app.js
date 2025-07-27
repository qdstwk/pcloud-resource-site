// 全局状态
let configData = null;
let currentPath = [];
let currentFileList = [];

// 主入口
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadConfig();
    initNavigation();
    initSearch();
  } catch (error) {
    showError('系统初始化失败，请刷新页面');
  }
});

// 加载配置
async function loadConfig() {
  const response = await fetch('/final_config.json');
  if (!response.ok) throw new Error('配置加载失败');
  configData = await response.json();
}

// 初始化导航
function initNavigation() {
  window.addEventListener('hashchange', updateView);
  updateView();
}

// 初始化搜索
function initSearch() {
  const searchBox = document.getElementById('searchBox');
  let searchTimer = null;

  searchBox.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const keyword = searchBox.value.trim();
    
    if (!keyword) {
      hideSearchResults();
      return;
    }

    searchTimer = setTimeout(() => {
      performSearch(keyword);
    }, 300);
  });
}

// 更新视图
async function updateView() {
  try {
    currentPath = decodeURIComponent(window.location.hash.slice(1))
      .split('/')
      .filter(Boolean);

    updateUI();
    await renderContent();
  } catch (error) {
    showError('页面加载失败');
  }
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

// 渲染内容
async function renderContent() {
  const content = document.getElementById('content');
  content.innerHTML = '<p class="loading">加载中...</p>';

  const currentNode = getCurrentNode();
  
  if (currentNode.sources?.[0]?.pcloudCode) {
    await renderPCloudContent(currentNode.sources[0].pcloudCode, content);
  } else if (currentNode.subcategories?.length > 0) {
    renderCategoryList(currentNode.subcategories, content);
  } else {
    content.innerHTML = '<p class="empty">此分类暂无内容</p>';
  }
}

// 渲染pCloud内容
async function renderPCloudContent(pcloudCode, container) {
  try {
    // 尝试通过API获取文件列表
    const response = await fetch(`/.netlify/functions/pcloud-proxy?code=${pcloudCode}`);
    if (!response.ok) throw new Error('API请求失败');
    
    const data = await response.json();
    if (data.files?.length > 0) {
      currentFileList = data.files;
      renderFileList(currentFileList, container);
    } else {
      // 回退到iframe方案
      renderPCloudIframe(pcloudCode, container);
    }
  } catch (error) {
    console.error('加载失败:', error);
    renderPCloudIframe(pcloudCode, container);
  }
}

// 渲染文件列表
function renderFileList(files, container) {
  const ul = document.createElement('ul');
  ul.className = 'file-list';

  files.forEach(file => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.innerHTML = `<a href="${file.url}" target="_blank">${file.name}</a>`;
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}

// 渲染分类列表
function renderCategoryList(subcategories, container) {
  const ul = document.createElement('ul');
  ul.className = 'category-list';

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

// 渲染pCloud iframe
function renderPCloudIframe(pcloudCode, container) {
  container.innerHTML = `
    <iframe 
      src="https://e.pcloud.link/publink/show?code=${pcloudCode}"
      class="pcloud-iframe"
      title="pCloud文件列表"
    ></iframe>
  `;
}

// 执行搜索
function performSearch(keyword) {
  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '<p class="loading">搜索中...</p>';
  searchResults.style.display = 'block';

  const results = currentFileList.filter(file => 
    file.name.toLowerCase().includes(keyword.toLowerCase())
  );

  if (results.length > 0) {
    renderFileList(results, searchResults);
  } else {
    searchResults.innerHTML = `
      <p class="empty">没有找到匹配的文件</p>
      <p>建议尝试：</p>
      <ul>
        <li>简化关键词</li>
        <li>检查拼写</li>
      </ul>
    `;
  }
}

// 隐藏搜索结果
function hideSearchResults() {
  document.getElementById('searchResults').style.display = 'none';
}

// 更新UI
function updateUI() {
  document.getElementById('title').textContent = 
    currentPath[currentPath.length - 1] || '资源分类';

  const backLink = document.getElementById('backLink');
  backLink.style.display = currentPath.length ? 'inline' : 'none';
  backLink.href = currentPath.length > 1 ? 
    '#' + currentPath.slice(0, -1).join('/') : '#';
}

// 显示错误
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `<p class="error">${message}</p>`;
}
