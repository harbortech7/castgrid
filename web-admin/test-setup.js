// Test Setup Script for CastGrid
// Run this in the browser console after Firebase is initialized

class CastGridTestSetup {
    constructor() {
        this.firestore = firebase.firestore();
        this.storage = firebase.storage();
    }

    async createTestData() {
        console.log('🚀 Starting CastGrid test data setup...');
        
        try {
            // 1. Create test device
            const deviceId = 'tv_a7f3k9m2_2024';
            const device = {
                deviceId: deviceId,
                location: 'Test Conference Room',
                grids: [],
                createdAt: new Date(),
                lastUpdated: new Date()
            };
            
            await this.firestore.collection('devices').doc(deviceId).set(device);
            console.log('✅ Test device created:', deviceId);

            // 2. Create test media items
            const mediaItems = [
                {
                    mediaId: 'test_video_1',
                    type: 'VIDEO',
                    filename: 'sample_video_1.mp4',
                    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                    duration: 10,
                    name: 'Sample Video 1',
                    createdAt: new Date()
                },
                {
                    mediaId: 'test_image_1',
                    type: 'IMAGE',
                    filename: 'sample_image_1.jpg',
                    url: 'https://picsum.photos/800/600',
                    duration: 5,
                    name: 'Sample Image 1',
                    createdAt: new Date()
                },
                {
                    mediaId: 'test_video_2',
                    type: 'VIDEO',
                    filename: 'sample_video_2.mp4',
                    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
                    duration: 15,
                    name: 'Sample Video 2',
                    createdAt: new Date()
                },
                {
                    mediaId: 'test_image_2',
                    type: 'IMAGE',
                    filename: 'sample_image_2.jpg',
                    url: 'https://picsum.photos/800/600?random=2',
                    duration: 5,
                    name: 'Sample Image 2',
                    createdAt: new Date()
                }
            ];

            for (const media of mediaItems) {
                await this.firestore.collection('media').doc(media.mediaId).set(media);
                console.log('✅ Media item created:', media.name);
            }

            // 3. Create test media boxes
            const mediaBoxes = [
                {
                    mediaBoxId: 'test_box_1',
                    name: 'Test Content Box 1',
                    mediaItems: ['test_video_1', 'test_image_1'],
                    createdAt: new Date()
                },
                {
                    mediaBoxId: 'test_box_2',
                    name: 'Test Content Box 2',
                    mediaItems: ['test_video_2', 'test_image_2'],
                    createdAt: new Date()
                }
            ];

            for (const box of mediaBoxes) {
                await this.firestore.collection('mediaBoxes').doc(box.mediaBoxId).set(box);
                console.log('✅ Media box created:', box.name);
            }

            // 4. Create grid layout
            const grids = [
                {
                    gridId: 'grid_1',
                    deviceId: deviceId,
                    position: 0,
                    mediaBoxId: 'test_box_1',
                    createdAt: new Date()
                },
                {
                    gridId: 'grid_2',
                    deviceId: deviceId,
                    position: 1,
                    mediaBoxId: 'test_box_2',
                    createdAt: new Date()
                },
                {
                    gridId: 'grid_3',
                    deviceId: deviceId,
                    position: 2,
                    mediaBoxId: null,
                    createdAt: new Date()
                },
                {
                    gridId: 'grid_4',
                    deviceId: deviceId,
                    position: 3,
                    mediaBoxId: null,
                    createdAt: new Date()
                }
            ];

            for (const grid of grids) {
                await this.firestore.collection('grids').doc(grid.gridId).set(grid);
                console.log('✅ Grid created:', `Position ${grid.position}`);
            }

            // 5. Update device with grid references
            await this.firestore.collection('devices').doc(deviceId).update({
                grids: grids.map(g => g.gridId),
                lastUpdated: new Date()
            });

            console.log('🎉 Test data setup complete!');
            console.log('📱 Your Android app should now display:');
            console.log('   - Grid 1 (top-left): Test Content Box 1');
            console.log('   - Grid 2 (top-right): Test Content Box 2');
            console.log('   - Grid 3 (bottom-left): Empty');
            console.log('   - Grid 4 (bottom-right): Empty');
            
            return true;
        } catch (error) {
            console.error('❌ Error setting up test data:', error);
            return false;
        }
    }

    async clearTestData() {
        console.log('🧹 Clearing test data...');
        
        try {
            const deviceId = 'tv_a7f3k9m2_2024';
            
            // Clear grids
            const gridSnapshot = await this.firestore.collection('grids')
                .where('deviceId', '==', deviceId)
                .get();
            
            for (const doc of gridSnapshot.docs) {
                await doc.ref.delete();
            }
            
            // Clear media boxes
            const mediaBoxSnapshot = await this.firestore.collection('mediaBoxes')
                .where('mediaBoxId', 'in', ['test_box_1', 'test_box_2'])
                .get();
            
            for (const doc of mediaBoxSnapshot.docs) {
                await doc.ref.delete();
            }
            
            // Clear media items
            const mediaSnapshot = await this.firestore.collection('media')
                .where('mediaId', 'in', ['test_video_1', 'test_image_1', 'test_video_2', 'test_image_2'])
                .get();
            
            for (const doc of mediaSnapshot.docs) {
                await doc.ref.delete();
            }
            
            // Clear device
            await this.firestore.collection('devices').doc(deviceId).delete();
            
            console.log('✅ Test data cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing test data:', error);
            return false;
        }
    }

    async checkTestData() {
        console.log('🔍 Checking test data...');
        
        try {
            const deviceId = 'tv_a7f3k9m2_2024';
            
            // Check device
            const deviceDoc = await this.firestore.collection('devices').doc(deviceId).get();
            if (deviceDoc.exists) {
                console.log('✅ Device found:', deviceDoc.data());
            } else {
                console.log('❌ Device not found');
            }
            
            // Check grids
            const gridSnapshot = await this.firestore.collection('grids')
                .where('deviceId', '==', deviceId)
                .get();
            
            console.log(`✅ Found ${gridSnapshot.size} grids:`);
            gridSnapshot.forEach(doc => {
                console.log('   ', doc.data());
            });
            
            // Check media boxes
            const mediaBoxSnapshot = await this.firestore.collection('mediaBoxes').get();
            console.log(`✅ Found ${mediaBoxSnapshot.size} media boxes:`);
            mediaBoxSnapshot.forEach(doc => {
                console.log('   ', doc.data());
            });
            
            // Check media items
            const mediaSnapshot = await this.firestore.collection('media').get();
            console.log(`✅ Found ${mediaSnapshot.size} media items:`);
            mediaSnapshot.forEach(doc => {
                console.log('   ', doc.data());
            });
            
        } catch (error) {
            console.error('❌ Error checking test data:', error);
        }
    }
}

// Usage instructions
console.log(`
🎯 CastGrid Test Setup Script
==============================

To use this script:

1. Make sure Firebase is initialized in the web admin dashboard
2. Run: const testSetup = new CastGridTestSetup();
3. Create test data: await testSetup.createTestData();
4. Check data: await testSetup.checkTestData();
5. Clear data: await testSetup.clearTestData();

This will create a complete test environment for your CastGrid system!
`);
