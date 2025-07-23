const config = {
  "categories": [
    {
      "type": "视频",
      "subcategories": [
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
          "subtype": "诗歌视频",
          "sources": [
            {
              "type": "remote",
              "pcloudCode": "kZ10FEZN4sV6JJfSKY4p6L9aDM1py7opvI7"
            }
          ]
        }
      ]
    },
    {
      "type": "音频",
      "subcategories": [
        {
          "subtype": "圣经音频",
          "sources": [
            {
              "type": "remote",
              "pcloudCode": "kZuqFEZkWN05KTDOE8ICX3UCHKtvkV91Qik"
            }
          ]
        }
      ]
    }
  ]
};


const urlParams = new URLSearchParams(location.search);
const currentType = location.pathname.replace("/", "") || "全部";
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const loadingDiv = document.getElementById("loading");
const resourceList = document.getElementById("resourceList");

let allItems = [];

async function fetchFolder(pcloudCode) {
  try {
    const res = await fetch(`https://e.pcloud.link/publink/show?code=${pcloudCode}`);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const links = [...doc.querySelectorAll("a")];
    return links
      .map(a => {
        const name = a.textContent.trim();
        const href = a.href;
        if (href && name && !href.endsWith("/")) {
          return { name, url: href, time: Date.now() };
        }
      })
      .filter(Boolean);
  } catch (e) {
    console.warn("加载失败", pcloudCode, e);
    return [];
  }
}

async function loadAll() {
  loadingDiv.style.display = "block";
  for (const cat of config.categories) {
    if (cat.type !== currentType && currentType !== "全部") continue;
    for (const sub of cat.subcategories) {
      for (const src of sub.sources) {
        const items = await fetchFolder(src.pcloudCode);
        allItems = allItems.concat(items.map(item => ({
          ...item,
          type: cat.type,
          subtype: sub.subtype
        })));
      }
    }
  }
  renderList(allItems);
  loadingDiv.style.display = "none";
}

function renderList(items) {
  const keyword = (searchInput.value || "").trim().toLowerCase();
  const sortBy = sortSelect.value;

  let filtered = items.filter(i =>
    i.name.toLowerCase().includes(keyword)
  );

  if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "time") {
    filtered.sort((a, b) => b.time - a.time);
  }

  resourceList.innerHTML = "";
  filtered.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>${item.name}</strong><br><a href="${item.url}" target="_blank">打开</a>`;
    resourceList.appendChild(div);
  });
}

searchInput.addEventListener("input", () => renderList(allItems));
sortSelect.addEventListener("change", () => renderList(allItems));

loadAll();

loadAll();
