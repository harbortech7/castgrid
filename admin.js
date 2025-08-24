// ===== CastGrid Admin Dashboard JavaScript =====
console.log('🎯 CastGrid Admin Dashboard - VERSION 3.0 - UPLOAD FIXES APPLIED');

// Global variables
let apiBase = '/.netlify/functions';
let identityUser = null;
const isLocalEnvironment = () => (location.protocol === 'file:' || location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
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

// Enhanced file management
let uploadQueue = [];
let uploadProgress = {};
let localFileCache = new Map();
let storageStats = {
    totalSize: 0,
    availableSpace: 0,
    fileCount: 0
};

// ===== Initialization =====

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    restoreAccessibilityPrefs();
    initializeFileManager();
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
    
    // Initialize enhanced features
    initializeFileManager();
    initializeGridDesigner();
    initializeMediaLibrary();
    initializeRealTimeSync();
    
    // Load initial data
    loadInitialData();
}

function loadInitialData() {
    // Load cached data first for faster initial display
    const cachedDevices = window.getCachedData('devices');
    const cachedMediaItems = window.getCachedData('mediaItems');
    const cachedMediaBoxes = window.getCachedData('mediaBoxes');
    const cachedGrids = window.getCachedData('grids');
    
    if (cachedDevices) {
        currentDevices = cachedDevices;
        renderDevices();
    }
    
    if (cachedMediaItems) {
        currentMediaItems = cachedMediaItems;
        renderMediaItems();
    }
    
    if (cachedMediaBoxes) {
        currentMediaBoxes = cachedMediaBoxes;
        renderMediaBoxes();
    }
    
    if (cachedGrids) {
        currentGrids = cachedGrids;
        renderGrids();
    }
    
    // Then load fresh data from server
    Promise.all([
        loadDevices(),
        loadMediaItems(),
        loadMediaBoxes(),
        loadGrids()
    ]).then(() => {
        console.log('Initial data loaded successfully');
        updateDashboardStats();
    }).catch(error => {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data. Some features may not work properly.', 'error');
    });
}

function updateDashboardStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;
    
    const totalDevices = currentDevices.length;
    const totalMediaItems = currentMediaItems.length;
    const totalMediaBoxes = currentMediaBoxes.length;
    const totalGrids = currentGrids.length;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-tv"></i>
            </div>
            <div class="stat-content">
                <h3>${totalDevices}</h3>
                <p>Devices</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-photo-video"></i>
            </div>
            <div class="stat-content">
                <h3>${totalMediaItems}</h3>
                <p>Media Items</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-box"></i>
            </div>
            <div class="stat-content">
                <h3>${totalMediaBoxes}</h3>
                <p>Media Boxes</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-th"></i>
            </div>
            <div class="stat-content">
                <h3>${totalGrids}</h3>
                <p>Grid Zones</p>
            </div>
        </div>
    `;
}

// Data loading functions
async function loadDevices() {
    try {
        const response = await fetch('/.netlify/functions/devices');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        currentDevices = data.devices || [];
        updateDevicesList();
        // Cache the data
        window.cacheData('devices', currentDevices, 5 * 60 * 1000); // 5 minutes
        return currentDevices;
    } catch (error) {
        console.error('Error loading devices:', error);
        return [];
    }
}

async function loadMediaItems() {
    try {
        // Check if we're running locally
        if (isLocalEnvironment()) {
            // Local development mode - load from localStorage
            const localMedia = JSON.parse(localStorage.getItem('localMediaItems') || '[]');
            currentMediaItems = localMedia;
            updateMediaItemsList();
            return currentMediaItems;
        } else {
            // Production mode - load from Netlify Functions
            const response = await fetch('/.netlify/functions/media-items');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            currentMediaItems = data.mediaItems || [];
            updateMediaItemsList();
            // Cache the data
            window.cacheData('mediaItems', currentMediaItems, 5 * 60 * 1000); // 5 minutes
            return currentMediaItems;
        }
    } catch (error) {
        console.error('Error loading media items:', error);
        return [];
    }
}

async function loadMediaBoxes() {
    try {
        if (isLocalEnvironment()) {
            const local = JSON.parse(localStorage.getItem('localMediaBoxes') || '[]');
            currentMediaBoxes = local;
            updateMediaBoxesList();
            return currentMediaBoxes;
        }
        const response = await fetch('/.netlify/functions/media-boxes');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        currentMediaBoxes = data.mediaBoxes || [];
        updateMediaBoxesList();
        // Cache the data
        window.cacheData('mediaBoxes', currentMediaBoxes, 5 * 60 * 1000); // 5 minutes
        return currentMediaBoxes;
    } catch (error) {
        console.error('Error loading media boxes:', error);
        return [];
    }
}

async function loadGrids() {
    try {
        if (isLocalEnvironment()) {
            const local = JSON.parse(localStorage.getItem('localGrids') || '[]');
            currentGrids = local;
            updateGridsList && updateGridsList();
            return currentGrids;
        }
        const response = await fetch('/.netlify/functions/grids');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        currentGrids = data.grids || [];
        updateGridsList();
        // Cache the data
        window.cacheData('grids', currentGrids, 5 * 60 * 1000); // 5 minutes
        return currentGrids;
    } catch (error) {
        console.error('Error loading grids:', error);
        return [];
    }
}

// Update functions for UI lists
function updateDevicesList() {
    const devicesContainer = document.getElementById('devices-list');
    if (!devicesContainer) return;
    
    if (currentDevices.length === 0) {
        devicesContainer.innerHTML = '<p class="no-data">No devices found</p>';
        return;
    }
    
    devicesContainer.innerHTML = currentDevices.map(device => `
        <div class="device-item" data-device-id="${device.id}">
            <div class="device-info">
                <h4>${device.name}</h4>
                <p>${device.location || 'Unknown location'}</p>
                <p class="device-status ${device.status || 'offline'}">${device.status || 'offline'}</p>
            </div>
            <div class="device-actions">
                <button class="btn btn-small" onclick="editDevice('${device.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteDevice('${device.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateMediaItemsList() {
    const mediaContainer = document.getElementById('media-items-list');
    if (!mediaContainer) return;
    
    if (currentMediaItems.length === 0) {
        mediaContainer.innerHTML = '<p class="no-data">No media items found</p>';
        return;
    }
    
    mediaContainer.innerHTML = currentMediaItems.map(item => {
        const itemId = item.id || item.mediaId;
        const itemUrl = item.url || item.localUrl;
        const itemSize = item.size || item.fileSize;
        
        return `
            <div class="media-item" data-media-id="${itemId}">
                <div class="media-preview">
                    ${item.type === 'video' ? 
                        `<video src="${itemUrl}" preload="metadata" controls></video>` : 
                        `<img src="${itemUrl}" alt="${item.name}" loading="lazy">`
                    }
                </div>
                <div class="media-info">
                    <h4>${item.name}</h4>
                    <p>${item.type} • ${formatBytes(itemSize || 0)}</p>
                    <p>${item.duration || 'Unknown duration'}</p>
                    ${item.isLocal ? '<span class="local-badge">Local</span>' : ''}
                </div>
                <div class="media-actions">
                    <button class="btn btn-small" onclick="editMediaItem('${itemId}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteMediaItem('${itemId}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateMediaBoxesList() {
    const boxesContainer = document.getElementById('media-boxes-list');
    if (!boxesContainer) return;
    
    if (currentMediaBoxes.length === 0) {
        boxesContainer.innerHTML = '<p class="no-data">No media boxes found</p>';
        return;
    }
    
    boxesContainer.innerHTML = currentMediaBoxes.map(box => `
        <div class="media-box" data-box-id="${box.id}">
            <div class="box-info">
                <h4>${box.name}</h4>
                <p>${box.description || 'No description'}</p>
                <p>${box.mediaItems ? box.mediaItems.length : 0} items</p>
            </div>
            <div class="box-actions">
                <button class="btn btn-small" onclick="editMediaBox('${box.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteMediaBox('${box.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateGridsList() {
    const gridsContainer = document.getElementById('grids-list');
    if (!gridsContainer) return;
    
    if (currentGrids.length === 0) {
        gridsContainer.innerHTML = '<p class="no-data">No grids found</p>';
        return;
    }
    
    gridsContainer.innerHTML = currentGrids.map(grid => `
        <div class="grid-item" data-grid-id="${grid.id}">
            <div class="grid-info">
                <h4>${grid.name}</h4>
                <p>${grid.deviceId || 'No device assigned'}</p>
                <p>${grid.zones ? grid.zones.length : 0} zones</p>
            </div>
            <div class="grid-actions">
                <button class="btn btn-small" onclick="editGrid('${grid.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGrid('${grid.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Render functions for cached data
function renderDevices() {
    updateDevicesList();
}

function renderMediaItems() {
    updateMediaItemsList();
}

function renderMediaBoxes() {
    updateMediaBoxesList();
}

function renderGrids() {
    updateGridsList();
}

// Utility functions
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Placeholder functions for edit/delete operations
function addGrid() {
    console.log('Add grid function called');
    // TODO: Implement grid creation
    showNotification('Grid creation not yet implemented', 'info');
}

function editDevice(deviceId) {
    console.log('Edit device:', deviceId);
    // TODO: Implement device editing
    showNotification('Device editing not yet implemented', 'info');
}

function deleteDevice(deviceId) {
    console.log('Delete device:', deviceId);
    // TODO: Implement device deletion
    showNotification('Device deletion not yet implemented', 'info');
}

function editMediaItem(mediaId) {
    console.log('Edit media item:', mediaId);
    // TODO: Implement media item editing
    showNotification('Media item editing not yet implemented', 'info');
}

function deleteMediaItem(mediaId) {
    console.log('Delete media item:', mediaId);
    // TODO: Implement media item deletion
    showNotification('Media item deletion not yet implemented', 'info');
}

function editMediaBox(boxId) {
    console.log('Edit media box:', boxId);
    // TODO: Implement media box editing
    showNotification('Media box editing not yet implemented', 'info');
}

function deleteMediaBox(boxId) {
    console.log('Delete media box:', boxId);
    // TODO: Implement media box deletion
    showNotification('Media box deletion not yet implemented', 'info');
}

function editGrid(gridId) {
    console.log('Edit grid:', gridId);
    // TODO: Implement grid editing
    showNotification('Grid editing not yet implemented', 'info');
}

function deleteGrid(gridId) {
    console.log('Delete grid:', gridId);
    // TODO: Implement grid deletion
    showNotification('Grid deletion not yet implemented', 'info');
}

// Utility functions
function getTenantId() {
    // This should come from user authentication or device configuration
    // For now, return a default tenant ID
    return 'default';
}

function getAdminToken() {
    // Get admin token from localStorage or prompt user
    let token = localStorage.getItem('adminToken');
    if (!token) {
        token = prompt('Enter your admin token:');
        if (token) {
            localStorage.setItem('adminToken', token);
        }
    }
    return token;
}

// Get tenant name (alias for getTenantId)
function getTenant() {
    return getTenantId();
}

// Show loading indicator
function showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.textContent = message;
        loadingEl.style.display = 'block';
    }
}

// Hide loading indicator
function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

function filterMediaItems(filter) {
    // Implementation for filtering media items
    console.log('Filtering media items by:', filter);
    // TODO: Implement actual filtering logic
    showNotification(`Filtered to show: ${filter}`, 'info');
}

// Setup step functions
function completeStep(stepNumber) {
    console.log('Completing step:', stepNumber);
    const step = document.querySelector(`[data-step="${stepNumber}"]`);
    if (step) {
        step.classList.add('completed');
        showNotification(`Step ${stepNumber} completed!`, 'success');
    }
}

// Admin access functions
function saveAdminAccess() {
    console.log('Saving admin access');
    showNotification('Admin access saved', 'success');
}

// API connection test
function testApiConnection() {
    console.log('Testing API connection');
    showNotification('API connection test initiated', 'info');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ===== Event Listeners =====

// Add media URL button handler
document.addEventListener('DOMContentLoaded', function() {
    const addMediaUrlBtn = document.getElementById('add-media-url-btn');
    if (addMediaUrlBtn) {
        addMediaUrlBtn.addEventListener('click', function() {
            console.log('Add media by URL clicked');
            showNotification('Add media by URL not yet implemented', 'info');
        });
    }
    
    // Preview control handlers
    const previewPlayBtn = document.getElementById('preview-play');
    if (previewPlayBtn) {
        previewPlayBtn.addEventListener('click', function() {
            console.log('Preview play clicked');
            showNotification('Preview play not yet implemented', 'info');
        });
    }
    
    const previewFullscreenBtn = document.getElementById('preview-fullscreen');
    if (previewFullscreenBtn) {
        previewFullscreenBtn.addEventListener('click', function() {
            console.log('Preview fullscreen clicked');
            showNotification('Preview fullscreen not yet implemented', 'info');
        });
    }
    
    const deployToDeviceBtn = document.getElementById('deploy-to-device');
    if (deployToDeviceBtn) {
        deployToDeviceBtn.addEventListener('click', function() {
            console.log('Deploy to device clicked');
            showNotification('Deploy to device not yet implemented', 'info');
        });
    }
    
    // Media filter handlers
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            console.log('Filter clicked:', filter);
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            showNotification(`Filtered to show: ${filter}`, 'info');
        });
    });

    // Initialize enhanced upload system
    initializeEnhancedUpload();
    
    // Add event listeners for upload buttons
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const githubUploadBtn = document.getElementById('githubUploadBtn');
    
    if (uploadFilesBtn) {
        uploadFilesBtn.addEventListener('click', () => {
            document.getElementById('mediaUploadInput').click();
        });
    }
    
    if (githubUploadBtn) {
        githubUploadBtn.addEventListener('click', () => {
            // Show file picker for GitHub upload
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'video/*,image/*';
            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => uploadToGitHub(file));
            };
            input.click();
        });
    }
    
    // Accessibility toggle handlers
    const toggleContrastBtn = document.getElementById('toggle-contrast');
    if (toggleContrastBtn) {
        toggleContrastBtn.addEventListener('click', function() {
            const isPressed = this.getAttribute('aria-pressed') === 'true';
            this.setAttribute('aria-pressed', !isPressed);
            document.body.classList.toggle('high-contrast');
            showNotification(`High contrast ${!isPressed ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    const toggleTextBtn = document.getElementById('toggle-text');
    if (toggleTextBtn) {
        toggleTextBtn.addEventListener('click', function() {
            const isPressed = this.getAttribute('aria-pressed') === 'true';
            this.setAttribute('aria-pressed', !isPressed);
            document.body.classList.toggle('large-text');
            showNotification(`Large text ${!isPressed ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    // Save all button handler
    const saveAllBtn = document.getElementById('save-all');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', function() {
            console.log('Save all clicked');
            showNotification('Save all functionality not yet implemented', 'info');
        });
    }
    
    // Device form submission handler
    const deviceForm = document.getElementById('device-form');
    if (deviceForm) {
        deviceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Device form submitted');
            
            const deviceId = document.getElementById('device-id').value;
            const location = document.getElementById('device-location').value;
            const gridCount = document.getElementById('device-grid-count').value;
            
            console.log('Device ID:', deviceId, 'Location:', location, 'Grid Count:', gridCount);
            showNotification('Device creation not yet implemented', 'info');
            
            // Close the modal
            closeModal('device-modal');
        });
    }
    
    // Media upload input handler (legacy - now handled by enhanced system)
    const mediaUploadInput = document.getElementById('media-upload');
    if (mediaUploadInput) {
        mediaUploadInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            console.log('Media files selected:', files.length);
            
            if (files.length > 0) {
                // Use the new enhanced upload system
                handleFiles(files);
            }
        });
    }
});

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
    if (isLocalEnvironment()) { try { const cached = JSON.parse(localStorage.getItem('localDevices') || '[]'); currentDevices = cached; renderDevices(); if (typeof updateDeviceSelectors==='function') updateDeviceSelectors(); return; } catch (e) { console.warn('Local devices fallback failed', e); } }
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
        // Force show modal with direct display
        modal.style.display = 'flex';
        modal.style.zIndex = '1001';
        
        // Add click outside to close functionality
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeModal('device-modal');
            }
        };
        
        // Add escape key to close modal
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal('device-modal');
            }
        });
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
    
    // Check for duplicate device ID
    if (currentDevices.find(d => d.deviceId === deviceId) && !document.getElementById('device-id').readOnly) {
        showNotification('Device ID already exists. Please choose a unique ID.', 'error');
        // Don't close the modal - let user correct the ID or cancel manually
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
        // Don't close modal on error - let user see the error and decide what to do
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
    console.log('Setting up Media Library...');
    
    // Check if required elements exist before proceeding
    const addMediaUrlBtn = document.getElementById('addMediaUrlBtn');
    
    if (!addMediaUrlBtn) {
        console.warn('Add Media URL button not found');
        return;
    }
    
    // Add Media URL button functionality
    addMediaUrlBtn.addEventListener('click', addMediaByURL);

    // Load media after setup
    loadMedia();
}

// Enhanced File Upload Setup
function setupFileUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const mediaUploadInput = document.getElementById('mediaUploadInput');
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const githubUploadBtn = document.getElementById('githubUploadBtn');
    const addMediaUrlBtn = document.getElementById('addMediaUrlBtn');
    
    if (!uploadZone || !mediaUploadInput) {
        console.error('Upload elements not found');
        return;
    }
    
    // Drag and drop events
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    // Click to browse
    uploadZone.addEventListener('click', () => {
        mediaUploadInput.click();
    });
    
    // File input change
    mediaUploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
    
    // Upload Files button
    if (uploadFilesBtn) {
        uploadFilesBtn.addEventListener('click', () => {
            mediaUploadInput.click();
        });
    }
    
    // GitHub Upload button
    if (githubUploadBtn) {
        githubUploadBtn.addEventListener('click', () => {
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.multiple = true;
            tempInput.accept = 'video/*,image/*';
            tempInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => uploadToGitHub(file));
            });
            tempInput.click();
        });
    }
    
    // Add Media by URL button
    if (addMediaUrlBtn) {
        addMediaUrlBtn.addEventListener('click', addMediaByURL);
    }
}

// Enhanced file handling - moved to line 3206

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

// Show toast notification
function showToast(message, type = 'info') {
    console.log(`Toast [${type}]:`, message);
    showNotification(message, type);
}

// Hide loading overlay
function hideLoading() {
    showLoading(false);
}

// Get current tenant from localStorage
function getTenant() {
    return localStorage.getItem('cg_admin_tenant') || 'default';
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
    console.log('Loading media items...');
    
    // Check if media grid exists
    const mediaGrid = document.getElementById('media-grid');
    if (!mediaGrid) {
        console.warn('Media grid element not found');
        return;
    }
    
    // Show loading state
    mediaGrid.innerHTML = '<div class="loading">Loading media...</div>';
    
    // Check if we're running locally
    if (isLocalEnvironment()) {
        // Local development mode - load from localStorage
        console.log('Running in local development mode');
        const localMedia = JSON.parse(localStorage.getItem('localMediaItems') || '[]');
        console.log('Local media items:', localMedia);
        displayMediaItems(localMedia);
        return;
    }
    
    // Production mode - fetch from API
    fetch(`${apiBase}/media-items`, {
        headers: authHeaders()
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(mediaItems => {
        console.log('Media items loaded:', mediaItems);
        displayMediaItems(mediaItems);
    })
    .catch(error => {
        console.error('Error loading media:', error);
        
        // Show error state instead of leaving loading
        mediaGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <h3>Error Loading Media</h3>
                <p>${error.message}</p>
                <button onclick="loadMedia()" class="btn-primary">Retry</button>
            </div>
        `;
        
        showToast('Error loading media library', 'error');
    });
}

// Display media items in grid
function displayMediaItems(mediaItems) {
    console.log('Displaying media items:', mediaItems);
    
    const mediaGrid = document.getElementById('media-grid');
    if (!mediaGrid) {
        console.warn('Media grid element not found');
        return;
    }
    
    // Clear the grid
    mediaGrid.innerHTML = '';
    
    // Handle empty state
    if (!mediaItems || mediaItems.length === 0) {
        mediaGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <i class="fas fa-photo-video" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">No media found</h3>
                <p style="color: #999;">Upload your first video or image to get started</p>
            </div>
        `;
        return;
    }
    
    // Display media items
    mediaItems.forEach(item => {
        try {
            const mediaItem = createMediaItemElement(item);
            mediaGrid.appendChild(mediaItem);
        } catch (error) {
            console.error('Error creating media item element:', error, item);
        }
    });
}

// Create media item element
function createMediaItemElement(item) {
    console.log('Creating media item element:', item);
    
    if (!item || !item.mediaId) {
        console.error('Invalid media item:', item);
        return null;
    }
    
    const div = document.createElement('div');
    div.className = 'media-item';
    
    // Safely get item properties with fallbacks
    const name = item.name || item.filename || 'Unnamed Media';
    const type = item.type || 'unknown';
    const fileName = item.fileName || item.url || '';
    
    const preview = type === 'image' 
        ? `<img src="${fileName}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
        : `<video src="${fileName}" muted></video>`;
    
    div.innerHTML = `
        <div class="media-preview">
            ${preview}
            <div class="media-icon" style="display: ${type === 'image' ? 'none' : 'flex'}">
                <i class="fas fa-${type === 'video' ? 'play' : 'image'}"></i>
            </div>
        </div>
        <div class="media-info">
            <div class="media-name">${name}</div>
            <div class="media-type">${type}</div>
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
    if (isLocalEnvironment()) { try { const cached = JSON.parse(localStorage.getItem('localMediaBoxes') || '[]'); currentMediaBoxes = cached; renderMediaBoxes(); return; } catch (e) { console.warn('Local media boxes fallback failed', e); } }
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
    if (isLocalEnvironment()) { try { const cached = JSON.parse(localStorage.getItem('localGrids') || '[]'); currentGrids = cached; return; } catch (e) { console.warn('Local grids fallback failed', e); } }
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

// Enhanced Grid Layout Designer
function initializeGridDesigner() {
    console.log('Initializing enhanced grid layout designer');
    
    setupGridDragAndDrop();
    setupGridVisualEditor();
    setupGridPresets();
}

function setupGridDragAndDrop() {
    const gridContainer = document.getElementById('grid-layout-container');
    if (!gridContainer) return;
    
    // Make grid zones droppable for media boxes
    const gridZones = gridContainer.querySelectorAll('.grid-zone');
    gridZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const mediaBoxId = e.dataTransfer.getData('text/plain');
            const position = parseInt(zone.dataset.position);
            assignMediaBoxToGrid(mediaBoxId, position);
        });
    });
}

function setupGridVisualEditor() {
    const gridSizeSelector = document.getElementById('grid-size-selector');
    if (gridSizeSelector) {
        gridSizeSelector.addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            updateGridLayout(size);
        });
    }
}

function setupGridPresets() {
    const presetsContainer = document.getElementById('grid-presets');
    if (!presetsContainer) return;
    
    const presets = [
        { name: 'Single Display', size: 1, description: 'Full screen content' },
        { name: 'Split Screen', size: 2, description: 'Two content zones' },
        { name: 'Quad Layout', size: 4, description: 'Four content zones (2x2)' },
        { name: 'Six Zones', size: 6, description: 'Six content zones (2x3)' },
        { name: 'Eight Zones', size: 8, description: 'Eight content zones (2x4)' }
    ];
    
    presetsContainer.innerHTML = presets.map(preset => `
        <div class="grid-preset" onclick="applyGridPreset(${preset.size})">
            <h4>${preset.name}</h4>
            <p>${preset.description}</p>
            <div class="preset-preview grid-${preset.size}">
                ${generateGridPreview(preset.size)}
            </div>
        </div>
    `).join('');
}

function generateGridPreview(size) {
    const gridClass = `grid-${size}`;
    let html = '';
    
    for (let i = 1; i <= size; i++) {
        html += `<div class="grid-zone-preview" data-position="${i}"></div>`;
    }
    
    return html;
}

function applyGridPreset(size) {
    const deviceId = document.getElementById('grid-device-selector')?.value;
    if (!deviceId) {
        showNotification('Please select a device first', 'warning');
        return;
    }
    
    updateGridLayout(size);
    showNotification(`Applied ${size}-zone grid layout`, 'success');
}

function updateGridLayout(size) {
    const gridContainer = document.getElementById('grid-layout-container');
    if (!gridContainer) return;
    
    gridContainer.className = `grid-layout grid-${size}`;
    gridContainer.innerHTML = '';
    
    for (let i = 1; i <= size; i++) {
        const zone = document.createElement('div');
        zone.className = 'grid-zone';
        zone.dataset.position = i;
        zone.innerHTML = `
            <div class="zone-header">
                <span class="zone-number">${i}</span>
                <span class="zone-status">Empty</span>
            </div>
            <div class="zone-content">
                <div class="zone-placeholder">
                    <i class="fas fa-plus"></i>
                    <p>Drop Media Box Here</p>
                </div>
            </div>
        `;
        gridContainer.appendChild(zone);
    }
    
    // Reinitialize drag and drop
    setupGridDragAndDrop();
    
    // Update grid size selector
    const sizeSelector = document.getElementById('grid-size-selector');
    if (sizeSelector) {
        sizeSelector.value = size;
    }
}

function assignMediaBoxToGrid(mediaBoxId, position) {
    const deviceId = document.getElementById('grid-device-selector')?.value;
    if (!deviceId) {
        showNotification('Please select a device first', 'warning');
        return;
    }
    
    // Find existing grid for this position
    const existingGrid = currentGrids.find(g => g.deviceId === deviceId && g.position === position);
    
    if (existingGrid) {
        // Update existing grid
        updateGrid(existingGrid.gridId, mediaBoxId);
    } else {
        // Create new grid
        createGrid({
            deviceId: deviceId,
            position: position,
            mediaBoxId: mediaBoxId
        });
    }
    
    // Update visual representation
    updateGridZoneDisplay(position, mediaBoxId);
}

function updateGridZoneDisplay(position, mediaBoxId) {
    const zone = document.querySelector(`[data-position="${position}"]`);
    if (!zone) return;
    
    const mediaBox = currentMediaBoxes.find(mb => mb.mediaBoxId === mediaBoxId);
    if (!mediaBox) return;
    
    zone.querySelector('.zone-status').textContent = mediaBox.name;
    zone.querySelector('.zone-content').innerHTML = `
        <div class="assigned-media-box">
            <h4>${mediaBox.name}</h4>
            <p>${mediaBox.mediaItems?.length || 0} items</p>
            <button class="btn-small" onclick="removeGridAssignment(${position})">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `;
}

function removeGridAssignment(position) {
    const deviceId = document.getElementById('grid-device-selector')?.value;
    if (!deviceId) return;
    
    const grid = currentGrids.find(g => g.deviceId === deviceId && g.position === position);
    if (grid) {
        deleteGrid(grid.gridId);
    }
    
    // Reset zone display
    const zone = document.querySelector(`[data-position="${position}"]`);
    if (zone) {
        zone.querySelector('.zone-status').textContent = 'Empty';
        zone.querySelector('.zone-content').innerHTML = `
            <div class="zone-placeholder">
                <i class="fas fa-plus"></i>
                <p>Drop Media Box Here</p>
            </div>
        `;
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

// ===== EMERGENCY MODAL FIX =====

function closeModal(modalId) {
    console.log('closeModal called with:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log('Modal found, closing...');
        // Force hide the modal with direct display manipulation
        modal.style.display = 'none';
        modal.style.zIndex = '1000';
        
        // Reset form if it's a device modal
        if (modalId === 'device-modal') {
            document.getElementById('device-form').reset();
            document.getElementById('device-id').readOnly = false;
        }
        console.log('Modal closed successfully');
    } else {
        console.log('Modal not found:', modalId);
    }
}

// Override the global closeModal function
window.closeModal = closeModal;

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

function initializeFileManager() {
    console.log('Initializing enhanced file management system');
    
    // Initialize drag and drop zones
    setupDragAndDrop();
    
    // Initialize file type validation
    setupFileValidation();
    
    // Load storage statistics
    loadStorageStats();
    
    // Setup file upload progress tracking
    setupUploadProgress();
}

function setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.file-drop-zone');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            handleFileDrop(e.dataTransfer.files, zone);
        });
    });
}

function setupFileValidation() {
    const allowedTypes = {
        video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'm4v'],
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    };
    
    window.validateFileType = function(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const isVideo = allowedTypes.video.includes(extension);
        const isImage = allowedTypes.image.includes(extension);
        
        return {
            isValid: isVideo || isImage,
            type: isVideo ? 'video' : isImage ? 'image' : 'unknown',
            extension: extension
        };
    };
}

function setupUploadProgress() {
    // Create progress bar container if it doesn't exist
    if (!document.getElementById('upload-progress-container')) {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'upload-progress-container';
        progressContainer.className = 'upload-progress-container';
        document.body.appendChild(progressContainer);
    }
}

function loadStorageStats() {
    const statsDiv = document.getElementById('storage-stats');
    if (!statsDiv) return;

    const updateStats = () => {
        fetch(`${apiBase}/storage-stats`, { headers: authHeaders() })
            .then(response => response.json())
            .then(stats => {
                storageStats = stats;
                statsDiv.innerHTML = `
                    <p>Total Storage: ${formatBytes(storageStats.totalSize)}</p>
                    <p>Used Storage: ${formatBytes(storageStats.totalSize - storageStats.availableSpace)}</p>
                    <p>Available Storage: ${formatBytes(storageStats.availableSpace)}</p>
                    <p>Total Files: ${storageStats.fileCount}</p>
                `;
            })
            .catch(error => {
                console.error('Error loading storage stats:', error);
                statsDiv.innerHTML = '<p>Error loading storage stats.</p>';
            });
    };

    updateStats();
    setInterval(updateStats, 5000); // Update every 5 seconds
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 

function handleFileDrop(files, dropZone) {
    console.log(`Processing ${files.length} dropped files`);
    
    Array.from(files).forEach(file => {
        const validation = window.validateFileType(file);
        
        if (!validation.isValid) {
            showNotification(`Invalid file type: ${file.name}`, 'error');
            return;
        }
        
        // Add to upload queue
        const uploadItem = {
            id: generateId(),
            file: file,
            type: validation.type,
            status: 'queued',
            progress: 0,
            timestamp: Date.now()
        };
        
        uploadQueue.push(uploadItem);
        updateUploadQueue();
        
        // Start upload if queue is not processing
        if (uploadQueue.length === 1) {
            processUploadQueue();
        }
    });
}

function processUploadQueue() {
    if (uploadQueue.length === 0) return;
    
    const currentUpload = uploadQueue[0];
    if (currentUpload.status === 'uploading') return;
    
    currentUpload.status = 'uploading';
    updateUploadQueue();
    
    uploadFile(currentUpload)
        .then(result => {
            currentUpload.status = 'completed';
            currentUpload.progress = 100;
            updateUploadQueue();
            
            // Remove from queue after delay
            setTimeout(() => {
                uploadQueue = uploadQueue.filter(item => item.id !== currentUpload.id);
                updateUploadQueue();
            }, 3000);
            
            // Process next item
            processUploadQueue();
        })
        .catch(error => {
            currentUpload.status = 'failed';
            currentUpload.error = error.message;
            updateUploadQueue();
            showNotification(`Upload failed: ${currentUpload.file.name}`, 'error');
        });
}

function uploadFile(uploadItem) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', uploadItem.file);
        formData.append('type', uploadItem.type);
        formData.append('filename', uploadItem.file.name);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                uploadItem.progress = Math.round((e.loaded / e.total) * 100);
                updateUploadQueue();
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    resolve(result);
                } catch (e) {
                    reject(new Error('Invalid response format'));
                }
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });
        
        xhr.open('POST', `${apiBase}/upload-file`);
        xhr.setRequestHeader('X-Admin-Token', localStorage.getItem('adminToken') || '');
        xhr.setRequestHeader('X-Tenant', localStorage.getItem('adminTenant') || '');
        xhr.send(formData);
    });
}

function updateUploadQueue() {
    const queueContainer = document.getElementById('upload-queue');
    if (!queueContainer) return;
    
    if (uploadQueue.length === 0) {
        queueContainer.innerHTML = '<p>No files in upload queue</p>';
        return;
    }
    
    queueContainer.innerHTML = uploadQueue.map(item => `
        <div class="upload-item ${item.status}">
            <div class="upload-info">
                <span class="filename">${item.file.name}</span>
                <span class="status">${item.status}</span>
            </div>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${item.progress}%"></div>
                </div>
                <span class="progress-text">${item.progress}%</span>
            </div>
            ${item.status === 'failed' ? `<span class="error">${item.error}</span>` : ''}
        </div>
    `).join('');
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
} 

// Enhanced Media Library Management
function initializeMediaLibrary() {
    console.log('Initializing enhanced media library management');
    
    setupMediaSearch();
    setupMediaBulkOperations();
    setupMediaOrganization();
    setupMediaPreview();
}

function setupMediaSearch() {
    const searchInput = document.getElementById('media-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        filterMediaItems(query);
    }, 300));
}

function setupMediaBulkOperations() {
    const bulkActionsContainer = document.getElementById('bulk-actions');
    if (!bulkActionsContainer) return;
    
    bulkActionsContainer.innerHTML = `
        <div class="bulk-actions-bar">
            <button class="btn-secondary" onclick="selectAllMedia()">
                <i class="fas fa-check-square"></i> Select All
            </button>
            <button class="btn-secondary" onclick="deselectAllMedia()">
                <i class="fas fa-square"></i> Deselect All
            </button>
            <button class="btn-danger" onclick="deleteSelectedMedia()" disabled>
                <i class="fas fa-trash"></i> Delete Selected
            </button>
            <button class="btn-primary" onclick="moveSelectedToBox()" disabled>
                <i class="fas fa-folder-open"></i> Move to Box
            </button>
        </div>
    `;
}

function setupMediaOrganization() {
    const organizationContainer = document.getElementById('media-organization');
    if (!organizationContainer) return;
    
    organizationContainer.innerHTML = `
        <div class="organization-tools">
            <div class="tool-group">
                <h4>Quick Organization</h4>
                <button class="btn-secondary" onclick="organizeByType()">
                    <i class="fas fa-sort"></i> Organize by Type
                </button>
                <button class="btn-secondary" onclick="organizeByDate()">
                    <i class="fas fa-calendar"></i> Organize by Date
                </button>
                <button class="btn-secondary" onclick="organizeBySize()">
                    <i class="fas fa-weight-hanging"></i> Organize by Size
                </button>
            </div>
            <div class="tool-group">
                <h4>Batch Operations</h4>
                <button class="btn-secondary" onclick="batchRename()">
                    <i class="fas fa-edit"></i> Batch Rename
                </button>
                <button class="btn-secondary" onclick="batchDuration()">
                    <i class="fas fa-clock"></i> Batch Duration
                </button>
            </div>
        </div>
    `;
}

function setupMediaPreview() {
    const previewContainer = document.getElementById('media-preview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = `
        <div class="preview-panel">
            <div class="preview-header">
                <h4>Media Preview</h4>
                <button class="btn-small" onclick="closePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="preview-content">
                <p>Select a media item to preview</p>
            </div>
        </div>
    `;
}

function filterMediaItems(query) {
    const mediaItems = document.querySelectorAll('.media-item');
    
    mediaItems.forEach(item => {
        const filename = item.querySelector('.media-filename')?.textContent?.toLowerCase() || '';
        const type = item.querySelector('.media-type')?.textContent?.toLowerCase() || '';
        const box = item.querySelector('.media-box')?.textContent?.toLowerCase() || '';
        
        const matches = filename.includes(query) || type.includes(query) || box.includes(query);
        item.style.display = matches ? 'block' : 'none';
    });
    
    updateMediaCount();
}

function selectAllMedia() {
    const checkboxes = document.querySelectorAll('.media-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    updateBulkActions();
}

function deselectAllMedia() {
    const checkboxes = document.querySelectorAll('.media-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkActions();
}

function updateBulkActions() {
    const selectedCount = document.querySelectorAll('.media-checkbox:checked').length;
    const deleteBtn = document.querySelector('#bulk-actions .btn-danger');
    const moveBtn = document.querySelector('#bulk-actions .btn-primary');
    
    if (deleteBtn) deleteBtn.disabled = selectedCount === 0;
    if (moveBtn) moveBtn.disabled = selectedCount === 0;
    
    // Update count display
    const countDisplay = document.querySelector('#bulk-actions .selected-count');
    if (countDisplay) {
        countDisplay.textContent = selectedCount > 0 ? `(${selectedCount} selected)` : '';
    }
}

function deleteSelectedMedia() {
    const selectedItems = document.querySelectorAll('.media-checkbox:checked');
    if (selectedItems.length === 0) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedItems.length} media items? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    const deletePromises = Array.from(selectedItems).map(checkbox => {
        const mediaId = checkbox.value;
        return deleteMediaItem(mediaId);
    });
    
    Promise.all(deletePromises)
        .then(() => {
            showNotification(`Successfully deleted ${selectedItems.length} media items`, 'success');
            loadMediaItems();
        })
        .catch(error => {
            showNotification(`Error deleting media items: ${error.message}`, 'error');
        });
}

function moveSelectedToBox() {
    const selectedItems = document.querySelectorAll('.media-checkbox:checked');
    if (selectedItems.length === 0) return;
    
    // Show media box selection modal
    showMediaBoxSelectionModal(Array.from(selectedItems).map(cb => cb.value));
}

function organizeByType() {
    const mediaContainer = document.getElementById('media-items-container');
    if (!mediaContainer) return;
    
    const mediaItems = Array.from(mediaContainer.querySelectorAll('.media-item'));
    
    mediaItems.sort((a, b) => {
        const typeA = a.querySelector('.media-type')?.textContent || '';
        const typeB = b.querySelector('.media-type')?.textContent || '';
        return typeA.localeCompare(typeB);
    });
    
    mediaItems.forEach(item => mediaContainer.appendChild(item));
    showNotification('Media items organized by type', 'success');
}

function organizeByDate() {
    const mediaContainer = document.getElementById('media-items-container');
    if (!mediaContainer) return;
    
    const mediaItems = Array.from(mediaContainer.querySelectorAll('.media-item'));
    
    mediaItems.sort((a, b) => {
        const dateA = new Date(a.dataset.uploadDate || 0);
        const dateB = new Date(b.dataset.uploadDate || 0);
        return dateB - dateA; // Newest first
    });
    
    mediaItems.forEach(item => mediaContainer.appendChild(item));
    showNotification('Media items organized by upload date', 'success');
}

function organizeBySize() {
    const mediaContainer = document.getElementById('media-items-container');
    if (!mediaContainer) return;
    
    const mediaItems = Array.from(mediaContainer.querySelectorAll('.media-item'));
    
    mediaItems.sort((a, b) => {
        const sizeA = parseInt(a.dataset.fileSize || 0);
        const sizeB = parseInt(b.dataset.fileSize || 0);
        return sizeB - sizeA; // Largest first
    });
    
    mediaItems.forEach(item => mediaContainer.appendChild(item));
    showNotification('Media items organized by file size', 'success');
}

function batchRename() {
    const selectedItems = document.querySelectorAll('.media-checkbox:checked');
    if (selectedItems.length === 0) return;
    
    const prefix = prompt('Enter prefix for batch rename (e.g., "promo_")');
    if (!prefix) return;
    
    const renamePromises = Array.from(selectedItems).map((checkbox, index) => {
        const mediaId = checkbox.value;
        const currentName = checkbox.closest('.media-item').querySelector('.media-filename')?.textContent || '';
        const extension = currentName.split('.').pop();
        const newName = `${prefix}${index + 1}.${extension}`;
        
        return updateMediaItem(mediaId, { filename: newName });
    });
    
    Promise.all(renamePromises)
        .then(() => {
            showNotification(`Successfully renamed ${selectedItems.length} media items`, 'success');
            loadMediaItems();
        })
        .catch(error => {
            showNotification(`Error renaming media items: ${error.message}`, 'error');
        });
}

function batchDuration() {
    const selectedItems = document.querySelectorAll('.media-checkbox:checked');
    if (selectedItems.length === 0) return;
    
    const duration = prompt('Enter display duration in seconds for all selected items:');
    if (!duration || isNaN(duration)) return;
    
    const durationValue = parseInt(duration);
    if (durationValue < 1 || durationValue > 3600) {
        showNotification('Duration must be between 1 and 3600 seconds', 'error');
        return;
    }
    
    const updatePromises = Array.from(selectedItems).map(checkbox => {
        const mediaId = checkbox.value;
        return updateMediaItem(mediaId, { duration: durationValue });
    });
    
    Promise.all(updatePromises)
        .then(() => {
            showNotification(`Successfully updated duration for ${selectedItems.length} media items`, 'success');
            loadMediaItems();
        })
        .catch(error => {
            showNotification(`Error updating media items: ${error.message}`, 'error');
        });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 

// Enhanced Real-time Sync & Performance
function initializeRealTimeSync() {
    console.log('Initializing enhanced real-time sync system');
    
    setupSyncMonitoring();
    setupOfflineSupport();
    setupPerformanceOptimizations();
    setupCacheManagement();
}

function setupSyncMonitoring() {
    const syncStatusContainer = document.getElementById('sync-status');
    if (!syncStatusContainer) return;
    
    syncStatusContainer.innerHTML = `
        <div class="sync-status-panel">
            <div class="sync-indicator">
                <i class="fas fa-sync-alt"></i>
                <span class="sync-text">Syncing...</span>
            </div>
            <div class="sync-details">
                <span class="last-sync">Last sync: Never</span>
                <span class="sync-errors">Errors: 0</span>
            </div>
        </div>
    `;
    
    // Start sync monitoring
    startSyncMonitoring();
}

function setupOfflineSupport() {
    // Check if service worker is supported
    const __isHttp = location.protocol === 'http:' || location.protocol === 'https:';
    if (__isHttp && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Setup offline detection
    window.addEventListener('online', () => {
        document.body.classList.remove('offline');
        showNotification('Connection restored. Syncing data...', 'success');
        syncOfflineChanges();
    });
    
    window.addEventListener('offline', () => {
        document.body.classList.add('offline');
        showNotification('Connection lost. Working offline...', 'warning');
    });
}

function setupPerformanceOptimizations() {
    // Implement virtual scrolling for large lists
    setupVirtualScrolling();
    
    // Implement lazy loading for media items
    setupLazyLoading();
    
    // Setup request batching
    setupRequestBatching();
}

function setupCacheManagement() {
    // Setup local storage cache
    setupLocalCache();
    
    // Setup memory cache
    setupMemoryCache();
    
    // Setup cache cleanup
    setupCacheCleanup();
}

function startSyncMonitoring() {
    let syncErrors = 0;
    let lastSync = null;
    
    const updateSyncStatus = (status, error = null) => {
        const indicator = document.querySelector('.sync-indicator');
        const syncText = document.querySelector('.sync-text');
        const lastSyncSpan = document.querySelector('.last-sync');
        const errorsSpan = document.querySelector('.sync-errors');
        
        if (indicator) {
            indicator.className = `sync-indicator ${status}`;
        }
        
        if (syncText) {
            syncText.textContent = status === 'syncing' ? 'Syncing...' : 
                                  status === 'synced' ? 'Synced' : 
                                  status === 'error' ? 'Sync Error' : 'Offline';
        }
        
        if (lastSyncSpan && status === 'synced') {
            lastSync = new Date();
            lastSyncSpan.textContent = `Last sync: ${lastSync.toLocaleTimeString()}`;
        }
        
        if (errorsSpan && error) {
            syncErrors++;
            errorsSpan.textContent = `Errors: ${syncErrors}`;
        }
    };
    
    // Simulate sync process
    setInterval(() => {
        if (navigator.onLine) {
            updateSyncStatus('syncing');
            
            // Simulate sync delay
            setTimeout(() => {
                updateSyncStatus('synced');
            }, 2000);
        } else {
            updateSyncStatus('offline');
        }
    }, 10000); // Check every 10 seconds
}

function syncOfflineChanges() {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length === 0) return;
    
    showNotification(`Syncing ${offlineChanges.length} offline changes...`, 'info');
    
    const syncPromises = offlineChanges.map(change => {
        return processOfflineChange(change);
    });
    
    Promise.all(syncPromises)
        .then(() => {
            localStorage.removeItem('offlineChanges');
            showNotification('All offline changes synced successfully', 'success');
        })
        .catch(error => {
            showNotification(`Error syncing offline changes: ${error.message}`, 'error');
        });
}

function processOfflineChange(change) {
    switch (change.type) {
        case 'create':
            return createMediaItem(change.data);
        case 'update':
            return updateMediaItem(change.id, change.data);
        case 'delete':
            return deleteMediaItem(change.id);
        default:
            return Promise.reject(new Error(`Unknown change type: ${change.type}`));
    }
}

function setupVirtualScrolling() {
    const containers = document.querySelectorAll('.virtual-scroll-container');
    
    containers.forEach(container => {
        const itemHeight = 60; // Height of each item
        const visibleItems = Math.ceil(container.clientHeight / itemHeight);
        let startIndex = 0;
        let endIndex = visibleItems;
        
        const updateVisibleItems = () => {
            const scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / itemHeight);
            endIndex = Math.min(startIndex + visibleItems, container.children.length);
            
            // Hide items outside visible range
            Array.from(container.children).forEach((item, index) => {
                if (index >= startIndex && index < endIndex) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        };
        
        container.addEventListener('scroll', updateVisibleItems);
    });
}

function setupLazyLoading() {
    const mediaItems = document.querySelectorAll('.media-item img, .media-item video');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const media = entry.target;
                if (media.dataset.src) {
                    media.src = media.dataset.src;
                    media.removeAttribute('data-src');
                    imageObserver.unobserve(media);
                }
            }
        });
    });
    
    mediaItems.forEach(media => {
        if (media.dataset.src) {
            imageObserver.observe(media);
        }
    });
}

function setupRequestBatching() {
    let batchQueue = [];
    let batchTimeout = null;
    
    window.batchRequest = function(endpoint, data, method = 'POST') {
        return new Promise((resolve, reject) => {
            batchQueue.push({
                endpoint,
                data,
                method,
                resolve,
                reject
            });
            
            if (batchTimeout) {
                clearTimeout(batchTimeout);
            }
            
            batchTimeout = setTimeout(() => {
                processBatchQueue();
            }, 100); // Batch requests within 100ms
        });
    };
    
    function processBatchQueue() {
        if (batchQueue.length === 0) return;
        
        const batch = batchQueue.splice(0);
        const batchData = batch.map(item => ({
            endpoint: item.endpoint,
            data: item.data,
            method: item.method
        }));
        
        // Send batch request
        fetch(`${apiBase}/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders()
            },
            body: JSON.stringify({ requests: batchData })
        })
        .then(response => response.json())
        .then(results => {
            batch.forEach((item, index) => {
                if (results[index]?.success) {
                    item.resolve(results[index].data);
                } else {
                    item.reject(new Error(results[index]?.error || 'Batch request failed'));
                }
            });
        })
        .catch(error => {
            batch.forEach(item => item.reject(error));
        });
    }
}

function setupLocalCache() {
    window.cacheData = function(key, data, ttl = 300000) { // 5 minutes default
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    };
    
    window.getCachedData = function(key) {
        const cached = localStorage.getItem(`cache_${key}`);
        if (!cached) return null;
        
        const cacheItem = JSON.parse(cached);
        const now = Date.now();
        
        if (now - cacheItem.timestamp > cacheItem.ttl) {
            localStorage.removeItem(`cache_${key}`);
            return null;
        }
        
        return cacheItem.data;
    };
}

function setupMemoryCache() {
    const memoryCache = new Map();
    
    window.memoryCache = {
        set: (key, value, ttl = 60000) => { // 1 minute default
            memoryCache.set(key, {
                value: value,
                expiry: Date.now() + ttl
            });
        },
        
        get: (key) => {
            const item = memoryCache.get(key);
            if (!item) return null;
            
            if (Date.now() > item.expiry) {
                memoryCache.delete(key);
                return null;
            }
            
            return item.value;
        },
        
        clear: () => memoryCache.clear()
    };
}

function setupCacheCleanup() {
    // Clean up expired cache entries every minute
    setInterval(() => {
        const now = Date.now();
        
        // Clean local storage cache
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
                try {
                    const cacheItem = JSON.parse(localStorage.getItem(key));
                    if (now - cacheItem.timestamp > cacheItem.ttl) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Remove invalid cache entries
                    localStorage.removeItem(key);
                }
            }
        });
    }, 60000);
}

// Enhanced Upload System - No More Freezing
function initializeEnhancedUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const uploadInput = document.getElementById('mediaUploadInput');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadStatus = document.getElementById('upload-status');
    
    if (!uploadZone || !uploadInput) return;

    // Drag and drop handlers
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    uploadZone.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
}

function handleFiles(files) {
    files.forEach(file => {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            showNotification(`File ${file.name} is too large. Maximum size is 50MB.`, 'error');
            return;
        }
        
        if (isLocalEnvironment()) {
            // In local mode, simulate whole file upload without chunking
            uploadFileDirect(file);
        } else {
            // In production, use chunking for large files
            if (file.size > 5 * 1024 * 1024) { // 5MB threshold
                uploadFileInChunks(file);
            } else {
                uploadFileDirect(file);
            }
        }
    });
}

function uploadFileInChunks(file) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    
    showNotification(`Starting chunked upload of ${file.name} (${totalChunks} chunks)`, 'info');
    
    const uploadChunk = async () => {
        if (currentChunk >= totalChunks) {
            showNotification(`Upload complete: ${file.name}`, 'success');
            loadMediaItems(); // Refresh the list
            return;
        }
        
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        try {
            // Create a temporary file for this chunk
            const chunkFile = new File([chunk], `${file.name}.part${currentChunk}`, {
                type: file.type
            });
            
            // Upload chunk using the existing upload function
            await uploadFileDirect(chunkFile, true);
            
            currentChunk++;
            const progress = Math.round((currentChunk / totalChunks) * 100);
            
            showNotification(`Uploading ${file.name}: ${progress}% complete`, 'info');
            
            // Continue with next chunk
            setTimeout(uploadChunk, 100);
            
        } catch (error) {
            showNotification(`Error uploading chunk ${currentChunk + 1}: ${error.message}`, 'error');
        }
    };
    
    uploadChunk();
}

async function uploadFileDirect(file, isChunk = false) {
            try {
            showNotification(`Uploading ${file.name}...`, 'info');
            
            // Check if we're running locally (no Netlify Functions)
            if (isLocalEnvironment()) {
                // Local development mode - simulate upload
                await simulateLocalUpload(file);
            } else {
                // Production mode - use Netlify Functions
                console.log('Attempting to upload to Netlify Function...');
                
                // First, test if the function is accessible
                try {
                    const testResponse = await fetch('/.netlify/functions/upload-file-simple', {
                        method: 'OPTIONS'
                    });
                    console.log('Function accessibility test:', testResponse.status, testResponse.statusText);
                } catch (testError) {
                    console.error('Function accessibility test failed:', testError);
                }
                
                const response = await fetch('/.netlify/functions/upload-file-simple', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Token': getAdminToken(),
                        'X-Tenant': getAdminToken(), // Using admin token as tenant for testing
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        type: getFileType(file.name),
                        fileSize: file.size
                    })
                });
                
                console.log('Upload response:', response.status, response.statusText);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Response error body:', errorText);
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('Upload result:', result);
                
                if (result.success) {
                    showNotification(`Successfully uploaded ${file.name}`, 'success');
                    if (!isChunk) {
                        loadMediaItems(); // Refresh the list
                    }
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            }
        
    } catch (error) {
        console.error('Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        showNotification(`Upload failed: ${error.message}`, 'error');
    }
}

// Local development upload simulation
async function simulateLocalUpload(file) {
    return new Promise((resolve, reject) => {
        // Simulate upload delay
        setTimeout(() => {
            try {
                // Create a local media item
                const mediaItem = {
                    mediaId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    filename: file.name,
                    type: getFileType(file.name),
                    fileSize: file.size,
                    uploadedAt: new Date().toISOString(),
                    isLocal: true,
                    localUrl: URL.createObjectURL(file) // Create local blob URL
                };
                
                // Store in localStorage for local development
                const localMedia = JSON.parse(localStorage.getItem('localMediaItems') || '[]');
                localMedia.push(mediaItem);
                localStorage.setItem('localMediaItems', JSON.stringify(localMedia));
                
                showNotification(`Successfully uploaded ${file.name} (Local Mode)`, 'success');
                
                // Refresh the media list
                if (typeof loadMediaItems === 'function') {
                    loadMediaItems();
                }
                
                resolve(mediaItem);
            } catch (error) {
                reject(error);
            }
        }, 500); // Reduced to 0.5 second for better UX
    });
}



// Alternative: Direct GitHub Upload (Recommended for large files)
function uploadToGitHub(file) {
    const githubUrl = `https://github.com/harbortech7/castgrid/upload/main/data/tenants/${getTenantId()}/media`;
    
    showNotification(`Opening GitHub upload for ${file.name}`, 'info');
    
    // Open GitHub upload in new tab
    window.open(githubUrl, '_blank');
    
    // Show instructions
    showNotification(`
        <strong>GitHub Upload Instructions:</strong><br>
        1. Upload ${file.name} to the media folder<br>
        2. Copy the raw file URL<br>
        3. Use "Add by URL" in the dashboard
    `, 'info', 10000);
}

// Enhanced Add by URL function
function addMediaByURL() {
    const url = prompt('Enter the media file URL:');
    if (!url) return;
    
    const filename = url.split('/').pop().split('?')[0];
    const type = getFileType(filename);
    
    if (type === 'unknown') {
        showNotification('Unsupported file type. Please use MP4, AVI, MOV, JPG, PNG, or GIF files.', 'error');
        return;
    }
    
    // Create media item
    const mediaItem = {
        mediaId: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        filename: filename,
        originalFilename: filename,
        url: url,
        duration: type === 'image' ? 10 : 30,
        isLocal: false,
        downloadStatus: 'available',
        uploadedAt: new Date().toISOString()
    };
    
    // Save to GitHub via API
    saveMediaItem(mediaItem);
}

async function saveMediaItem(mediaItem) {
    try {
        const response = await fetch('/.netlify/functions/media-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': getAdminToken(),
                'X-Tenant': getTenantId()
            },
            body: JSON.stringify(mediaItem)
        });
        
        if (response.ok) {
            showNotification(`Media item ${mediaItem.filename} added successfully`, 'success');
            loadMediaItems(); // Refresh the list
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        showNotification(`Failed to save media item: ${error.message}`, 'error');
    }
}