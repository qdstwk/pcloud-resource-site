// 全局状态
let configData = null;
let currentPath = [];
let activeIframeUrl = null;

// 主入口
document.addEventListener('DOMContentLoaded', () => {
  fetch('final_config.json')
    .then(res => res.json())
    .then(config => {
      configData = config;
      initNavigation();
      initSearch();
    });
});

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
    
    if (keyword === '') {
      document.getElementById('searchResults').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      return;
    }

    searchTimer = setTimeout(() => {
      searchFiles(keyword);
    }, 300);
  });
}

// 更新视图
function updateView() {
  currentPath = decodeURIComponent(window.location.hash.slice(1))
    .split('/')
    .filter(Boolean);

  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const backLink = document.getElementById('backLink');

  // 更新标题和返回链接
  title.textContent = currentPath[currentPath.length - 1] || '资源分类';
  backLink.style.display = currentPath.length ? 'inline' : 'none';
  backLink.href = currentPath.length > 1 ? 
    '#' + currentPath.slice(0, -1).join('/') : '#';

  // 显示加载状态
  content.innerHTML = '<p class="loading">加载中...</p>';

  // 获取当前节点
  const currentNode = getCurrentNode();
  
  if (currentNode.sources?.[0]?.pcloudCode) {
    activeIframeUrl = `https://e.pcloud.link/publink/show?code=${currentNode.sources[0].pcloudCode}`;
    renderPCloudIframe(activeIframeUrl, content);
  } else if (currentNode.subcategories?.length > 0) {
    renderCategoryList(currentNode.subcategories, content);
  } else {
    content.innerHTML = '<p class="empty">此分类暂无内容</p>';
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

// 渲染分类列表
function renderCategoryList(subcategories, container) {
  const ul = document.createElement('ul');
  
  subcategories.forEach(item => {
    const li = document.createElement('li');
    li.className = 'file-item';
    
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
function renderPCloudIframe(url, container) {
  container.innerHTML = `
    <iframe src="${url}" id="pcloudFrame"></iframe>
  `;
}

// 搜索文件
async function searchFiles(keyword) {
  if (!activeIframeUrl) return;

  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '<p class="loading">搜索中...</p>';
  searchResults.style.display = 'block';
  document.getElementById('content').style.display = 'none';

  try {
    // 获取pCloud页面内容
    const html = await fetch(activeIframeUrl).then(res => res.text());
    
    // 解析HTML获取文件列表
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fileLinks = Array.from(doc.querySelectorAll('a[href*="/file/"]'));
    
    // 过滤和匹配结果
    const results = fileLinks
      .map(link => ({
        name: link.textContent.trim(),
        url: link.href
      }))
      .filter(file => 
        file.name.toLowerCase().includes(keyword.toLowerCase())
      );

    // 渲染结果
    if (results.length > 0) {
      const ul = document.createElement('ul');
      results.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `<a href="${file.url}" target="_blank">${file.name}</a>`;
        ul.appendChild(li);
      });
      searchResults.innerHTML = '';
      searchResults.appendChild(ul);
    } else {
      searchResults.innerHTML = `
        <p class="empty">没有找到匹配的文件</p>
        <p>建议尝试：</p>
        <ul>
          <li>缩短关键词（如"徐立"）</li>
          <li>检查特殊字符或空格</li>
        </ul>
      `;
    }
  } catch (error) {
    console.error('搜索失败:', error);
    searchResults.innerHTML = '<p class="empty">搜索过程中出错，请刷新页面重试</p>';
  }
}
