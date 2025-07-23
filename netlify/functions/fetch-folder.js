
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

    const meta = showJson.metadata;
    if (!meta) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No metadata found", raw: showJson }),
      };
    }

    if (meta.folderid) {
      const folderid = meta.folderid;
      const listRes = await fetch(`https://eapi.pcloud.com/listfolder?folderid=${folderid}&recursive=1`);
      const listJson = await listRes.json();
      return {
        statusCode: 200,
        body: JSON.stringify(listJson.metadata?.contents || []),
      };
    }

    if (meta.fileid) {
      return {
        statusCode: 200,
        body: JSON.stringify([meta]),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unknown metadata type", raw: meta }),
    };

  } catch (err) {
    console.error("🔥 fetch-folder error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", detail: err.toString() }),
    };
  }
};
