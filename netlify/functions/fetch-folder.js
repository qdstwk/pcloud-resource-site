
exports.handler = async function(event, context) {
  const { pcloudCode } = event.queryStringParameters;
  if (!pcloudCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing pcloudCode" }),
    };
  }

  try {
    const showRes = await fetch(`https://eapi.pcloud.com/showpublink?code=${pcloudCode}`);
    const showJson = await showRes.json();
    if (!showJson.metadata || !showJson.metadata.folderid) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Folder not found" }),
      };
    }

    const folderid = showJson.metadata.folderid;
    const listRes = await fetch(`https://eapi.pcloud.com/listfolder?folderid=${folderid}&recursive=1`);
    const listJson = await listRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(listJson.metadata.contents || []),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", detail: err.toString() }),
    };
  }
};
