// ===== CastGrid Device Creation Script =====
// Run this in Node.js environment with Firebase Admin SDK

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

async function addDevice(deviceId, location, gridCount) {
  try {
    console.log(`Adding device: ${deviceId}...`);
    
    // Generate grid IDs
    const grids = [];
    for (let i = 1; i <= gridCount; i++) {
      grids.push(`${deviceId}_grid_${i}`);
    }
    
    // Create device object
    const device = {
      deviceId: deviceId,
      location: location,
      grids: grids
    };
    
    // Create batch for atomic operation
    const batch = db.batch();
    
    // Add device document
    const deviceRef = db.collection('devices').doc(deviceId);
    batch.set(deviceRef, device);
    
    // Add grid documents
    grids.forEach((gridId, index) => {
      const gridRef = db.collection('grids').doc(gridId);
      batch.set(gridRef, {
        gridId: gridId,
        deviceId: deviceId,
        position: index + 1,
        mediaBoxId: ''
      });
    });
    
    // Commit batch
    await batch.commit();
    
    console.log(`✅ Device ${deviceId} created successfully!`);
    console.log(`   Location: ${location}`);
    console.log(`   Grids: ${gridCount} (${grids.join(', ')})`);
    
  } catch (error) {
    console.error(`❌ Error creating device: ${error.message}`);
  }
}

// ===== Example Usage =====

async function createExampleDevices() {
  // Add multiple devices
  await addDevice('tv_lobby', 'Main Lobby Display', 2);
  await addDevice('tv_restaurant', 'Restaurant Menu Board', 4); 
  await addDevice('tv_conference', 'Conference Room', 1);
  await addDevice('tv_retail', 'Retail Store Display', 8);
  
  console.log('\n🎉 All devices created!');
  process.exit(0);
}

// Run the script
createExampleDevices();

// ===== Individual Device Creation =====
// Uncomment to add single device:
// addDevice('tv_custom', 'Custom Location', 4); 