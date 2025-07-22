// 模拟 resources.json 数据，直接写在 JS 中
const testData = [
  {
    type: "音频",
    subtype: "圣经朗读",
    sources: [
      {
        type: "remote",
        pcloudCode: "kZPMMfZiCcVI79eC9pKbDrMFeNAbursKdXk"
      }
    ]
  },
  {
    type: "视频",
    subtype: "属灵洞察力和敏感度",
    sources: [
      {
        type: "remote",
        pcloudCode: "kZYkamZk37jjnbr42XWMUvWP1MDaYC87r1X"
      }
    ]
  },
  {
    type: "视频",
    subtype: "讲道信息",
    sources: [
      {
        type: "remote",
        pcloudCode: "kZErJEZFfktW9umY6mJSDCwm6KgH5uA5VSk"
      }
    ]
  }
];

// 假设这是原始用于渲染资源的函数，你可以保留原来的 renderResources 函数
renderResources(testData);

document.getElementById("searchInput").addEventListener("input", function (e) {
  const keyword = e.target.value.trim().toLowerCase();
  if (!keyword) {
    document.getElementById("subcategoryTitle").textContent = "请选择分类";
    document.getElementById("resourceList").innerHTML = "";
    return;
  }

  const results = [];
  testData.forEach(item => {
    item.sources.forEach(src => {
      const title = `${item.type} - ${item.subtype}`.toLowerCase();
      if (title.includes(keyword) || src.pcloudCode.toLowerCase().includes(keyword)) {
        results.push({
          title: `${item.type} / ${item.subtype}`,
          pcloudCode: src.pcloudCode
        });
      }
    });
  });

   showSearchResults(results, keyword);
});

  function showSearchResults(results, keyword) {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = '';
  document.getElementById("subcategoryTitle").textContent = `搜索结果：「${keyword}」`;

  if (results.length === 0) {
    resourceList.innerHTML = "<li>未找到匹配的资源</li>";
    return;
  }

  results.forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `https://e.pcloud.link/publink/show?code=${item.pcloudCode}`;
    a.textContent = `${item.title}`;
    a.target = "_blank";
    li.appendChild(a);
    resourceList.appendChild(li);
  });
}



// 下面是简化版的 renderResources 示例（你可以按实际代码替换或参考）
function renderResources(data) {
  const sidebar = document.getElementById("sidebar");
  const resourceList = document.getElementById("resourceList");
  sidebar.innerHTML = '';
  resourceList.innerHTML = '';

  // 加载分类菜单
  const categories = {};
  data.forEach(item => {
    if (!categories[item.type]) categories[item.type] = [];
    if (!categories[item.type].includes(item.subtype)) {
      categories[item.type].push(item.subtype);
    }
  });

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

  // 初始状态可不加载任何资源
}

function showResources(type, subtype) {
  const resourceList = document.getElementById("resourceList");
  resourceList.innerHTML = '';
  const matched = testData.find(item => item.type === type && item.subtype === subtype);
  if (!matched) return;
  matched.sources.forEach(src => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `https://e.pcloud.link/publink/show?code=${src.pcloudCode}`;
    a.textContent = `${type} - ${subtype}`;
    a.target = "_blank";
    li.appendChild(a);
    resourceList.appendChild(li);
  });

  document.getElementById("subcategoryTitle").textContent = `${type} / ${subtype}`;
}
