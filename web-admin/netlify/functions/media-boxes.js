const { getTenantFromEvent, readTenantJson, writeTenantJson } = require('./util');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  try {
    const tenant = getTenantFromEvent(event, context);

    if (event.httpMethod === 'GET') {
      const boxes = await readTenantJson(tenant, 'media-boxes.json', []);
      return ok(boxes);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body || !body.mediaBoxId) return bad('mediaBoxId required');
      const boxes = await readTenantJson(tenant, 'media-boxes.json', []);
      const idx = boxes.findIndex(b => b.mediaBoxId === body.mediaBoxId);
      if (idx >= 0) boxes[idx] = body; else boxes.push(body);
      await writeTenantJson(tenant, 'media-boxes.json', boxes, `feat: upsert mediabox ${body.mediaBoxId}`);
      return ok({ success: true });
    }

    if (event.httpMethod === 'DELETE') {
      const mediaBoxId = event.queryStringParameters && event.queryStringParameters.mediaBoxId;
      if (!mediaBoxId) return bad('mediaBoxId required');
      let boxes = await readTenantJson(tenant, 'media-boxes.json', []);
      boxes = boxes.filter(b => b.mediaBoxId !== mediaBoxId);
      await writeTenantJson(tenant, 'media-boxes.json', boxes, `chore: delete mediabox ${mediaBoxId}`);
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