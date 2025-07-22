
const typeFilter = "音频";
let allFiles = [];

async function loadData() {
  const cached = localStorage.getItem("cache-音频");
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
    "type": "视频",
    "subtypes": [
      {
        "subtype": "属灵洞察力和敏感度",
        "sources": [
          { "type": "remote", "pcloudCode": "kZYkamZk37jjnbr42XWMUvWP1MDaYC87r1X" }
        ]
      },
      {
        "subtype": "讲道信息",
        "sources": [
          { "type": "remote", "pcloudCode": "kZErJEZFfktW9umY6mJSDCwm6KgH5uA5VSk" }
        ]
      }
    ]
  },
  {
    "type": "音频",
    "subtypes": [
      {
        "subtype": "圣经朗读",
        "sources": [
          { "type": "remote", "pcloudCode": "kZPMMfZiCcVI79eC9pKbDrMFeNAbursKdXk" }
        ]
      }
    ]
  }
]
;

  const tempFiles = [];
  for (const group of testData) {
    if (group.type !== typeFilter) continue;
    for (const item of group.subtypes) {
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
                type: group.type,
                subtype: item.subtype
              });
            });
          } else {
            console.warn("pCloud 请求失败", json);
          }
        } catch (e) {
          console.warn("加载失败", e);
        }
      }
    }
  }

  if (!tempFiles.length) {
    document.getElementById("subcategoryTitle").textContent = "⚠️ 无法加载任何资源，请检查网络或配置";
  }

  allFiles = tempFiles;
  localStorage.setItem("cache-音频", JSON.stringify(allFiles));
  renderSidebar();
  progress.style.width = "100%";
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const subs = [...new Set(allFiles.map(f => f.subtype))];
  sidebar.innerHTML = '';
  if (subs.length === 0) {
    sidebar.innerHTML = "<em>⚠️ 未找到任何子分类</em>";
    return;
  }
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

  let files = allFiles.filter(f => f.subtype === subtype);
  const sortMode = document.getElementById("sortSelect").value;
  if (sortMode === "name") {
    files.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (files.length === 0) {
    list.innerHTML = "<li><em>⚠️ 该分类暂无文件</em></li>";
  }

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

  if (results.length === 0) {
    list.innerHTML = "<li><em>无匹配文件</em></li>";
  }

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

document.getElementById("sortSelect").addEventListener("change", () => {
  const currentSub = document.getElementById("subcategoryTitle").textContent.split(" / ")[1];
  if (currentSub) showList(currentSub);
});

loadData();
