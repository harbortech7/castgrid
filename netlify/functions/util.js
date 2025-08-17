const { readJson, writeJson } = require('./githubClient');

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

function getTenantFromEvent(event, context) {
  // 1) Netlify Identity (preferred)
  const user = context && context.clientContext && context.clientContext.user;
  if (user) {
    const t = (user.app_metadata && (user.app_metadata.tenant || user.app_metadata.tenantSlug)) || null;
    if (t) return t;
    const roles = (user.app_metadata && user.app_metadata.roles) || [];
    for (const role of roles) {
      if (role.startsWith('tenant:')) return role.split(':')[1];
    }
    throw new Error('No tenant assigned to user');
  }

  // 2) Admin token fallback (simple setup)
  const adminToken = process.env.ADMIN_TOKEN || '';
  const headerToken = (event.headers && (event.headers['x-admin-token'] || event.headers['X-Admin-Token'])) || '';
  const tenantHeader = (event.headers && (event.headers['x-tenant'] || event.headers['X-Tenant'])) || '';
  const tenantQuery = (event.queryStringParameters && (event.queryStringParameters.tenant || '')) || '';
  const tenant = tenantHeader || tenantQuery;
  if (adminToken && headerToken && adminToken === headerToken && tenant) {
    return tenant;
  }

  throw new Error('Unauthorized');
}

function getRepoConfig() {
  return {
    repo: requireEnv('GITHUB_REPO'),
    branch: process.env.GITHUB_BRANCH || 'main',
    token: requireEnv('GITHUB_TOKEN')
  };
}

function pathFor(tenant, file) {
  return `data/tenants/${tenant}/${file}`;
}

async function readTenantJson(tenant, file, defaults = []) {
  try {
    const { repo, token, branch } = getRepoConfig();
    const { data } = await readJson({ repo, path: pathFor(tenant, file), token, ref: branch });
    return data || defaults;
  } catch (err) {
    // If file doesn't exist (or any other read error), return defaults
    // This makes the function more resilient for new tenants.
    console.warn(`Could not read ${file} for tenant ${tenant}. Returning default value. Error: ${err.message}`);
    return defaults;
  }
}

async function writeTenantJson(tenant, file, data, message) {
  const { repo, token, branch } = getRepoConfig();
  return writeJson({ repo, path: pathFor(tenant, file), token, branch, data, message });
}

module.exports = { getTenantFromEvent, readTenantJson, writeTenantJson };