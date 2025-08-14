// ===== CastGrid Admin Dashboard JavaScript =====

// Global variables
let firebaseApp = null;
let db = null;
let storage = null;
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
    loadStoredConfig();
});

function initializeApp() {
    console.log('CastGrid Admin Dashboard Initialized');
    
    // Check if Firebase config exists in localStorage
    const savedConfig = localStorage.getItem('castgrid-firebase-config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            initializeFirebase(config);
        } catch (error) {
            console.error('Error loading saved Firebase config:', error);
        }
    }
    
    // Load setup progress
    const savedProgress = localStorage.getItem('castgrid-setup-progress');
    if (savedProgress) {
        try {
            setupProgress = { ...setupProgress, ...JSON.parse(savedProgress) };
            updateSetupUI();
        } catch (error) {
            console.error('Error loading setup progress:', error);
        }
    }
}

// ===== Event Listeners =====

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            navigateToSection(section);
        });
    });
    
    // Firebase setup
    document.getElementById('test-connection')?.addEventListener('click', testFirebaseConnection);
    
    // File upload
    setupFileUpload();
    
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
            loadMediaLibrary();
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

// ===== Firebase Setup =====

function saveFirebaseConfig() {
    const configText = document.getElementById('firebase-config').value.trim();
    
    if (!configText) {
        showNotification('Please enter your Firebase configuration', 'error');
        return;
    }
    
    try {
        // Extract the config object from the text
        const match = configText.match(/firebaseConfig\s*=\s*({[\s\S]*?});?/);
        if (!match) {
            throw new Error('Invalid configuration format');
        }
        
        const configObj = eval('(' + match[1] + ')');
        
        // Validate required fields
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        for (const field of requiredFields) {
            if (!configObj[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Save configuration
        localStorage.setItem('castgrid-firebase-config', JSON.stringify(configObj));
        
        // Initialize Firebase
        initializeFirebase(configObj);
        
        // Mark step as completed
        setupProgress.step3 = true;
        saveSetupProgress();
        updateSetupUI();
        
        showNotification('Firebase configuration saved successfully!', 'success');
        
    } catch (error) {
        showNotification('Error parsing Firebase configuration: ' + error.message, 'error');
    }
}

function initializeFirebase(config) {
    try {
        if (firebaseApp) {
            firebaseApp.delete();
        }
        
        firebaseApp = firebase.initializeApp(config);
        db = firebase.firestore();
        storage = firebase.storage();
        
        // Enable offline persistence
        db.enablePersistence({ synchronizeTabs: true }).catch(error => {
            console.warn('Firestore persistence failed:', error);
        });
        
        updateConnectionStatus(true);
        console.log('Firebase initialized successfully');
        
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        updateConnectionStatus(false);
        showNotification('Firebase initialization failed: ' + error.message, 'error');
    }
}

function testFirebaseConnection() {
    if (!db) {
        showNotification('Firebase not configured', 'error');
        return;
    }
    
    showLoading(true);
    const resultDiv = document.getElementById('connection-result');
    
    // Test Firestore connection
    db.collection('test').limit(1).get()
        .then(() => {
            resultDiv.className = 'connection-result success';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '✅ Firebase connection successful!<br>Firestore and Storage are ready to use.';
            
            // Mark step as completed
            setupProgress.step4 = true;
            saveSetupProgress();
            updateSetupUI();
            
            showNotification('Firebase connection test passed!', 'success');
        })
        .catch(error => {
            resultDiv.className = 'connection-result error';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '❌ Connection failed: ' + error.message;
            showNotification('Firebase connection test failed', 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function updateConnectionStatus(connected) {
    const statusBtn = document.getElementById('firebase-status');
    if (connected) {
        statusBtn.className = 'status-btn connected';
        statusBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>Connected</span>';
    } else {
        statusBtn.className = 'status-btn disconnected';
        statusBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Not Connected</span>';
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

function loadDevices() {
    if (!db) {
        showNotification('Firebase not connected', 'error');
        return;
    }
    
    showLoading(true);
    
    db.collection('devices').get()
        .then(snapshot => {
            currentDevices = [];
            snapshot.forEach(doc => {
                currentDevices.push({ id: doc.id, ...doc.data() });
            });
            renderDevices();
            updateDeviceSelectors();
        })
        .catch(error => {
            console.error('Error loading devices:', error);
            showNotification('Error loading devices: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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
        case 4: return 'Quad';
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

function handleDeviceSubmit(e) {
    e.preventDefault();
    
    const deviceId = document.getElementById('device-id').value.trim();
    const location = document.getElementById('device-location').value.trim();
    const gridCount = parseInt(document.getElementById('device-grid-count').value);
    
    if (!deviceId || !location) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check if device ID already exists
    if (currentDevices.find(d => d.deviceId === deviceId)) {
        showNotification('Device ID already exists', 'error');
        return;
    }
    
    showLoading(true);
    
    // Create device object
    const device = {
        deviceId: deviceId,
        location: location,
        grids: generateGridIds(deviceId, gridCount)
    };
    
    // Save to Firestore
    db.collection('devices').doc(deviceId).set(device)
        .then(() => {
            // Create grid documents
            return createGridsForDevice(device);
        })
        .then(() => {
            currentDevices.push(device);
            renderDevices();
            updateDeviceSelectors();
            closeModal('device-modal');
            showNotification('Device created successfully!', 'success');
        })
        .catch(error => {
            console.error('Error creating device:', error);
            showNotification('Error creating device: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function generateGridIds(deviceId, gridCount) {
    const grids = [];
    for (let i = 1; i <= gridCount; i++) {
        grids.push(`${deviceId}_grid_${i}`);
    }
    return grids;
}

function createGridsForDevice(device) {
    const batch = db.batch();
    
    device.grids.forEach((gridId, index) => {
        const gridRef = db.collection('grids').doc(gridId);
        batch.set(gridRef, {
            gridId: gridId,
            deviceId: device.deviceId,
            position: index + 1,
            mediaBoxId: ''
        });
    });
    
    return batch.commit();
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

function deleteDevice(deviceId) {
    if (!confirm(`Are you sure you want to delete device "${deviceId}"? This action cannot be undone.`)) {
        return;
    }
    
    showLoading(true);
    
    const device = currentDevices.find(d => d.deviceId === deviceId);
    if (!device) return;
    
    // Delete device and associated grids
    const batch = db.batch();
    
    // Delete device
    batch.delete(db.collection('devices').doc(deviceId));
    
    // Delete associated grids
    device.grids.forEach(gridId => {
        batch.delete(db.collection('grids').doc(gridId));
    });
    
    batch.commit()
        .then(() => {
            currentDevices = currentDevices.filter(d => d.deviceId !== deviceId);
            renderDevices();
            updateDeviceSelectors();
            showNotification('Device deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting device:', error);
            showNotification('Error deleting device: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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

function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
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
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    if (!storage) {
        showNotification('Firebase not connected', 'error');
        return;
    }
    
    const validFiles = Array.from(files).filter(file => {
        const isValidType = file.type.startsWith('video/') || file.type.startsWith('image/');
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
        
        if (!isValidType) {
            showNotification(`${file.name}: Invalid file type`, 'error');
            return false;
        }
        
        if (!isValidSize) {
            showNotification(`${file.name}: File too large (max 50MB)`, 'error');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length === 0) return;
    
    // Upload files
    validFiles.forEach(file => uploadFile(file));
}

function uploadFile(file) {
    const progressContainer = document.getElementById('upload-progress');
    const progressId = 'progress_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create progress item
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item';
    progressItem.id = progressId;
    progressItem.innerHTML = `
        <div class="progress-header">
            <span>${file.name}</span>
            <span class="progress-percentage">0%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
    progressContainer.appendChild(progressItem);
    
    // Create storage reference
    const fileName = `media/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(fileName);
    
    // Start upload
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const progressFill = progressItem.querySelector('.progress-fill');
            const progressText = progressItem.querySelector('.progress-percentage');
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        },
        (error) => {
            // Error
            console.error('Upload error:', error);
            progressItem.style.borderColor = 'var(--danger-color)';
            progressItem.querySelector('.progress-percentage').textContent = 'Failed';
            showNotification(`Upload failed: ${file.name}`, 'error');
        },
        () => {
            // Success
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Create media item
                const mediaItem = {
                    mediaId: generateMediaId(),
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    filename: file.name,
                    url: downloadURL,
                    duration: file.type.startsWith('video/') ? 30 : 10 // Default durations
                };
                
                // Save to Firestore
                return db.collection('media-items').doc(mediaItem.mediaId).set(mediaItem);
            }).then(() => {
                // Success
                progressItem.style.borderColor = 'var(--secondary-color)';
                progressItem.querySelector('.progress-percentage').textContent = 'Complete';
                
                // Remove progress item after delay
                setTimeout(() => {
                    progressItem.remove();
                }, 3000);
                
                // Reload media library
                loadMediaLibrary();
                showNotification(`${file.name} uploaded successfully!`, 'success');
                
            }).catch(error => {
                console.error('Error saving media item:', error);
                progressItem.style.borderColor = 'var(--danger-color)';
                progressItem.querySelector('.progress-percentage').textContent = 'Failed';
                showNotification(`Error saving ${file.name}`, 'error');
            });
        }
    );
}

function generateMediaId() {
    return 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadMediaLibrary() {
    if (!db) {
        showNotification('Firebase not connected', 'error');
        return;
    }
    
    showLoading(true);
    
    db.collection('media-items').get()
        .then(snapshot => {
            currentMediaItems = [];
            snapshot.forEach(doc => {
                currentMediaItems.push({ id: doc.id, ...doc.data() });
            });
            renderMediaGrid();
        })
        .catch(error => {
            console.error('Error loading media:', error);
            showNotification('Error loading media: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderMediaGrid(filteredItems = null) {
    const grid = document.getElementById('media-grid');
    if (!grid) return;
    
    const items = filteredItems || currentMediaItems;
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <i class="fas fa-photo-video" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3 style="color: #666;">No media files</h3>
                <p style="color: #999;">Upload videos and images to get started</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="media-item" data-media-id="${item.mediaId}" data-type="${item.type}">
            <div class="media-preview">
                ${item.type === 'image' ? 
                    `<img src="${item.url}" alt="${item.filename}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\"fas fa-image\\" style=\\"font-size: 2rem; color: #ccc;\\"></i>'">` :
                    `<i class="fas fa-play-circle" style="font-size: 2rem; color: #ccc;"></i>`
                }
                <div class="media-type-icon">
                    <i class="fas fa-${item.type === 'video' ? 'video' : 'image'}"></i>
                </div>
            </div>
            <div class="media-info">
                <h4 class="media-name" title="${item.filename}">${item.filename}</h4>
                <p class="media-details">${item.type} • ${item.duration}s</p>
            </div>
            <div class="media-actions">
                <button onclick="previewMedia('${item.mediaId}')" title="Preview">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editMedia('${item.mediaId}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteMedia('${item.mediaId}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
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
                <h3>Preview: ${media.filename}</h3>
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
                        <label>Filename:</label>
                        <input type="text" id="edit-filename" value="${media.filename}" required>
                    </div>
                    <div class="form-group">
                        <label>Duration (seconds):</label>
                        <input type="number" id="edit-duration" value="${media.duration}" min="1" max="300" required>
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

function updateMedia(event, mediaId) {
    event.preventDefault();
    
    const filename = document.getElementById('edit-filename').value.trim();
    const duration = parseInt(document.getElementById('edit-duration').value);
    
    if (!filename) {
        showNotification('Filename is required', 'error');
        return;
    }
    
    showLoading(true);
    
    db.collection('media-items').doc(mediaId).update({
        filename: filename,
        duration: duration
    })
    .then(() => {
        // Update local data
        const media = currentMediaItems.find(m => m.mediaId === mediaId);
        if (media) {
            media.filename = filename;
            media.duration = duration;
        }
        
        renderMediaGrid();
        document.querySelector('.modal.show')?.remove();
        showNotification('Media updated successfully!', 'success');
    })
    .catch(error => {
        console.error('Error updating media:', error);
        showNotification('Error updating media: ' + error.message, 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

function deleteMedia(mediaId) {
    const media = currentMediaItems.find(m => m.mediaId === mediaId);
    if (!media) return;
    
    if (!confirm(`Are you sure you want to delete "${media.filename}"? This action cannot be undone.`)) {
        return;
    }
    
    showLoading(true);
    
    // Delete from Firestore
    db.collection('media-items').doc(mediaId).delete()
        .then(() => {
            // Remove from storage (optional - files will remain accessible by URL)
            // This is a design choice - you might want to keep files for backup
            
            // Update local data
            currentMediaItems = currentMediaItems.filter(m => m.mediaId !== mediaId);
            renderMediaGrid();
            showNotification('Media deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting media:', error);
            showNotification('Error deleting media: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// ===== Media Boxes Management =====

function loadMediaBoxes() {
    if (!db) {
        showNotification('Firebase not connected', 'error');
        return;
    }
    
    showLoading(true);
    
    db.collection('media-boxes').get()
        .then(snapshot => {
            currentMediaBoxes = [];
            snapshot.forEach(doc => {
                currentMediaBoxes.push({ id: doc.id, ...doc.data() });
            });
            renderMediaBoxes();
        })
        .catch(error => {
            console.error('Error loading media boxes:', error);
            showNotification('Error loading media boxes: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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

function addMediaBox() {
    const name = prompt('Enter media box name:');
    if (!name) return;
    
    showLoading(true);
    
    const mediaBox = {
        mediaBoxId: generateMediaBoxId(),
        name: name.trim(),
        mediaItems: []
    };
    
    db.collection('media-boxes').doc(mediaBox.mediaBoxId).set(mediaBox)
        .then(() => {
            currentMediaBoxes.push(mediaBox);
            renderMediaBoxes();
            showNotification('Media box created successfully!', 'success');
        })
        .catch(error => {
            console.error('Error creating media box:', error);
            showNotification('Error creating media box: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function generateMediaBoxId() {
    return 'mb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function editMediaBox(boxId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    
    const newName = prompt('Enter new name:', box.name);
    if (!newName || newName.trim() === box.name) return;
    
    showLoading(true);
    
    db.collection('media-boxes').doc(boxId).update({ name: newName.trim() })
        .then(() => {
            box.name = newName.trim();
            renderMediaBoxes();
            showNotification('Media box updated successfully!', 'success');
        })
        .catch(error => {
            console.error('Error updating media box:', error);
            showNotification('Error updating media box: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function deleteMediaBox(boxId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    
    if (!confirm(`Are you sure you want to delete "${box.name}"? This action cannot be undone.`)) {
        return;
    }
    
    showLoading(true);
    
    db.collection('media-boxes').doc(boxId).delete()
        .then(() => {
            currentMediaBoxes = currentMediaBoxes.filter(b => b.mediaBoxId !== boxId);
            renderMediaBoxes();
            showNotification('Media box deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting media box:', error);
            showNotification('Error deleting media box: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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

function addToMediaBox(boxId, mediaId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box || box.mediaItems.includes(mediaId)) return;
    
    const updatedItems = [...box.mediaItems, mediaId];
    
    db.collection('media-boxes').doc(boxId).update({ mediaItems: updatedItems })
        .then(() => {
            box.mediaItems = updatedItems;
            renderMediaBoxes();
            
            // Update the modal content
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
        })
        .catch(error => {
            console.error('Error adding media to box:', error);
            showNotification('Error adding media: ' + error.message, 'error');
        });
}

function removeFromMediaBox(boxId, mediaId) {
    const box = currentMediaBoxes.find(b => b.mediaBoxId === boxId);
    if (!box) return;
    
    const updatedItems = box.mediaItems.filter(id => id !== mediaId);
    
    db.collection('media-boxes').doc(boxId).update({ mediaItems: updatedItems })
        .then(() => {
            box.mediaItems = updatedItems;
            renderMediaBoxes();
            
            // Update the modal content by removing the item
            const contentDiv = document.getElementById(`box-content-${boxId}`);
            if (contentDiv) {
                // Reload the content div
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
        })
        .catch(error => {
            console.error('Error removing media from box:', error);
            showNotification('Error removing media: ' + error.message, 'error');
        });
}

// ===== Grid Layout Designer =====

function loadGridDesigner() {
    if (!db) {
        showNotification('Firebase not connected', 'error');
        return;
    }
    
    // Load devices if not already loaded
    if (currentDevices.length === 0) {
        loadDevices();
    }
    
    // Load grids
    loadGrids();
}

function loadGrids() {
    showLoading(true);
    
    db.collection('grids').get()
        .then(snapshot => {
            currentGrids = [];
            snapshot.forEach(doc => {
                currentGrids.push({ id: doc.id, ...doc.data() });
            });
        })
        .catch(error => {
            console.error('Error loading grids:', error);
            showNotification('Error loading grids: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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

function assignMediaBoxToGrid(deviceId, position, mediaBoxId) {
    if (!db) return;
    
    showLoading(true);
    
    // Find the grid document
    const device = currentDevices.find(d => d.deviceId === deviceId);
    const gridId = device.grids[position - 1];
    
    // Update the grid
    db.collection('grids').doc(gridId).update({ mediaBoxId: mediaBoxId })
        .then(() => {
            // Update local data
            const grid = currentGrids.find(g => g.gridId === gridId);
            if (grid) {
                grid.mediaBoxId = mediaBoxId;
            }
            
            // Reload the grid layout
            loadGridLayout(deviceId);
            
            // Clear selections
            selectedGridPosition = null;
            selectedDeviceId = null;
            selectedMediaBoxId = null;
            
            const mediaBox = currentMediaBoxes.find(mb => mb.mediaBoxId === mediaBoxId);
            showNotification(`"${mediaBox.name}" assigned to grid position ${position}!`, 'success');
        })
        .catch(error => {
            console.error('Error assigning media box:', error);
            showNotification('Error assigning media box: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
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
        case 4:
            return 'grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;';
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
window.saveFirebaseConfig = saveFirebaseConfig;
window.testFirebaseConnection = testFirebaseConnection;
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