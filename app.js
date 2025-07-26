document.addEventListener('DOMContentLoaded', () => {
  fetch('final_config.json')
    .then(res => res.json())
    .then(config => {
      window.resourceConfig = config;
      initNavigation();
    });
});

function initNavigation() {
  const render = () => {
    const hash = window.location.hash.slice(1);
    const path = hash ? decodeURIComponent(hash).split('/') : [];
    
    const { current, title } = resolvePath(path, window.resourceConfig);
    renderUI(current, title, path);
  };

  window.addEventListener('hashchange', render);
  render();
}

function resolvePath(path, config) {
  let current = { items: config.categories };
  let breadcrumbs = ['资源分类'];
  
  for (const segment of path) {
    const found = current.items.find(
      item => item.type === segment || item.subtype === segment
    );
    if (!found) break;
    
    current = found;
    breadcrumbs.push(found.subtype || found.type);
    current.items = found.subcategories || [];
  }
  
  return {
    current,
    title: breadcrumbs[breadcrumbs.length - 1],
    breadcrumbs
  };
}

function renderUI(current, title, path) {
  document.getElementById('title').textContent = title;
  
  const backLink = document.getElementById('backLink');
  backLink.style.display = path.length ? 'inline' : 'none';
  backLink.href = path.length > 1 ? 
    '#' + path.slice(0, -1).join('/') : '#';

  const content = document.getElementById('content');
  content.innerHTML = '';

  if (current.sources) {
    renderFileList(current.sources, content);
  } else if (current.items && current.items.length) {
    renderCategoryList(current.items, content);
  } else {
    content.innerHTML = '<p class="empty-msg">此分类暂无内容</p>';
  }
}

function renderCategoryList(items, container) {
  const ul = document.createElement('ul');
  
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'category-item';
    
    const a = document.createElement('a');
    a.textContent = item.subtype || item.type;
    a.href = item.sources ? 
      `#${item.subtype || item.type}` : 
      `#${item.subtype || item.type}`;
    
    if (item.sources) {
      a.onclick = (e) => {
        e.preventDefault();
        renderFileList(item.sources, container);
        document.getElementById('title').textContent = item.subtype || item.type;
      };
    }
    
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  container.appendChild(ul);
}

function renderFileList(sources, container) {
  const ul = document.createElement('ul');
  
  sources.forEach(source => {
    if (!source.pcloudCode) return;
    
    const li = document.createElement('li');
    li.className = 'file-item';
    
    const a = document.createElement('a');
    a.textContent = source.name || `资源 (${source.pcloudCode.slice(0, 6)}...)`;
    a.href = `https://e.pcloud.link/publink/show?code=${source.pcloudCode}`;
    a.target = '_blank';
    
    li.appendChild(a);
    ul.appendChild(li);
  });
  
  container.innerHTML = '';
  container.appendChild(ul);
}
