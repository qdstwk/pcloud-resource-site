
let configData = null;

fetch('final_config.json')
  .then(res => res.json())
  .then(config => {
    configData = config;
    renderFromHash();
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
  let parentPath = [];

  for (let p of path) {
    const next = (current.subcategories || []).find(item => item.subtype === p || item.type === p);
    if (next) {
      parentPath.push(current);
      current = next;
    } else {
      break;
    }
  }

  title.textContent = path[path.length - 1] || '资源分类';

  if (path.length > 0) {
    backLink.style.display = 'inline';
    backLink.href = '#' + path.slice(0, -1).join('/');
  } else {
    backLink.style.display = 'none';
  }

  const list = document.createElement('ul');

  if (current.subcategories) {
    current.subcategories.forEach(sub => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = sub.subtype || sub.type;
      a.href = '#' + [...path, sub.subtype || sub.type].join('/');
      li.appendChild(a);
      list.appendChild(li);
    });
  } else if (current.sources) {
    current.sources.forEach(source => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.textContent = source.pcloudCode || '文件链接';
      a.href = 'https://e.pcloud.link/publink/show?code=' + source.pcloudCode;
      a.target = '_blank';
      li.appendChild(a);
      list.appendChild(li);
    });
  } else {
    const msg = document.createElement('p');
    msg.textContent = '此分类暂无内容。';
    content.appendChild(msg);
  }

  content.appendChild(list);
}
