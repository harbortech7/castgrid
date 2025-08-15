const { readTenantJson } = require('./util');

exports.handler = async (event) => {
  try {
    const parts = (event.path || '').split('/').filter(Boolean);
    // path: /api/public/layout/:tenant/:deviceId
    const tenant = parts[parts.length - 2];
    const deviceId = parts[parts.length - 1];
    if (!tenant || !deviceId) return bad('tenant and deviceId required');

    const [devices, grids, boxes, items] = await Promise.all([
      readTenantJson(tenant, 'devices.json', []),
      readTenantJson(tenant, 'grids.json', []),
      readTenantJson(tenant, 'media-boxes.json', []),
      readTenantJson(tenant, 'media-items.json', [])
    ]);

    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) return notFound('device not found');
    const deviceGrids = grids.filter(g => g.deviceId === deviceId).sort((a,b) => a.position - b.position);
    const usedBoxIds = [...new Set(deviceGrids.map(g => g.mediaBoxId).filter(Boolean))];
    const usedBoxes = boxes.filter(b => usedBoxIds.includes(b.mediaBoxId));
    const usedItemIds = [...new Set(usedBoxes.flatMap(b => b.mediaItems))];
    const usedItems = items.filter(i => usedItemIds.includes(i.mediaId));

    return ok({ device, grids: deviceGrids, mediaBoxes: usedBoxes, mediaItems: usedItems });
  } catch (err) {
    return error(err);
  }
};

function ok(data){ return { statusCode: 200, headers: cors(), body: JSON.stringify(data) }; }
function bad(message){ return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: message }) }; }
function notFound(message){ return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: message }) }; }
function error(err){ return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: err.message }) }; }
function cors(){ return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }; }