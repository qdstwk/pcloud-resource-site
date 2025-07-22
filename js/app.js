
const ITEMS_PER_PAGE = 10;
let allResources = [];
let currentCategory = null;
let currentSubcategory = null;
let currentFiltered = [];
let currentPage = 1;

function showLoading(title, progressText = "") {
  document.getElementById("resourceList").innerHTML = `<li>🔄 正在加载 ${title}… ${progressText}</li>`;
  document.getElementById("pagination").innerHTML = "";
}

function getFileIcon(ext) {
  ext = ext.toLowerCase();
  if (ext === "mp3" || ext === "wav") return "assets/icons/audio.png";
  if (ext === "mp4" || ext === "mov") return "assets/icons/video.png";
  if (ext === "pdf") return "assets/icons/pdf.png";
  if (ext === "zip" || ext === "rar") return "assets/icons/zip.png";
  return "assets/icons/file.png";
}

async function fetchPcloudFiles(code) {
  const resp = await fetch(`https://api.pcloud.com/listfolder?code=${code}&recursive=1`);
  const data = await resp.json();
  if (data.result !== 0) return [];
  return data.metadata.contents
    .filter(f => !f.isfolder)
    .map(file => ({
      name: file.name,
      url: `https://api.pcloud.com/getfilelink?fileid=${file.fileid}`,
      fileType: file.name.split(".").pop(),
      id: file.fileid
    }));
}

function getCacheKey() {
  return "resource_cache_v1";
}

function loadFromCache() {
  const cached = localStorage.getItem(getCacheKey());
  if (!cached) return null;
  try {
    const obj = JSON.parse(cached);
    const now = Date.now();
    if (now - obj.timestamp > 24 * 60 * 60 * 1000) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function saveToCache(data) {
  localStorage.setItem(getCacheKey(), JSON.stringify({ timestamp: Date.now(), data }));
}

async function loadResources() {
  const cachedData = loadFromCache();
  if (cachedData) {
    allResources = cachedData;
    renderSidebar(allResources);
    return;
  }

  const response = await fetch("resources.json");
  const resourceDefs = await response.json();
  allResources = [];
  let totalTasks = resourceDefs.reduce((sum, def) => sum + def.sources.length, 0);
  let currentTasks = 0;

  for (const def of resourceDefs) {
    const { type, subtype, sources } = def;
    let merged = [];

    for (const src of sources) {
      currentTasks++;
      const progress = `（${currentTasks}/${totalTasks}）`;
      showLoading(`${type}/${subtype}`, progress);

      if (src.type === "local") {
        merged = merged.concat(src.items.map(item => ({
          ...item,
          type,
          subtype
        })));
      } else if (src.type === "remote" && src.pcloudCode) {
        const items = await fetchPcloudFiles(src.pcloudCode);
        merged = merged.concat(items.map(item => ({
          ...item,
          type,
          subtype
        })));
      }
    }

    const existingIds = new Set(allResources.map(r => r.id));
    for (const item of merged) {
      if (!existingIds.has(item.id)) {
        allResources.push(item);
        existingIds.add(item.id);
      }
    }
  }

  saveToCache(allResources);
  renderSidebar(allResources);
}

function renderSidebar(resources) {
  const sidebar = document.getElementById("sidebar");
  const grouped = {};

  for (const item of resources) {
    if (!grouped[item.type]) grouped[item.type] = new Set();
    grouped[item.type].add(item.subtype);
  }

  sidebar.innerHTML = "";
  for (const [cat, subSet] of Object.entries(grouped)) {
    const h3 = document.createElement("h3");
    h3.textContent = cat;
    sidebar.appendChild(h3);
    const ul = document.createElement("ul");
    for (const sub of subSet) {
      const li = document.createElement("li");
      li.textContent = sub;
      li.addEventListener("click", () => {
        currentCategory = cat;
        currentSubcategory = sub;
        currentPage = 1;
        document.getElementById("subcategoryTitle").textContent = `${cat} / ${sub}`;
        updateFilteredList();
      });
      ul.appendChild(li);
    }
    sidebar.appendChild(ul);
  }
}

function updateFilteredList() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const keywords = input.split(/\s+/).filter(k => k.length > 0);

  currentFiltered = allResources.filter(item =>
    item.type === currentCategory &&
    item.subtype === currentSubcategory &&
    keywords.every(k => item.name.toLowerCase().includes(k))
  );

  renderList();
}

function renderList() {
  const list = document.getElementById("resourceList");
  const pagination = document.getElementById("pagination");
  list.innerHTML = "";
  pagination.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = currentFiltered.slice(start, start + ITEMS_PER_PAGE);

  for (const item of pageItems) {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${getFileIcon(item.fileType)}" alt="">
      <div>
        <a href="${item.url}" target="_blank">${item.name}</a><br/>
        <small>${item.fileType.toUpperCase()}</small>
      </div>`;
    list.appendChild(li);
  }

  const totalPages = Math.ceil(currentFiltered.length / ITEMS_PER_PAGE);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderList();
    });
    pagination.appendChild(btn);
  }
}

document.getElementById("searchInput").addEventListener("input", () => {
  currentPage = 1;
  updateFilteredList();
});

loadResources();
