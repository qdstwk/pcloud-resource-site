
const links = [
  { type: "音频", subtype: "圣经朗读", code: "kZPMMfZiCcVI79eC9pKbDrMFeNAbursKdXk" },
  { type: "视频", subtype: "讲道信息", code: "kZErJEZFfktW9umY6mJSDCwm6KgH5uA5VSk" }
];

let allFiles = [];

async function fetchRecursive(code, type, subtype) {
  const res = await fetch(`/.netlify/functions/fetch-folder?pcloudCode=${code}`);
  const json = await res.json();
  if (!json.metadata || !json.metadata.folderid) return [];

  const contents = json;
  
  const files = [];

  function traverse(items) {
    for (const item of items) {
      if (item.isfolder && item.contents) {
        traverse(item.contents);
      } else if (!item.isfolder) {
        files.push({
          name: item.name,
          link: `https://e.pcloud.link/publink/show?code=${code}#${item.name}`,
          type, subtype
        });
      }
    }
  }

  traverse(contents);
  return files;
}

async function loadAll() {
  let status = document.getElementById("status");
  let sidebar = document.getElementById("sidebar");
  let list = document.getElementById("resourceList");

  for (const l of links) {
    const files = await fetchRecursive(l.code, l.type, l.subtype);
    allFiles = allFiles.concat(files);
  }

  const subtypes = [...new Set(allFiles.map(f => f.subtype))];
  sidebar.innerHTML = '';
  subtypes.forEach(sub => {
    const btn = document.createElement("button");
    btn.textContent = sub;
    btn.onclick = () => showList(sub);
    sidebar.appendChild(btn);
  });

  status.textContent = "✅ 加载完成，共 " + allFiles.length + " 个文件";
}

function showList(subtype) {
  const list = document.getElementById("resourceList");
  const sort = document.getElementById("sortSelect").value;
  list.innerHTML = '';
  let subset = allFiles.filter(f => f.subtype === subtype);
  if (sort === "name") subset.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === "type") subset.sort((a,b) => a.type.localeCompare(b.type));
  const ul = document.createElement("ul");
  subset.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${f.link}" target="_blank">${f.name}</a>`;
    ul.appendChild(li);
  });
  list.appendChild(ul);
}

document.getElementById("searchInput").addEventListener("input", function(e) {
  const kw = e.target.value.trim().toLowerCase();
  const list = document.getElementById("resourceList");
  list.innerHTML = '';
  if (!kw) return;

  const results = allFiles.filter(f =>
    f.name.toLowerCase().includes(kw) || f.subtype.toLowerCase().includes(kw)
  );
  const ul = document.createElement("ul");
  results.forEach(f => {
    const li = document.createElement("li");
    const highlighted = f.name.replace(new RegExp(kw, "gi"), m => `<mark>${m}</mark>`);
    li.innerHTML = `<a href="${f.link}" target="_blank">${highlighted}</a>`;
    ul.appendChild(li);
  });
  list.appendChild(ul);
});

document.getElementById("sortSelect").addEventListener("change", () => {
  const firstSub = allFiles[0]?.subtype;
  if (firstSub) showList(firstSub);
});

loadAll();
