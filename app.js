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

function buildPage(config) {
  const content = document.getElementById('content');
  config.categories.forEach(category => {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';

    const title = document.createElement('h2');
    title.textContent = category.type;
    catDiv.appendChild(title);

    const list = document.createElement('ul');
    category.subcategories.forEach(sub => {
      const li = document.createElement('li');
      const link = document.createElement('a');

      // 默认使用第一个 source 的 pcloudCode
      const code = sub.sources[0]?.pcloudCode;
      link.href = `https://e.pcloud.link/publink/show?code=${code}`;
      link.target = '_blank';
      link.textContent = sub.subtype;

      li.appendChild(link);
      list.appendChild(li);
    });

    catDiv.appendChild(list);
    content.appendChild(catDiv);
  });
}

buildPage(config);
