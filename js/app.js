// 模拟资源数据结构（嵌入文件夹代码）
const testData = [
  {
    "type": "视频",
    "subtypes": [
      {
        "subtype": "属灵洞察力和敏感度",
        "sources": [
          {
            "type": "remote",
            "pcloudCode": "kZYkamZk37jjnbr42XWMUvWP1MDaYC87r1X"
          }
        ]
      },
      {
        "subtype": "讲道信息",
        "sources": [
          {
            "type": "remote",
            "pcloudCode": "kZErJEZFfktW9umY6mJSDCwm6KgH5uA5VSk"
          }
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
          {
            "type": "remote",
            "pcloudCode": "kZPMMfZiCcVI79eC9pKbDrMFeNAbursKdXk"
          }
        ]
      }
    ]
  }
];

let allFiles = []; // 将从所有目录加载到的文件统一存储在这里

async function loadAndRenderAll() {
  const sidebar = document.getElementById("sidebar");
  const resourceList = document.getElementById("resourceList");
  sidebar.innerHTML = '';
  resourceList.innerHTML = '';
  allFiles = [];

  const categories = {};
  for (const item of testData) {
    if (!categories[item.type]) categories[item.type] = [];
    if (!categories[item.type].includes(item.subtype)) {
      categories[item.type].push(item.subtype);
    }

    for (const src of item.sources) {
      const folderUrl = `https://e.pcloud.link/publink/downloadshow?code=${src.pcloudCode}`;
      const folderApi = `https://eapi.pcloud.com/showpublink?code=${src.pcloudCode}`;

      try {
        const res = await fetch(folderApi);
        const json = await res.json();
        if (json.result === 0) {
          const contents = json.metadata.contents || [];
          contents.forEach(file => {
            if (file.isfolder) return;
            allFiles.push({
              name: file.name,
              link: `https://e.pcloud.link/publink/show?code=${src.pcloudCode}#${file.name}`,
              type: item.type,
              subtype: item.subtype
            });
          });
        }
      } catch (err) {
        console.warn("加载目录失败", src.pcloudCode, err);
      }
    }
  }

  for (const type in categories) {
    const section = document.createElement("div");
    section.innerHTML = `<h3>${type}</h3>`;
    categories[type].forEach(subtype => {
      const btn = document.createElement("button");
      btn.textContent = subtype;
      btn.onclick = () => showResources(type, subtype);
      section.appendChild(btn);
    });
    sidebar.appendChild(section);
  }
}

function showResources(type, subtype) {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = '';
  const matched = allFiles.filter(f => f.type === type && f.subtype === subtype);
  if (!matched.length) return;

  matched.forEach(file => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = file.link;
    a.textContent = file.name;
    a.target = "_blank";
    li.appendChild(a);
    resourceList.appendChild(li);
  });

  document.getElementById("subcategoryTitle").textContent = `${type} / ${subtype}`;
}

// 搜索功能：匹配文件名、分类、子类
document.getElementById("searchInput").addEventListener("input", function (e) {
  const keyword = e.target.value.trim().toLowerCase();
  const results = [];

  if (!keyword) {
    document.getElementById("subcategoryTitle").textContent = "请选择分类";
    document.getElementById("resourceList").innerHTML = "";
    return;
  }

  allFiles.forEach(file => {
    const text = \`\${file.name} \${file.type} \${file.subtype}\`.toLowerCase();
    if (text.includes(keyword)) {
      results.push(file);
    }
  });

  showSearchResults(results, keyword);
});

function showSearchResults(results, keyword) {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = '';
  document.getElementById("subcategoryTitle").textContent = \`搜索结果：「\${keyword}」\`;

  if (results.length === 0) {
    resourceList.innerHTML = "<li>未找到匹配的资源</li>";
    return;
  }

  results.forEach(file => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = file.link;
    a.textContent = \`\${file.name}（\${file.type} / \${file.subtype}）\`;
    a.target = "_blank";
    li.appendChild(a);
    resourceList.appendChild(li);
  });
}

loadAndRenderAll();
