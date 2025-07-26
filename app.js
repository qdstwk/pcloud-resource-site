
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
    
    const { current } = resolvePath(path, window.resourceConfig);
    renderUI(current, path);
  };

  window.addEventListener('hashchange', render);
  render();
}

function resolvePath(path, config) {
  let current = { items: config.categories };
  for (const segment of path) {
    const found = current.items.find(item => item.type === segment || item.subtype === segment);
    if (!found) break;
    current = found;
    current.items = found.subcategories || [];
  }
  return { current };
}

function renderUI(current, path) {
  const content = document.getElementById('content');
  const backLink = document.getElementById('backLink');
  
  // 更新返回链接
  backLink.style.display = path.length ? 'inline' : 'none';
  backLink.href = path.length > 1 ? '#' + path.slice(0, -1).join('/') : '#';

  // 清空内容
  content.innerHTML = '';

  if (current.sources?.[0]?.pcloudCode) {
    // 终极方案：直接嵌入pCloud官方界面
    content.innerHTML = `
      <iframe 
        src="https://e.pcloud.link/publink/show?code=${current.sources[0].pcloudCode}"
        style="width:100%; height:75vh; border:none;"
      ></iframe>
    `;
  } else if (current.items?.length) {
    // 显示子分类
    const ul = document.createElement('ul');
    current.items.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = item.subtype || item.type;
      a.href = '#' + [...path, item.subtype || item.type].join('/');
      li.appendChild(a);
      ul.appendChild(li);
    });
    content.appendChild(ul);
  } else {
    content.innerHTML = '<p class="empty">此分类暂无内容</p>';
  }
}
