// ===== CastGrid Admin Dashboard JavaScript =====

// Global variables
let apiBase = '/.netlify/functions';
let identityUser = null;
let currentDevices = [];
let currentMediaItems = [];
let currentMediaBoxes = [];
let currentGrids = [];
let setupProgress = {
    step1: false,
    step2: { firestore: false, storage: false, hosting: false },
    step3: false,
    step4: false
};

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    restoreAccessibilityPrefs();
});

function restoreAccessibilityPrefs(){
    const contrast = localStorage.getItem('cg_ui_contrast') === '1';
    const large = localStorage.getItem('cg_ui_largetext') === '1';
    document.body.classList.toggle('high-contrast', contrast);
    document.body.classList.toggle('large-text', large);
    const cBtn = document.getElementById('toggle-contrast'); if (cBtn) cBtn.setAttribute('aria-pressed', String(contrast));
    const tBtn = document.getElementById('toggle-text'); if (tBtn) tBtn.setAttribute('aria-pressed', String(large));
}

function initializeApp() {
    console.log('CastGrid Admin Dashboard Initialized');
    
    // Netlify Identity setup
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('login', user => { identityUser = user; updateConnectionStatus(true); });
        window.netlifyIdentity.on('logout', () => { identityUser = null; updateConnectionStatus(false); });
        window.netlifyIdentity.on('init', user => { identityUser = user; updateConnectionStatus(!!user); });
        window.netlifyIdentity.init();
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Accessibility toggles
    document.getElementById('toggle-contrast')?.addEventListener('click', function(){
        const on = !document.body.classList.contains('high-contrast');
        document.body.classList.toggle('high-contrast', on);
        this.setAttribute('aria-pressed', String(on));
        localStorage.setItem('cg_ui_contrast', on ? '1' : '0');
    });
    document.getElementById('toggle-text')?.addEventListener('click', function(){
        const on = !document.body.classList.contains('large-text');
        document.body.classList.toggle('large-text', on);
        this.setAttribute('aria-pressed', String(on));
        localStorage.setItem('cg_ui_largetext', on ? '1' : '0');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
    
    // API connection test
    document.getElementById('test-connection')?.addEventListener('click', testApiConnection);
    
    // Device management
    document.getElementById('device-form')?.addEventListener('submit', handleDeviceSubmit);
    
    // Modal controls
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Grid device selector
    document.getElementById('grid-device-selector')?.addEventListener('change', function() {
        const deviceId = this.value;
        if (deviceId) {
            loadGridLayout(deviceId);
        }
    });
    
    // Preview device selector
    document.getElementById('preview-device-selector')?.addEventListener('change', function() {
        const deviceId = this.value;
        if (deviceId) {
            loadPreview(deviceId);
        }
    });
    
    // Media filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMedia(this.dataset.filter);
        });
    });
    
    // Media search
    document.getElementById('media-search')?.addEventListener('input', function() {
        searchMedia(this.value);
    });
    
    // Global save button
    document.getElementById('save-all')?.addEventListener('click', saveAllChanges);

    // File Upload Setup
    setupFileUpload();
}

// ===== Navigation =====

function navigateToSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
    
    // Show section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`)?.classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'devices':
            loadDevices();
            break;
        case 'media':
            setupMediaLibrary();
            break;
        case 'mediaboxes':
            loadMediaBoxes();
            break;
        case 'grids':
            loadGridDesigner();
            break;
        case 'preview':
            loadPreviewSection();
            break;
    }
}

// ===== API Setup (Netlify Functions) =====

async function testApiConnection() {
    showLoading(true);
    const resultDiv = document.getElementById('connection-result');
    try {
        const res = await fetch(`${apiBase}/devices`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        resultDiv.className = 'connection-result success';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '✅ API connection successful!';
        setupProgress.step4 = true;
        saveSetupProgress();
        updateSetupUI();
        showNotification('API connection test passed!', 'success');
    } catch (error) {
        resultDiv.className = 'connection-result error';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '❌ Connection failed: ' + (error.message || 'Unknown error');
        showNotification('API connection test failed', 'error');
    } finally {
        showLoading(false);
    }
}

function authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (identityUser && identityUser.token) headers['Authorization'] = `Bearer ${identityUser.token.access_token}`;
    const token = localStorage.getItem('cg_admin_token');
    const tenant = localStorage.getItem('cg_admin_tenant');
    if (token && tenant) {
        headers['X-Admin-Token'] = token;
        headers['X-Tenant'] = tenant;
    }
    return headers;
}

function saveAdminAccess(){
    const token = document.getElementById('admin-token')?.value.trim();
    const tenant = document.getElementById('admin-tenant')?.value.trim();
    if (!token || !tenant) { showNotification('Enter both admin token and tenant', 'error'); return; }
    localStorage.setItem('cg_admin_token', token);
    localStorage.setItem('cg_admin_tenant', tenant);
    showNotification('Admin access code saved', 'success');
    updateConnectionStatus(true);
}

function updateConnectionStatus(connected) {
    const statusBtn = document.getElementById('firebase-status');
    if (connected) {
        statusBtn.className = 'status-btn connected';
        statusBtn.innerHTML = '<i class="fas fa-user-check"></i><span>Signed In</span>';
    } else {
        statusBtn.className = 'status-btn disconnected';
        statusBtn.innerHTML = '<i class="fas fa-user-times"></i><span>Not Signed In</span>';
    }
}

// ===== Setup Progress Management =====

function completeStep(stepNumber) {
    setupProgress[`step${stepNumber}`] = true;
    saveSetupProgress();
    updateSetupUI();
    showNotification(`Step ${stepNumber} completed!`, 'success');
}

function toggleService(serviceName) {
    setupProgress.step2[serviceName] = !setupProgress.step2[serviceName];
    saveSetupProgress();
    updateSetupUI();
    
    const allServicesEnabled = Object.values(setupProgress.step2).every(status => status);
    if (allServicesEnabled && !setupProgress.step2.completed) {
        setupProgress.step2.completed = true;
        showNotification('All Firebase services enabled!', 'success');
    }
}

function saveSetupProgress() {
    localStorage.setItem('castgrid-setup-progress', JSON.stringify(setupProgress));
}

function updateSetupUI() {
    // Update step completion status
    for (let i = 1; i <= 4; i++) {
        const step = document.querySelector(`[data-step="${i}"]`);
        if (step && setupProgress[`step${i}`]) {
            step.classList.add('completed');
        }
    }
    
    // Update service buttons
    Object.keys(setupProgress.step2).forEach(service => {
        if (service === 'completed') return;
        const button = document.querySelector(`[onclick="toggleService('${service}')"]`);
        if (button && setupProgress.step2[service]) {
            button.classList.remove('btn-secondary');
            button.classList.add('btn-primary');
            button.textContent = '✓ Enabled';
        }
    });
}

function loadStoredConfig() {
    const savedConfig = localStorage.getItem('castgrid-firebase-config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            const configText = `const firebaseConfig = ${JSON.stringify(config, null, 2)};`;
            document.getElementById('firebase-config').value = configText;
        } catch (error) {
            console.error('Error loading stored config:', error);
        }
    }
}

// ===== Device Management =====

async function loadDevices() {
    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/devices`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentDevices = await res.json();
        renderDevices();
        updateDeviceSelectors();
    } catch (error) {
        console.error('Error loading devices:', error);
        showNotification('Error loading devices: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderDevices() {
    const grid = document.getElementById('devices-grid');
    if (!grid) return;
    
    if (currentDevices.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <i class="fas fa-tv" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">No devices found</h3>
                <p style="color: #999;">Click "Add Device" to create your first TV device</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = currentDevices.map(device => `
        <div class="device-card" data-device-id="${device.deviceId}">
            <div class="device-header">
                <div class="device-info">
                    <h3>${device.deviceId}</h3>
                    <p>${device.location}</p>
                </div>
                <div class="device-actions">
                    <button class="btn-icon edit" onclick="editDevice('${device.deviceId}')" title="Edit Device">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteDevice('${device.deviceId}')" title="Delete Device">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="device-stats">
                <div class="stat">
                    <span class="stat-value">${device.grids ? device.grids.length : 0}</span>
                    <span class="stat-label">Grids</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${getDeviceStatus(device)}</span>
                    <span class="stat-label">Status</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${getGridLayoutName(device.grids ? device.grids.length : 1)}</span>
                    <span class="stat-label">Layout</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getDeviceStatus(device) {
    // In a real app, this would check actual device connectivity
    return Math.random() > 0.5 ? 'Online' : 'Offline';
}

function getGridLayoutName(gridCount) {
    switch(gridCount) {
        case 1: return 'Full';
        case 2: return 'Split';
        case 3: return 'Triple';
        case 4: return 'Quad';
        case 6: return 'Six';
        case 8: return 'Eight';
        default: return 'Custom';
    }
}

function addDevice() {
    const modal = document.getElementById('device-modal');
    if (modal) {
        // Reset form
        document.getElementById('device-form').reset();
        modal.classList.add('show');
    }
}

async function handleDeviceSubmit(e) {
    e.preventDefault();
    const deviceId = document.getElementById('device-id').value.trim();
    const location = document.getElementById('device-location').value.trim();
    const gridCount = parseInt(document.getElementById('device-grid-count').value);
    if (!deviceId || !location) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    if (currentDevices.find(d => d.deviceId === deviceId) && !document.getElementById('device-id').readOnly) {
        showNotification('Device ID already exists. Please choose a unique ID.', 'error');
        // No need to close the modal here, let the user correct the ID.
        return;
    }
    showLoading(true);
    const device = { deviceId, location, grids: generateGridIds(deviceId, gridCount) };
    try {
        // create default grids
        await saveGridsForDevice(device);
        // upsert device
        const res = await fetch(`${apiBase}/devices`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(device) });
        if (!res.ok) throw new Error(await res.text());
        currentDevices.push(device);
        renderDevices();
        updateDeviceSelectors();
        closeModal('device-modal');
        showNotification('Device created successfully!', 'success');
    } catch (error) {
        console.error('Error creating device:', error);
        showNotification('Error creating device: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function generateGridIds(deviceId, gridCount) {
    const grids = [];
    for (let i = 1; i <= gridCount; i++) {
        grids.push(`${deviceId}_grid_${i}`);
    }
    return grids;
}

async function saveGridsForDevice(device) {
    const existingRes = await fetch(`${apiBase}/grids?deviceId=${encodeURIComponent(device.deviceId)}`, { headers: authHeaders() });
    const existing = existingRes.ok ? await existingRes.json() : [];
    const merged = [...device.grids.map((gridId, i) => ({ gridId, deviceId: device.deviceId, position: i + 1, mediaBoxId: '' }))];
    // Write full grids.json via function by PUTting each grid
    for (const g of merged) {
        await fetch(`${apiBase}/grids?gridId=${encodeURIComponent(g.gridId)}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(g) });
    }
}

function editDevice(deviceId) {
    const device = currentDevices.find(d => d.deviceId === deviceId);
    if (!device) return;
    
    // Populate form with device data
    document.getElementById('device-id').value = device.deviceId;
    document.getElementById('device-location').value = device.location;
    document.getElementById('device-grid-count').value = device.grids.length;
    
    // Disable device ID field for editing
    document.getElementById('device-id').readOnly = true;
    
    const modal = document.getElementById('device-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function deleteDevice(deviceId) {
    if (!confirm(`Are you sure you want to delete device "${deviceId}"? This action cannot be undone.`)) return;
    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/devices?deviceId=${encodeURIComponent(deviceId)}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentDevices = currentDevices.filter(d => d.deviceId !== deviceId);
        renderDevices();
        updateDeviceSelectors();
        showNotification('Device deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting device:', error);
        showNotification('Error deleting device: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function updateDeviceSelectors() {
    const selectors = ['grid-device-selector', 'preview-device-selector'];
    
    selectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            const currentValue = selector.value;
            selector.innerHTML = '<option value="">Select a device...</option>';
            
            currentDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = `${device.deviceId} - ${device.location}`;
                selector.appendChild(option);
            });
            
            // Restore previous selection if it still exists
            if (currentValue && currentDevices.find(d => d.deviceId === currentValue)) {
                selector.value = currentValue;
            }
        }
    });
}

// ===== Media Library Management =====

function setupMediaLibrary() {
    const addMediaUrlBtn = document.getElementById('add-media-url-btn');
    const addMediaUrlModal = document.getElementById('add-media-url-modal');
    const closeModalBtn = addMediaUrlModal.querySelector('.close-button');
    const cancelModalBtn = addMediaUrlModal.querySelector('.cancel-btn');
    const addMediaUrlForm = document.getElementById('add-media-url-form');

    addMediaUrlBtn.addEventListener('click', () => {
        addMediaUrlModal.style.display = 'flex';
    });

    const closeModal = () => {
        addMediaUrlModal.style.display = 'none';
        addMediaUrlForm.reset();
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == addMediaUrlModal) {
            closeModal();
        }
    });

    addMediaUrlForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const url = document.getElementById('media-url-input').value;
        const name = document.getElementById('media-name-input').value;
        const type = document.getElementById('media-type-select').value;
        const mediaId = `media_${Date.now()}`;

        const newMediaItem = {
            mediaId,
            name,
            url,
            type,
            createdAt: new Date().toISOString()
        };

        try {
            showLoading('Adding media item...');
            const response = await fetch(`${apiBase}/media-items`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(newMediaItem)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorBody}`);
            }
            await response.json();
            showToast('Media item added successfully!', 'success');
            loadMedia();
            closeModal();
        } catch (error) {
            console.error('Error adding media item:', error);
            showToast(`Error adding media item: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });

    loadMedia();
}

// File Upload Setup
function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('media-upload');
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
}

// Handle file uploads
async function handleFiles(files) {
    for (const file of files) {
        try {
            showLoading(`Uploading ${file.name}...`);
            
            // Check file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
            }
            
            // Check file type
            const fileType = getFileType(file);
            if (!fileType) {
                throw new Error(`File type not supported: ${file.name}`);
            }
            
            // Upload file to GitHub (base64 encoded for small files)
            const fileContent = await readFileAsBase64(file);
            const fileName = `media/${getTenant()}/${Date.now()}_${file.name}`;
            
            // Create media item record
            const mediaItem = {
                mediaId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                fileName: fileName,
                fileSize: file.size,
                type: fileType,
                uploadedAt: new Date().toISOString(),
                localPath: `/storage/emulated/0/CastGrid/${fileName}`, // Android local path
                isLocal: true
            };
            
            // Save to GitHub
            const response = await fetch(`${apiBase}/media-items`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(mediaItem)
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            // Save file content to GitHub
            await saveFileToGitHub(fileName, fileContent, file.type);
            
            showToast(`${file.name} uploaded successfully!`, 'success');
            
        } catch (error) {
            console.error('Upload error:', error);
            showToast(`Error uploading ${file.name}: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Refresh media library
    loadMedia();
}

// Read file as base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Get file type from extension
function getFileType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const videoTypes = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    if (videoTypes.includes(extension)) return 'video';
    if (imageTypes.includes(extension)) return 'image';
    return null;
}

// Save file to GitHub
async function saveFileToGitHub(fileName, content, mimeType) {
    const response = await fetch(`${apiBase}/upload-file`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            fileName: fileName,
            content: content,
            mimeType: mimeType
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to save file to GitHub');
    }
    
    return response.json();
}

// Load media items
function loadMedia() {
    fetch(`${apiBase}/media-items`, {
        headers: authHeaders()
    })
    .then(response => response.json())
    .then(mediaItems => {
        displayMediaItems(mediaItems);
    })
    .catch(error => {
        console.error('Error loading media:', error);
        showToast('Error loading media library', 'error');
    });
}

// Display media items in grid
function displayMediaItems(mediaItems) {
    const mediaGrid = document.getElementById('media-grid');
    mediaGrid.innerHTML = '';
    
    mediaItems.forEach(item => {
        const mediaItem = createMediaItemElement(item);
        mediaGrid.appendChild(mediaItem);
    });
}

// Create media item element
function createMediaItemElement(item) {
    const div = document.createElement('div');
    div.className = 'media-item';
    
    const preview = item.type === 'image' 
        ? `<img src="${item.fileName}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
        : `<video src="${item.fileName}" muted></video>`;
    
    div.innerHTML = `
        <div class="media-preview">
            ${preview}
            <div class="media-icon" style="display: ${item.type === 'image' ? 'none' : 'flex'}">
                <i class="fas fa-${item.type === 'video' ? 'play' : 'image'}"></i>
            </div>
        </div>
        <div class="media-info">
            <div class="media-name">${item.name}</div>
            <div class="media-type">${item.type}</div>
            <div class="media-actions">
                <button class="edit-btn" onclick="editMedia('${item.mediaId}')">Edit</button>
                <button class="delete-btn" onclick="deleteMedia('${item.mediaId}')">Delete</button>
            </div>
        </div>
    `;
    
    return div;
}

function filterMedia(type) {
    if (type === 'all') {
        renderMediaGrid();
    } else {
        const filtered = currentMediaItems.filter(item => item.type === type);
        renderMediaGrid(filtered);
    }
}

function searchMedia(query) {
    if (!query.trim()) {
        renderMediaGrid();
        return;
    }
    
    const filtered = currentMediaItems.filter(item => 
        item.filename.toLowerCase().includes(query.toLowerCase())
    );
    renderMediaGrid(filtered);
}

function previewMedia(mediaId) {
    const media = currentMediaItems.find(m => m.mediaId === mediaId);
    if (!media) return;
    
    // Create preview modal (simplified)
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Preview: ${media.name}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div style="padding: 1rem;">
                ${media.type === 'image' ? 
                    `<img src="${media.url}" style="width: 100%; height: auto; border-radius: 8px;">` :
                    `<video src="${media.url}" controls style="width: 100%; border-radius: 8px;"></video>`
                }
                <div style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
                    <p><strong>Type:</strong> ${media.type}</p>
                    <p><strong>Duration:</strong> ${media.duration} seconds</p>
                    <p><strong>URL:</strong> <a href="${media.url}" target="_blank">View in new tab</a></p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function editMedia(mediaId) {
    const media = currentMediaItems.find(m => m.mediaId === mediaId);
    if (!media) return;
    
    // Create edit modal (simplified)
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Media</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <form onsubmit="updateMedia(event, '${mediaId}')">
                <div style="padding: 1.5rem;">
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" id="edit-name" value="${media.name}" required>
                    </div>
                    <div class="form-group">
                        <label>URL:</label>
                        <input type="text" id="edit-url" value="${media.url}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function updateMedia(event, mediaId) {
    event.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const url = document.getElementById('edit-url').value.trim();

    if (!name || !url) { showToast('Name and URL are required', 'error'); return; }

    showLoading(true);
    try {
        const existing = currentMediaItems.find(m => m.mediaId === mediaId) || {};
        const updated = { ...existing, name, url };
        const res = await fetch(`${apiBase}/media-items`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(updated) });
        if (!res.ok) throw new Error(await res.text());
        const idx = currentMediaItems.findIndex(m => m.mediaId === mediaId);
        if (idx >= 0) currentMediaItems[idx] = updated;
        renderMediaGrid();
        document.querySelector('.modal.show')?.remove();
        showToast('Media updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating media:', error);
        showToast('Error updating media: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMedia(mediaId) {
    const media = currentMediaItems.find(m => m.mediaId === mediaId);
    if (!media) return;
    if (!confirm(`Are you sure you want to delete "${media.name}"? This action cannot be undone.`)) return;

    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/media-items?mediaId=${encodeURIComponent(mediaId)}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentMediaItems = currentMediaItems.filter(m => m.mediaId !== mediaId);
        renderMediaGrid();
        showNotification('Media deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting media:', error);
        showNotification('Error deleting media: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ===== Media Boxes Management =====

async function loadMediaBoxes() {
    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/media-boxes`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentMediaBoxes = await res.json();
        renderMediaBoxes();
    } catch (error) {
        console.error('Error loading media boxes:', error);
        showNotification('Error loading media boxes: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderMediaBoxes() {
    const grid = document.getElementById('mediaboxes-grid');
    if (!grid) return;
    
    if (currentMediaBoxes.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <i class="fas fa-box" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">No media boxes</h3>
                <p style="color: #999;">Create media boxes to organize your content</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = currentMediaBoxes.map(box => `
        <div class="mediabox-card" data-box-id="${box.mediaBoxId}">
            <div class="mediabox-header">
                <h3 class="mediabox-title">${box.name}</h3>
                <div class="device-actions">
                    <button class="btn-icon edit" onclick="editMediaBox('${box.mediaBoxId}')" title="Edit Media Box">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteMediaBox('${box.mediaBoxId}')" title="Delete Media Box">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="mediabox-content">
                ${box.mediaItems && box.mediaItems.length > 0 ? 
                    box.mediaItems.map(mediaId => {
                        const media = currentMediaItems.find(m => m.mediaId === mediaId);
                        return media ? `
                            <div class="mediabox-item">
                                <i class="fas fa-${media.type === 'video' ? 'video' : 'image'}"></i>
                                <span>${media.filename}</span>
                            </div>
                        ` : '';
                    }).join('') :
                    '<p style="color: #999; text-align: center;">No media items</p>'
                }
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <button class="btn-secondary" onclick="manageMediaBoxContent('${box.mediaBoxId}')">
                    <i class="fas fa-plus"></i> Manage Content
                </button>
            </div>
        </div>
    `).join('');
}

async function addMediaBox() {
    const name = prompt('Enter media box name:');
    if (!name) return;
    showLoading(true);
    const mediaBox = { mediaBoxId: generateMediaBoxId(), name: name.trim(), mediaItems: [] };
    try {
        const res = await fetch(`${apiBase}/media-boxes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(mediaBox) });
        if (!res.ok) throw new Error(await res.text());
        currentMediaBoxes.push(mediaBox);
        renderMediaBoxes();
        showNotification('Media box created successfully!', 'success');
    } catch (error) {
        console.error('Error creating media box:', error);
        showNotification('Error creating media box: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function generateMediaBoxId() {
    return 'mb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function editMediaBox(boxId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    const newName = prompt('Enter new name:', box.name);
    if (!newName || newName.trim() === box.name) return;
    showLoading(true);
    try {
        const updated = { ...box, name: newName.trim() };
        const res = await fetch(`${apiBase}/media-boxes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(updated) });
        if (!res.ok) throw new Error(await res.text());
        box.name = updated.name;
        renderMediaBoxes();
        showNotification('Media box updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating media box:', error);
        showNotification('Error updating media box: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteMediaBox(boxId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    if (!confirm(`Are you sure you want to delete "${box.name}"? This action cannot be undone.`)) return;
    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/media-boxes?mediaBoxId=${encodeURIComponent(boxId)}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentMediaBoxes = currentMediaBoxes.filter(b => b.mediaBoxId !== boxId);
        renderMediaBoxes();
        showNotification('Media box deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting media box:', error);
        showNotification('Error deleting media box: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function manageMediaBoxContent(boxId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    
    // Create content management modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Manage Content: ${box.name}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div style="padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h4>Available Media</h4>
                        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;">
                            ${currentMediaItems.map(media => `
                                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #eee;">
                                    <i class="fas fa-${media.type === 'video' ? 'video' : 'image'}"></i>
                                    <span style="flex: 1;">${media.filename}</span>
                                    <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="addToMediaBox('${boxId}', '${media.mediaId}')">Add</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4>Box Content</h4>
                        <div id="box-content-${boxId}" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;">
                            ${box.mediaItems.map(mediaId => {
                                const media = currentMediaItems.find(m => m.mediaId === mediaId);
                                return media ? `
                                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #eee;">
                                        <i class="fas fa-${media.type === 'video' ? 'video' : 'image'}"></i>
                                        <span style="flex: 1;">${media.filename}</span>
                                        <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="removeFromMediaBox('${boxId}', '${mediaId}')">Remove</button>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function addToMediaBox(boxId, mediaId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box || box.mediaItems.includes(mediaId)) return;
    const updated = { ...box, mediaItems: [...box.mediaItems, mediaId] };
    try {
        const res = await fetch(`${apiBase}/media-boxes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(updated) });
        if (!res.ok) throw new Error(await res.text());
        box.mediaItems = updated.mediaItems;
        renderMediaBoxes();
        const contentDiv = document.getElementById(`box-content-${boxId}`);
        if (contentDiv) {
            const media = currentMediaItems.find(m => m.mediaId === mediaId);
            if (media) {
                const newItem = document.createElement('div');
                newItem.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #eee;';
                newItem.innerHTML = `
                    <i class="fas fa-${media.type === 'video' ? 'video' : 'image'}"></i>
                    <span style="flex: 1;">${media.filename}</span>
                    <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="removeFromMediaBox('${boxId}', '${mediaId}')">Remove</button>
                `;
                contentDiv.appendChild(newItem);
            }
        }
        showNotification('Media added to box!', 'success');
    } catch (error) {
        console.error('Error adding media to box:', error);
        showNotification('Error adding media: ' + error.message, 'error');
    }
}

async function removeFromMediaBox(boxId, mediaId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    const updated = { ...box, mediaItems: box.mediaItems.filter(id => id !== mediaId) };
    try {
        const res = await fetch(`${apiBase}/media-boxes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(updated) });
        if (!res.ok) throw new Error(await res.text());
        box.mediaItems = updated.mediaItems;
        renderMediaBoxes();
        const contentDiv = document.getElementById(`box-content-${boxId}`);
        if (contentDiv) {
            contentDiv.innerHTML = box.mediaItems.map(id => {
                const media = currentMediaItems.find(m => m.mediaId === id);
                return media ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid #eee;">
                        <i class="fas fa-${media.type === 'video' ? 'video' : 'image'}"></i>
                        <span style="flex: 1;">${media.filename}</span>
                        <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="removeFromMediaBox('${boxId}', '${id}')">Remove</button>
                    </div>
                ` : '';
            }).join('');
        }
        showNotification('Media removed from box!', 'success');
    } catch (error) {
        console.error('Error removing media from box:', error);
        showNotification('Error removing media: ' + error.message, 'error');
    }
}

// ===== Grid Layout Designer =====

function loadGridDesigner() {
    if (currentDevices.length === 0) {
        loadDevices();
    }
    loadGrids();
}

async function loadGrids() {
    showLoading(true);
    try {
        const res = await fetch(`${apiBase}/grids`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await res.text());
        currentGrids = await res.json();
    } catch (error) {
        console.error('Error loading grids:', error);
        showNotification('Error loading grids: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function loadGridLayout(deviceId) {
    const device = currentDevices.find(d => d.deviceId === deviceId);
    if (!device) return;
    
    const designer = document.getElementById('grid-designer');
    if (!designer) return;
    
    const gridCount = device.grids.length;
    const deviceGrids = currentGrids.filter(g => g.deviceId === deviceId).sort((a, b) => a.position - b.position);
    
    designer.innerHTML = `
        <h3>Grid Layout for ${device.deviceId} - ${device.location}</h3>
        <p>Drag and drop media boxes onto grid positions</p>
        
        <div class="grid-layout layout-${gridCount}">
            ${Array.from({length: gridCount}, (_, i) => {
                const position = i + 1;
                const grid = deviceGrids.find(g => g.position === position);
                const mediaBox = grid && grid.mediaBoxId ? currentMediaBoxes.find(mb => mb.mediaBoxId === grid.mediaBoxId) : null;
                
                return `
                    <div class="grid-zone ${mediaBox ? 'occupied' : ''}" data-position="${position}" data-device="${deviceId}" onclick="selectMediaBoxForGrid('${deviceId}', ${position})">
                        <div class="zone-label">Grid ${position}</div>
                        <div class="zone-content">
                            ${mediaBox ? `
                                <div class="zone-mediabox">${mediaBox.name}</div>
                                <small>${mediaBox.mediaItems.length} items</small>
                            ` : 'Click to assign media box'}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>Available Media Boxes</h4>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                ${currentMediaBoxes.map(box => `
                    <div class="media-box-option" style="padding: 0.75rem 1rem; background: #f5f5f5; border-radius: 8px; cursor: pointer; border: 2px solid transparent;" onclick="selectMediaBox('${box.mediaBoxId}')">
                        <strong>${box.name}</strong>
                        <br><small>${box.mediaItems.length} items</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

let selectedMediaBoxId = null;
let selectedGridPosition = null;
let selectedDeviceId = null;

function selectMediaBoxForGrid(deviceId, position) {
    selectedGridPosition = position;
    selectedDeviceId = deviceId;
    
    // Highlight the grid zone
    document.querySelectorAll('.grid-zone').forEach(zone => {
        zone.style.borderColor = '';
    });
    document.querySelector(`[data-position="${position}"]`).style.borderColor = 'var(--primary-color)';
    
    // Show instructions
    showNotification('Now click on a media box below to assign it to this grid position', 'info');
}

function selectMediaBox(mediaBoxId) {
    if (!selectedGridPosition || !selectedDeviceId) {
        showNotification('Please select a grid position first', 'warning');
        return;
    }
    
    assignMediaBoxToGrid(selectedDeviceId, selectedGridPosition, mediaBoxId);
}

async function assignMediaBoxToGrid(deviceId, position, mediaBoxId) {
    showLoading(true);
    const device = currentDevices.find(d => d.deviceId === deviceId);
    const gridId = device.grids[position - 1];
    try {
        const res = await fetch(`${apiBase}/grids?gridId=${encodeURIComponent(gridId)}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ mediaBoxId }) });
        if (!res.ok) throw new Error(await res.text());
        const grid = currentGrids.find(g => g.gridId === gridId);
        if (grid) grid.mediaBoxId = mediaBoxId;
        loadGridLayout(deviceId);
        selectedGridPosition = null;
        selectedDeviceId = null;
        selectedMediaBoxId = null;
        const mediaBox = currentMediaBoxes.find(mb => mb.mediaBoxId === mediaBoxId);
        showNotification(`"${mediaBox.name}" assigned to grid position ${position}!`, 'success');
    } catch (error) {
        console.error('Error assigning media box:', error);
        showNotification('Error assigning media box: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ===== Preview Section =====

function loadPreviewSection() {
    // Load devices if not already loaded
    if (currentDevices.length === 0) {
        loadDevices();
    }
}

function loadPreview(deviceId) {
    const device = currentDevices.find(d => d.deviceId === deviceId);
    if (!device) return;
    
    const previewScreen = document.getElementById('preview-screen');
    if (!previewScreen) return;
    
    const gridCount = device.grids.length;
    const deviceGrids = currentGrids.filter(g => g.deviceId === deviceId).sort((a, b) => a.position - b.position);
    
    // Create preview layout
    previewScreen.className = 'preview-screen';
    previewScreen.innerHTML = `
        <div class="preview-grid" style="display: grid; gap: 2px; width: 100%; height: 100%; ${getGridStyles(gridCount)}">
            ${Array.from({length: gridCount}, (_, i) => {
                const position = i + 1;
                const grid = deviceGrids.find(g => g.position === position);
                const mediaBox = grid && grid.mediaBoxId ? currentMediaBoxes.find(mb => mb.mediaBoxId === grid.mediaBoxId) : null;
                
                if (mediaBox && mediaBox.mediaItems.length > 0) {
                    const firstMediaId = mediaBox.mediaItems[0];
                    const firstMedia = currentMediaItems.find(m => m.mediaId === firstMediaId);
                    
                    if (firstMedia) {
                        return `
                            <div class="preview-zone" style="background: #333; display: flex; align-items: center; justify-content: center; position: relative;">
                                ${firstMedia.type === 'image' ? 
                                    `<img src="${firstMedia.url}" style="width: 100%; height: 100%; object-fit: cover;">` :
                                    `<div style="color: white; text-align: center;">
                                        <i class="fas fa-play-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                                        <br>Video: ${firstMedia.filename}
                                    </div>`
                                }
                                <div style="position: absolute; bottom: 4px; left: 4px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; font-size: 0.7rem; border-radius: 4px;">
                                    ${mediaBox.name}
                                </div>
                            </div>
                        `;
                    }
                }
                
                return `
                    <div class="preview-zone" style="background: #555; display: flex; align-items: center; justify-content: center; color: #999; font-size: 0.9rem;">
                        Grid ${position}<br>No Content
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getGridStyles(gridCount) {
    switch(gridCount) {
        case 1:
            return 'grid-template-columns: 1fr;';
        case 2:
            return 'grid-template-columns: 1fr 1fr;';
        case 3:
            return 'grid-template-columns: 1fr 1fr 1fr;';
        case 4:
            return 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
        case 6:
            return 'grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr;';
        case 8:
            return 'grid-template-columns: repeat(4, 1fr); grid-template-rows: 1fr 1fr;';
        default:
            return 'grid-template-columns: 1fr;';
    }
}

// ===== Utility Functions =====

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 1rem;">&times;</button>
        </div>
    `;
    
    notifications.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Reset form if it's a device modal
        if (modalId === 'device-modal') {
            document.getElementById('device-id').readOnly = false;
        }
    }
}

function saveAllChanges() {
    showNotification('All changes are automatically saved to Firebase!', 'success');
}

// ===== Global Functions (called from HTML) =====
window.completeStep = completeStep;
window.toggleService = toggleService;
window.testApiConnection = testApiConnection;
window.addDevice = addDevice;
window.editDevice = editDevice;
window.deleteDevice = deleteDevice;
window.closeModal = closeModal;
window.previewMedia = previewMedia;
window.editMedia = editMedia;
window.updateMedia = updateMedia;
window.deleteMedia = deleteMedia;
window.addMediaBox = addMediaBox;
window.editMediaBox = editMediaBox;
window.deleteMediaBox = deleteMediaBox;
window.manageMediaBoxContent = manageMediaBoxContent;
window.addToMediaBox = addToMediaBox;
window.removeFromMediaBox = removeFromMediaBox;
window.selectMediaBoxForGrid = selectMediaBoxForGrid;
window.selectMediaBox = selectMediaBox; 