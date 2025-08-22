const { Octokit } = require('@octokit/rest');

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Tenant',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const repoOwner = process.env.GITHUB_REPO.split('/')[0];
        const repoName = process.env.GITHUB_REPO.split('/')[1];
        const branch = process.env.GITHUB_BRANCH || 'main';

        // Get storage statistics
        const stats = await getStorageStats(octokit, repoOwner, repoName, branch, tenant);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(stats)
        };

    } catch (error) {
        console.error('Storage stats error:', error);
        
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

async function getStorageStats(octokit, owner, repo, branch, tenant) {
    try {
        // Get media items
        const mediaItemsPath = `data/tenants/${tenant}/media-items.json`;
        let mediaItems = [];
        
        try {
            const response = await octokit.repos.getContent({
                owner,
                repo,
                path: mediaItemsPath,
                ref: branch
            });
            
            if (response.data.content) {
                const content = Buffer.from(response.data.content, 'base64').toString();
                mediaItems = JSON.parse(content);
            }
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
        }

        // Calculate storage statistics
        let totalSize = 0;
        let fileCount = 0;
        const fileTypes = {};
        const recentUploads = [];

        mediaItems.forEach(item => {
            if (item.fileSize) {
                totalSize += item.fileSize;
            }
            fileCount++;

            // Count file types
            const type = item.type || 'unknown';
            fileTypes[type] = (fileTypes[type] || 0) + 1;

            // Track recent uploads
            if (item.uploadedAt) {
                const uploadDate = new Date(item.uploadedAt);
                const daysAgo = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysAgo <= 7) { // Last 7 days
                    recentUploads.push({
                        filename: item.filename,
                        type: item.type,
                        size: item.fileSize,
                        uploadedAt: item.uploadedAt
                    });
                }
            }
        });

        // Sort recent uploads by date
        recentUploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // Get repository size info (approximate)
        let repoSize = 0;
        try {
            const repoResponse = await octokit.repos.get({
                owner,
                repo
            });
            repoSize = repoResponse.data.size * 1024; // Convert KB to bytes
        } catch (error) {
            console.warn('Could not get repository size:', error.message);
        }

        // Calculate available space (GitHub has 100GB limit for free accounts)
        const githubLimit = 100 * 1024 * 1024 * 1024; // 100GB in bytes
        const availableSpace = Math.max(0, githubLimit - repoSize);

        // Get storage recommendations
        const recommendations = getStorageRecommendations(totalSize, fileCount, fileTypes);

        return {
            totalSize,
            usedStorage: totalSize,
            availableSpace,
            fileCount,
            fileTypes,
            recentUploads: recentUploads.slice(0, 10), // Last 10 uploads
            recommendations,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        throw new Error(`Failed to get storage stats: ${error.message}`);
    }
}

function getStorageRecommendations(totalSize, fileCount, fileTypes) {
    const recommendations = [];
    
    // Size recommendations
    const sizeInGB = totalSize / (1024 * 1024 * 1024);
    if (sizeInGB > 50) {
        recommendations.push({
            type: 'warning',
            message: 'Storage usage is high (>50GB). Consider archiving old media files.',
            action: 'Review and archive unused media files'
        });
    }
    
    if (sizeInGB > 80) {
        recommendations.push({
            type: 'critical',
            message: 'Storage usage is very high (>80GB). Immediate action required.',
            action: 'Delete unused files or upgrade storage plan'
        });
    }

    // File count recommendations
    if (fileCount > 1000) {
        recommendations.push({
            type: 'info',
            message: 'Large number of files detected. Consider organizing into collections.',
            action: 'Use media boxes to organize content'
        });
    }

    // File type recommendations
    const videoCount = fileTypes.video || 0;
    const imageCount = fileTypes.image || 0;
    
    if (videoCount > imageCount * 2) {
        recommendations.push({
            type: 'info',
            message: 'Video files dominate your library. Consider adding more images for variety.',
            action: 'Add image content to balance media types'
        });
    }

    // Performance recommendations
    if (fileCount > 500) {
        recommendations.push({
            type: 'info',
            message: 'Consider implementing lazy loading for better performance.',
            action: 'Enable lazy loading in admin settings'
        });
    }

    return recommendations;
}
