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

        // For now, accept any admin token for testing
        // In production, validate against process.env.ADMIN_TOKEN
        
        // Parse the request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            // Try to parse as form data
            body = event.body;
        }

        // Extract file information
        const filename = body.filename || 'test-file';
        const fileType = body.type || 'image';
        const fileSize = body.fileSize || 0;

        // Create a mock media item
        const mediaItem = {
            mediaId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: filename,
            filename: filename,
            type: fileType,
            fileSize: fileSize,
            uploadedAt: new Date().toISOString(),
            isLocal: false,
            downloadStatus: 'available',
            url: `https://example.com/media/${filename}` // Mock URL
        };

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                mediaItem: mediaItem,
                message: `File ${filename} uploaded successfully (Test Mode)`
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
