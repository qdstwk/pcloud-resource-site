const API_BASE = 'https://api.pcloud.com';

let configData = null;

// 主初始化
fetch('final_config.json')
  .then(res => res.json())
  .then(config => {
    configData = config;
    initNavigation();
  });

function initNavigation() {
  window.addEventListener('hashchange', renderCurrentPath);
  renderCurrentPath();
}

async function renderCurrentPath() {
  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const backLink = document.getElementById('backLink');
  
  const hash = decodeURIComponent(window.location.hash.slice(1));
  const path = hash ? hash.split('/') : [];
  
  // 查找当前节点
  let current = { subcategories: configData.categories };
  for (const p of path) {
    const next = (current.subcategories || []).find(
      item => item.type === p || item.subtype === p
    );
    if (!next) break;
    current = next;
  }

  // 更新UI
  title.textContent = path[path.length - 1] || '资源分类';
  backLink.style.display = path.length ? 'inline' : 'none';
  backLink.href = path.length > 1 ? '#' + path.slice(0, -1).join('/') : '#';
  
  content.innerHTML = '<p>加载中...</p>';
  
  if (current.subcategories) {
    // 显示子分类
    renderCategories(current.subcategories, path, content);
  } 
  else if (current.sources?.[0]?.pcloudCode) {
    // 显示pCloud文件列表
    await renderPCloudFiles(current.sources[0].pcloudCode, content);
  }
  else {
    content.innerHTML = '<p>此分类暂无内容</p>';
  }
}

function renderCategories(subcategories, currentPath, container) {
  container.innerHTML = '';
  const ul = document.createElement('ul');
  
  subcategories.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.textContent = item.subtype || item.type;
    
    if (item.sources?.[0]?.pcloudCode) {
      // 终端分类：点击加载文件列表
      a.href = '#';
      a.onclick = async (e) => {
        e.preventDefault();
        container.innerHTML = '<p>加载文件列表...</p>';
        await renderPCloudFiles(item.sources[0].pcloudCode, container);
      };
    } else {
      // 普通分类：继续导航
      a.href = '#' + [...currentPath, item.subtype || item.type].join('/');
    }
    
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  container.appendChild(ul);
}

async function renderPCloudFiles(pcloudCode, container) {
  try {
    // 调用pCloud API获取文件列表
    const response = await fetch(`${API_BASE}/listfolder?code=${pcloudCode}`);
    const data = await response.json();
    
    if (data.contents && data.contents.length > 0) {
      container.innerHTML = '';
      const ul = document.createElement('ul');
      
      data.contents.forEach(file => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = file.name;
        a.href = `https://e.pcloud.link/publink/show?code=${pcloudCode}&fileid=${file.fileid}`;
        a.target = '_blank';
        li.appendChild(a);
        ul.appendChild(li);
      });
      
      container.appendChild(ul);
    } else {
      container.innerHTML = '<p>该文件夹为空</p>';
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
    container.innerHTML = '<p>加载文件列表失败，请稍后再试</p>';
  }
}
