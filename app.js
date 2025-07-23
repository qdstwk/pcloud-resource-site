fetch('final_config.json')
  .then(res => res.json())
  .then(config => {
    buildPage(config);
  })
  .catch(err => {
    console.error("加载配置失败：", err);
  });

function buildPage(config) {
  const content = document.getElementById('content');
  content.innerHTML = ''; // 清空加载提示

  config.categories.forEach(category => {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';

    const title = document.createElement('h2');
    title.textContent = category.type;
    catDiv.appendChild(title);

    const list = document.createElement('ul');
    (category.subcategories || []).forEach(sub => {
      const subItem = document.createElement('li');
      subItem.textContent = sub.subtype;

      // 如果有子子类（如年份、月份），继续展开
      if (sub.subcategories) {
        const sublist = document.createElement('ul');
        sub.subcategories.forEach(year => {
          const yearItem = document.createElement('li');
          yearItem.textContent = year.subtype;

          if (year.subcategories) {
            const monthList = document.createElement('ul');
            year.subcategories.forEach(month => {
              const monthItem = document.createElement('li');
              const a = document.createElement('a');
              a.textContent = month.subtype;
              if (month.sources?.[0]?.pcloudCode) {
                a.href = `https://e.pcloud.link/publink/show?code=${month.sources[0].pcloudCode}`;
                a.target = '_blank';
              } else {
                a.href = '#';
              }
              monthItem.appendChild(a);
              monthList.appendChild(monthItem);
            });
            yearItem.appendChild(monthList);
          }

          sublist.appendChild(yearItem);
        });
        subItem.appendChild(sublist);
      }

      list.appendChild(subItem);
    });

    catDiv.appendChild(list);
    content.appendChild(catDiv);
  });
}
