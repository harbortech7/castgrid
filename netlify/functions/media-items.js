const { getTenantFromEvent, readTenantJson, writeTenantJson } = require('./util');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  try {
    const tenant = getTenantFromEvent(event, context);

    if (event.httpMethod === 'GET') {
      const items = await readTenantJson(tenant, 'media-items.json', []);
      return ok(items);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body || !body.mediaId) return bad('mediaId required');
      const items = await readTenantJson(tenant, 'media-items.json', []);
      const idx = items.findIndex(i => i.mediaId === body.mediaId);
      if (idx >= 0) items[idx] = body; else items.push(body);
      await writeTenantJson(tenant, 'media-items.json', items, `feat: upsert media ${body.mediaId}`);
      return ok({ success: true });
    }

    if (event.httpMethod === 'DELETE') {
      const mediaId = event.queryStringParameters && event.queryStringParameters.mediaId;
      if (!mediaId) return bad('mediaId required');
      let items = await readTenantJson(tenant, 'media-items.json', []);
      items = items.filter(i => i.mediaId !== mediaId);
      await writeTenantJson(tenant, 'media-items.json', items, `chore: delete media ${mediaId}`);
      return ok({ success: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return error(err);
  }
};

function ok(data){ return { statusCode: 200, headers: cors(), body: JSON.stringify(data) }; }
function bad(message){ return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: message }) }; }
function error(err){ return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: err.message }) }; }
function methodNotAllowed(){ return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method Not Allowed' }) }; }
function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' }; }