exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 204, 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token,X-Tenant'
      }, 
      body: '' 
    };
  }

  try {
    const envCheck = {
      hasGithubRepo: !!process.env.GITHUB_REPO,
      hasGithubToken: !!process.env.GITHUB_TOKEN,
      hasAdminToken: !!process.env.ADMIN_TOKEN,
      githubRepo: process.env.GITHUB_REPO || 'missing',
      githubBranch: process.env.GITHUB_BRANCH || 'main',
      headers: {
        adminToken: event.headers['x-admin-token'] || event.headers['X-Admin-Token'] || 'missing',
        tenant: event.headers['x-tenant'] || event.headers['X-Tenant'] || 'missing'
      }
    };

    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envCheck, null, 2)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
