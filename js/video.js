
const typeFilter = "视频";
let allFiles = [];

async function loadData() {
  const cached = localStorage.getItem("cache-视频");
  if (cached) {
    allFiles = JSON.parse(cached);
    renderSidebar();
    return;
  }

  const progress = document.querySelector("#progressBar div");
  progress.style.width = "20%";

  const testData = 
[
  {
    "type": "音频",
    "subtype": "圣经朗读",
    "sources": [{"type": "remote", "pcloudCode": "kZPMMfZiCcVI79eC9pKbDrMFeNAbursKdXk"}]
  },
  {
    "type": "视频",
    "subtype": "讲道信息",
    "sources": [{"type": "remote", "pcloudCode": "kZErJEZFfktW9umY6mJSDCwm6KgH5uA5VSk"}]
  },
  {
    "type": "视频",
    "subtype": "诗歌",
    "sources": [{"type": "remote", "pcloudCode": "kZYkamZk37jjnbr42XWMUvWP1MDaYC87r1X"}]
  }
]
;

  const tempFiles = [];
  for (const item of testData) {
    if (item.type !== typeFilter) continue;
    for (const src of item.sources) {
      try {
        const res = await fetch(`https://eapi.pcloud.com/showpublink?code=${src.pcloudCode}`);
        const json = await res.json();
        if (json.result === 0) {
          const contents = json.metadata.contents || [];
          contents.forEach(file => {
            if (file.isfolder) return;
            tempFiles.push({
              name: file.name,
              link: `https://e.pcloud.link/publink/show?code=${src.pcloudCode}#${file.name}`,
              type: item.type,
              subtype: item.subtype
            });
          });
        }
      } catch (e) {
        console.warn("加载失败", e);
      }
    }
  }
  allFiles = tempFiles;
  localStorage.setItem("cache-视频", JSON.stringify(allFiles));
  renderSidebar();
  progress.style.width = "100%";
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const subs = [...new Set(allFiles.map(f => f.subtype))];
  sidebar.innerHTML = '';
  subs.forEach(sub => {
    const btn = document.createElement("button");
    btn.textContent = sub;
    btn.onclick = () => showList(sub);
    sidebar.appendChild(btn);
  });
}

function showList(subtype) {
  const list = document.getElementById("resourceList");
  list.innerHTML = '';
  document.getElementById("subcategoryTitle").textContent = typeFilter + " / " + subtype;
  const files = allFiles.filter(f => f.subtype === subtype);
  files.forEach(f => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = f.link;
    a.target = "_blank";
    a.innerHTML = f.name;
    li.appendChild(a);
    list.appendChild(li);
  });
}

document.getElementById("searchInput").addEventListener("input", function(e) {
  const kw = e.target.value.trim().toLowerCase();
  const list = document.getElementById("resourceList");
  const title = document.getElementById("subcategoryTitle");
  list.innerHTML = '';
  if (!kw) return;

  title.textContent = `搜索：${kw}`;
  const results = allFiles.filter(f =>
    f.name.toLowerCase().includes(kw) ||
    f.subtype.toLowerCase().includes(kw)
  );

  results.forEach(f => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = f.link;
    a.target = "_blank";
    const regex = new RegExp(kw, "gi");
    const highlighted = f.name.replace(regex, (m) => `<mark>${m}</mark>`);
    a.innerHTML = highlighted;
    li.appendChild(a);
    list.appendChild(li);
  });
});

loadData();
