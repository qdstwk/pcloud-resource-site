
const https = require('https');

exports.handler = async function(event, context) {
  const code = event.queryStringParameters.pcloudCode;
  const url = `https://e.pcloud.link/publink/show?code=${code}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = Array.from(data.matchAll(/"name":"(.*?)"/g));
        const names = [...new Set(matches.map(m => m[1]))];
        resolve({
          statusCode: 200,
          body: JSON.stringify(names)
        });
      });
    }).on('error', (e) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: '请求失败' })
      });
    });
  });
};
