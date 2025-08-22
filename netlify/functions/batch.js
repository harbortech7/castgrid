const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Tenant',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Check authentication
        const adminToken = event.headers['x-admin-token'];
        const tenant = event.headers['x-tenant'];
        
        if (!adminToken || !tenant) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Missing authentication headers' })
            };
        }

        // Validate admin token
        if (adminToken !== process.env.ADMIN_TOKEN) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Invalid admin token' })
            };
        }

        // Parse request body
        const { requests } = JSON.parse(event.body);
        
        if (!Array.isArray(requests) || requests.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid requests array' })
            };
        }

        // Limit batch size for performance
        if (requests.length > 50) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Batch size too large. Maximum 50 requests allowed.' })
            };
        }

        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const repoOwner = process.env.GITHUB_REPO.split('/')[0];
        const repoName = process.env.GITHUB_REPO.split('/')[1];
        const branch = process.env.GITHUB_BRANCH || 'main';

        // Process batch requests
        const results = await processBatchRequests(octokit, repoOwner, repoName, branch, tenant, requests);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                results: results,
                processed: results.length,
                message: `Processed ${results.length} requests successfully`
            })
        };

    } catch (error) {
        console.error('Batch operation error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};

async function processBatchRequests(octokit, owner, repo, branch, tenant, requests) {
    const results = [];
    
    for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        
        try {
            let result;
            
            switch (request.endpoint) {
                case 'devices':
                    result = await processDeviceRequest(octokit, owner, repo, branch, tenant, request);
                    break;
                    
                case 'grids':
                    result = await processGridRequest(octokit, owner, repo, branch, tenant, request);
                    break;
                    
                case 'media-boxes':
                    result = await processMediaBoxRequest(octokit, owner, repo, branch, tenant, request);
                    break;
                    
                case 'media-items':
                    result = await processMediaItemRequest(octokit, owner, repo, branch, tenant, request);
                    break;
                    
                default:
                    throw new Error(`Unknown endpoint: ${request.endpoint}`);
            }
            
            results.push({
                index: i,
                success: true,
                data: result
            });
            
        } catch (error) {
            results.push({
                index: i,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

async function processDeviceRequest(octokit, owner, repo, branch, tenant, request) {
    const devicesPath = `data/tenants/${tenant}/devices.json`;
    
    if (request.method === 'POST') {
        // Create or update device
        const device = request.data;
        
        try {
            const existingResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: devicesPath,
                ref: branch
            });
            
            let devices = [];
            if (existingResponse.data.content) {
                const content = Buffer.from(existingResponse.data.content, 'base64').toString();
                devices = JSON.parse(content);
            }
            
            // Check if device exists
            const existingIndex = devices.findIndex(d => d.deviceId === device.deviceId);
            
            if (existingIndex >= 0) {
                devices[existingIndex] = { ...devices[existingIndex], ...device };
            } else {
                devices.push(device);
            }
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: devicesPath,
                message: `Update devices: ${device.deviceId}`,
                content: Buffer.from(JSON.stringify(devices, null, 2)).toString('base64'),
                branch: branch,
                sha: existingResponse.data.sha
            });
            
            return device;
            
        } catch (error) {
            if (error.status === 404) {
                // Create new file
                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: devicesPath,
                    message: `Create devices file`,
                    content: Buffer.from(JSON.stringify([device], null, 2)).toString('base64'),
                    branch: branch
                });
                
                return device;
            }
            throw error;
        }
    }
    
    throw new Error(`Unsupported method: ${request.method}`);
}

async function processGridRequest(octokit, owner, repo, branch, tenant, request) {
    const gridsPath = `data/tenants/${tenant}/grids.json`;
    
    if (request.method === 'PUT') {
        // Update grid
        const grid = request.data;
        
        try {
            const existingResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: gridsPath,
                ref: branch
            });
            
            let grids = [];
            if (existingResponse.data.content) {
                const content = Buffer.from(existingResponse.data.content, 'base64').toString();
                grids = JSON.parse(content);
            }
            
            // Find and update grid
            const gridIndex = grids.findIndex(g => g.gridId === grid.gridId);
            
            if (gridIndex >= 0) {
                grids[gridIndex] = { ...grids[gridIndex], ...grid };
            } else {
                grids.push(grid);
            }
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: gridsPath,
                message: `Update grid: ${grid.gridId}`,
                content: Buffer.from(JSON.stringify(grids, null, 2)).toString('base64'),
                branch: branch,
                sha: existingResponse.data.sha
            });
            
            return grid;
            
        } catch (error) {
            if (error.status === 404) {
                // Create new file
                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: gridsPath,
                    message: `Create grids file`,
                    content: Buffer.from(JSON.stringify([grid], null, 2)).toString('base64'),
                    branch: branch
                });
                
                return grid;
            }
            throw error;
        }
    }
    
    throw new Error(`Unsupported method: ${request.method}`);
}

async function processMediaBoxRequest(octokit, owner, repo, branch, tenant, request) {
    const mediaBoxesPath = `data/tenants/${tenant}/media-boxes.json`;
    
    if (request.method === 'POST') {
        // Create or update media box
        const mediaBox = request.data;
        
        try {
            const existingResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: mediaBoxesPath,
                ref: branch
            });
            
            let mediaBoxes = [];
            if (existingResponse.data.content) {
                const content = Buffer.from(existingResponse.data.content, 'base64').toString();
                mediaBoxes = JSON.parse(content);
            }
            
            // Check if media box exists
            const existingIndex = mediaBoxes.findIndex(mb => mb.mediaBoxId === mediaBox.mediaBoxId);
            
            if (existingIndex >= 0) {
                mediaBoxes[existingIndex] = { ...mediaBoxes[existingIndex], ...mediaBox };
            } else {
                mediaBoxes.push(mediaBox);
            }
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: mediaBoxesPath,
                message: `Update media box: ${mediaBox.mediaBoxId}`,
                content: Buffer.from(JSON.stringify(mediaBoxes, null, 2)).toString('base64'),
                branch: branch,
                sha: existingResponse.data.sha
            });
            
            return mediaBox;
            
        } catch (error) {
            if (error.status === 404) {
                // Create new file
                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: mediaBoxesPath,
                    message: `Create media boxes file`,
                    content: Buffer.from(JSON.stringify([mediaBox], null, 2)).toString('base64'),
                    branch: branch
                });
                
                return mediaBox;
            }
            throw error;
        }
    }
    
    throw new Error(`Unsupported method: ${request.method}`);
}

async function processMediaItemRequest(octokit, owner, repo, branch, tenant, request) {
    const mediaItemsPath = `data/tenants/${tenant}/media-items.json`;
    
    if (request.method === 'POST') {
        // Create or update media item
        const mediaItem = request.data;
        
        try {
            const existingResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: mediaItemsPath,
                ref: branch
            });
            
            let mediaItems = [];
            if (existingResponse.data.content) {
                const content = Buffer.from(existingResponse.data.content, 'base64').toString();
                mediaItems = JSON.parse(content);
            }
            
            // Check if media item exists
            const existingIndex = mediaItems.findIndex(mi => mi.mediaId === mediaItem.mediaId);
            
            if (existingIndex >= 0) {
                mediaItems[existingIndex] = { ...mediaItems[existingIndex], ...mediaItem };
            } else {
                mediaItems.push(mediaItem);
            }
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: mediaItemsPath,
                message: `Update media item: ${mediaItem.mediaId}`,
                content: Buffer.from(JSON.stringify(mediaItems, null, 2)).toString('base64'),
                branch: branch,
                sha: existingResponse.data.sha
            });
            
            return mediaItem;
            
        } catch (error) {
            if (error.status === 404) {
                // Create new file
                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: mediaItemsPath,
                    message: `Create media items file`,
                    content: Buffer.from(JSON.stringify([mediaItem], null, 2)).toString('base64'),
                    branch: branch
                });
                
                return mediaItem;
            }
            throw error;
        }
    }
    
    throw new Error(`Unsupported method: ${request.method}`);
}
