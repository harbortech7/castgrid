const { getTenantFromEvent, readTenantJson, writeTenantJson } = require('./util');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  try {
    const tenant = getTenantFromEvent(event, context);

    if (event.httpMethod === 'GET') {
      const deviceId = event.queryStringParameters && event.queryStringParameters.deviceId;
      const grids = await readTenantJson(tenant, 'grids.json', []);
      return ok(deviceId ? grids.filter(g => g.deviceId === deviceId) : grids);
    }

    if (event.httpMethod === 'PUT') {
      const gridId = event.queryStringParameters && event.queryStringParameters.gridId;
      if (!gridId) return bad('gridId required');
      const body = JSON.parse(event.body || '{}');
      const grids = await readTenantJson(tenant, 'grids.json', []);
      const idx = grids.findIndex(g => g.gridId === gridId);
      if (idx < 0) return bad('grid not found');
      grids[idx] = { ...grids[idx], ...body };
      await writeTenantJson(tenant, 'grids.json', grids, `feat: update grid ${gridId}`);
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
function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS' }; }