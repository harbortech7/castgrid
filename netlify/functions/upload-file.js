const { readJson, writeJson } = require('./githubClient');
const { getTenantFromEvent } = require('./util');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Tenant',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tenant = getTenantFromEvent(event, context);
    if (!tenant) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Unauthorized - No tenant specified' })
      };
    }

    const { fileName, content, mimeType } = JSON.parse(event.body);
    
    if (!fileName || !content || !mimeType) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required fields: fileName, content, mimeType' })
      };
    }

    // Create the file path in GitHub
    const filePath = `data/${tenant}/${fileName}`;
    
    // Write the file content to GitHub
    const result = await writeJson({
      repo: process.env.GITHUB_REPO,
      path: filePath,
      content: content,
      token: process.env.GITHUB_TOKEN,
      message: `Add media file: ${fileName}`,
      branch: process.env.GITHUB_BRANCH || 'main'
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        fileName: fileName,
        filePath: filePath,
        downloadUrl: result.content.download_url
      })
    };

  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
