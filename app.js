let configData = null;

fetch('final_config.json')
  .then(res => res.json())
  .then(config => {
    configData = config;
    renderFromHash();
  })
  .catch(error => {
    console.error('加载配置失败:', error);
    document.getElementById('content').innerHTML = 
      '<p class="error">加载配置失败，请刷新页面</p>';
  });

window.addEventListener('hashchange', renderFromHash);

function renderFromHash() {
  const content = document.getElementById('content');
  const title = document.getElementById('title');
  const backLink = document.getElementById('backLink');
  content.innerHTML = '';

  const hash = decodeURIComponent(location.hash.slice(1));
  const path = hash ? hash.split('/') : [];

  let current = { subcategories: configData.categories };
  let fullPath = [];

  // 导航到当前分类
  for (let p of path) {
    const next = (current.subcategories || []).find(item => 
      item.subtype === p || item.type === p
    );
    if (next) {
      fullPath.push(next.subtype || next.type);
      current = next;
    }
  }

  title.textContent = fullPath[fullPath.length - 1] || '资源分类';

  // 返回链接处理
  if (fullPath.length > 0) {
    backLink.style.display = 'inline';
    backLink.href = '#' + fullPath.slice(0, -1).join('/');
  } else {
    backLink.style.display = 'none';
  }

  // 渲染内容
  if (current.subcategories) {
    renderCategories(current.subcategories, fullPath, content);
  } 
  else if (current.sources && current.sources.length > 0) {
    renderFiles(current.sources, content);
  }
  else {
    content.innerHTML = '<p class="empty">此分类暂无内容</p>';
  }
}

function renderCategories(subcategories, currentPath, container) {
  const list = document.createElement('ul');
  list.className = 'category-list';

  subcategories.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    
    a.textContent = item.subtype || item.type;
    a.href = '#' + [...currentPath, item.subtype || item.type].join('/');
    
    // 如果是叶子节点且有资源，添加文件数量提示
    if (!item.subcategories && item.sources?.length > 0) {
      const count = document.createElement('span');
      count.className = 'file-count';
      count.textContent = ` (${item.sources.length}个文件)`;
      a.appendChild(count);
    }
    
    li.appendChild(a);
    list.appendChild(li);
  });

  container.appendChild(list);
}

function renderFiles(sources, container) {
  container.innerHTML = '<h3>文件列表</h3>';
  
  const list = document.createElement('ul');
  list.className = 'file-list';

  sources.forEach(source => {
    if (!source.pcloudCode) return;
    
    const li = document.createElement('li');
    li.className = 'file-item';
    
    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.textContent = '📁'; // 默认文件夹图标
    
    const link = document.createElement('a');
    link.href = `https://e.pcloud.link/publink/show?code=${source.pcloudCode}`;
    link.target = '_blank';
    
    // 从链接中提取有意义的名称
    const name = source.pcloudCode 
      ? `资源链接 (${source.pcloudCode.slice(0, 6)}...)` 
      : '未命名资源';
    link.textContent = name;
    
    li.appendChild(icon);
    li.appendChild(link);
    list.appendChild(li);
  });

  if (list.children.length === 0) {
    container.innerHTML = '<p class="empty">该分类下没有可用资源</p>';
  } else {
    container.appendChild(list);
  }
}
