const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

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

        // Parse multipart form data
        const formData = parseMultipartFormData(event.body, event.headers['content-type']);
        
        if (!formData.file || !formData.type || !formData.filename) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: file, type, filename' })
            };
        }

        // Validate file type
        const allowedTypes = {
            video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        };

        const fileExtension = formData.filename.split('.').pop().toLowerCase();
        const isValidType = allowedTypes[formData.type]?.includes(fileExtension);

        if (!isValidType) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: `Invalid file type: ${fileExtension}` })
            };
        }

        // Initialize GitHub client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        const repoOwner = process.env.GITHUB_REPO.split('/')[0];
        const repoName = process.env.GITHUB_REPO.split('/')[1];
        const branch = process.env.GITHUB_BRANCH || 'main';

        // Create file path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFilename = formData.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `data/tenants/${tenant}/media/${timestamp}_${safeFilename}`;

        // Convert file to base64 for GitHub storage
        const fileContent = formData.file.toString('base64');

        // Upload file to GitHub
        const uploadResponse = await octokit.repos.createOrUpdateFileContents({
            owner: repoOwner,
            repo: repoName,
            path: filePath,
            message: `Add media file: ${safeFilename}`,
            content: fileContent,
            branch: branch
        });

        // Create media item metadata
        const mediaItem = {
            mediaId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: formData.type,
            filename: safeFilename,
            originalFilename: formData.filename,
            filePath: filePath,
            fileSize: formData.file.length,
            uploadedAt: new Date().toISOString(),
            url: uploadResponse.data.content.download_url,
            duration: formData.type === 'image' ? 10 : 30, // Default durations
            isLocal: true,
            downloadStatus: 'available'
        };

        // Save media item metadata to GitHub
        const mediaItemsPath = `data/tenants/${tenant}/media-items.json`;
        
        try {
            // Get existing media items
            const existingResponse = await octokit.repos.getContent({
                owner: repoOwner,
                repo: repoName,
                path: mediaItemsPath,
                ref: branch
            });

            let mediaItems = [];
            if (existingResponse.data.content) {
                const content = Buffer.from(existingResponse.data.content, 'base64').toString();
                mediaItems = JSON.parse(content);
            }

            // Add new media item
            mediaItems.push(mediaItem);

            // Update media items file
            await octokit.repos.createOrUpdateFileContents({
                owner: repoOwner,
                repo: repoName,
                path: mediaItemsPath,
                message: `Add media item: ${safeFilename}`,
                content: Buffer.from(JSON.stringify(mediaItems, null, 2)).toString('base64'),
                branch: branch,
                sha: existingResponse.data.sha
            });

        } catch (error) {
            // File doesn't exist, create it
            if (error.status === 404) {
                await octokit.repos.createOrUpdateFileContents({
                    owner: repoOwner,
                    repo: repoName,
                    path: mediaItemsPath,
                    message: `Create media items file`,
                    content: Buffer.from(JSON.stringify([mediaItem], null, 2)).toString('base64'),
                    branch: branch
                });
            } else {
                throw error;
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                mediaItem: mediaItem,
                message: `File ${safeFilename} uploaded successfully`
            })
        };

    } catch (error) {
        console.error('Upload error:', error);
        
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

function parseMultipartFormData(body, contentType) {
    if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new Error('Invalid content type');
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
        throw new Error('No boundary found in content type');
    }

    const parts = body.split(`--${boundary}`);
    const formData = {};

    for (const part of parts) {
        if (part.trim() === '' || part.trim() === '--') continue;

        const lines = part.split('\r\n');
        let headerEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '') {
                headerEnd = i;
                break;
            }
        }

        if (headerEnd === -1) continue;

        const headers = lines.slice(0, headerEnd);
        const content = lines.slice(headerEnd + 1).join('\r\n').trim();

        // Parse content disposition header
        const contentDisposition = headers.find(h => h.startsWith('Content-Disposition:'));
        if (!contentDisposition) continue;

        const nameMatch = contentDisposition.match(/name="([^"]+)"/);
        if (!nameMatch) continue;

        const name = nameMatch[1];

        if (name === 'file') {
            // This is a file field
            const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
            if (filenameMatch) {
                formData.filename = filenameMatch[1];
            }
            formData.file = Buffer.from(content, 'binary');
        } else {
            // This is a regular field
            formData[name] = content;
        }
    }

    return formData;
}
