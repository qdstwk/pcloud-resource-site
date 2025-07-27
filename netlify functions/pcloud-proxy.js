const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { code } = event.queryStringParameters;
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code parameter' }) };
  }

  try {
    const response = await fetch(`https://api.pcloud.com/listfolder?code=${code}`);
    if (!response.ok) throw new Error(`API响应失败: ${response.status}`);

    const data = await response.json();
    if (data.result !== 0) throw new Error(`pCloud错误: ${data.error}`);

    const files = (data.metadata?.contents || [])
      .filter(item => !item.isfolder)
      .map(file => ({
        name: file.name,
        url: `https://e.pcloud.link/publink/show?code=${code}&fileid=${file.fileid}`
      }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: '文件列表获取失败',
        details: error.message 
      })
    };
  }
};
