const { getTenantFromEvent, readTenantJson, writeTenantJson } = require('./util');

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  try {
    const tenant = getTenantFromEvent(event, context);

    if (event.httpMethod === 'GET') {
      const devices = await readTenantJson(tenant, 'devices.json', []);
      return ok(devices);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (!body || !body.deviceId) return bad('deviceId required');
      const devices = await readTenantJson(tenant, 'devices.json', []);
      const idx = devices.findIndex(d => d.deviceId === body.deviceId);
      if (idx >= 0) devices[idx] = body; else devices.push(body);
      await writeTenantJson(tenant, 'devices.json', devices, `feat: upsert device ${body.deviceId}`);
      return ok({ success: true });
    }

    if (event.httpMethod === 'DELETE') {
      const deviceId = event.queryStringParameters && event.queryStringParameters.deviceId;
      if (!deviceId) return bad('deviceId required');
      let devices = await readTenantJson(tenant, 'devices.json', []);
      devices = devices.filter(d => d.deviceId !== deviceId);
      await writeTenantJson(tenant, 'devices.json', devices, `chore: delete device ${deviceId}`);
      return ok({ success: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return error(err);
  }
};

function ok(data){
  return { statusCode: 200, headers: cors(), body: JSON.stringify(data) };
}
function bad(message){
  return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: message }) };
}
function error(err){
  return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: err.message }) };
}
function methodNotAllowed(){
  return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method Not Allowed' }) };
}
function cors(){
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };
}