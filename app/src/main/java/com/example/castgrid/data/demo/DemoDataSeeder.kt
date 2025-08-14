package com.example.castgrid.data.demo

import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaBox
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.data.models.MediaType
import com.example.castgrid.data.repository.CastGridRepository

/**
 * Helper class to seed the database with demo data for testing
 * Provides sample devices, media items, media boxes, and grid configurations
 */
class DemoDataSeeder(
    private val repository: CastGridRepository
) {
    
    /**
     * Seed the database with demo data
     */
    suspend fun seedDemoData() {
        try {
            // Create device
            val device = Device(
                deviceId = "tv_001",
                location = "Demo Lobby",
                grids = listOf("grid_1", "grid_2")
            )
            repository.createDevice(device)
            
            // Create media items  
            val mediaItems = createDemoMediaItems()
            mediaItems.forEach { mediaItem ->
                repository.createMediaItem(mediaItem)
            }
            
            // Create media box
            val mediaBox = createDemoMediaBox(mediaItems.map { it.mediaId })
            repository.createMediaBox(mediaBox)
            
            // Create grids
            val grids = listOf(
                Grid(
                    gridId = "grid_1",
                    deviceId = "tv_001", 
                    position = 1,
                    mediaBoxId = "demo_box_1"
                ),
                Grid(
                    gridId = "grid_2",
                    deviceId = "tv_001",
                    position = 2,
                    mediaBoxId = "demo_box_1"
                )
            )
            
            grids.forEach { grid ->
                repository.createGrid(grid)
            }
            
            println("✅ Demo data seeded successfully!")
            
        } catch (e: Exception) {
            println("❌ Error seeding demo data: ${e.message}")
        }
    }
    
    /**
     * Create demo media items for testing
     */
    private fun createDemoMediaItems(): List<MediaItem> {
        return listOf(
            MediaItem(
                mediaId = "demo_media_1",
                type = MediaType.VIDEO,
                filename = "A_welcome_video.mp4",
                url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                duration = 30
            ),
            MediaItem(
                mediaId = "demo_media_2",
                type = MediaType.IMAGE,
                filename = "B_menu_image.jpg", 
                url = "https://picsum.photos/1920/1080?random=1",
                duration = 5
            ),
            MediaItem(
                mediaId = "demo_media_3",
                type = MediaType.IMAGE,
                filename = "C_promotion_banner.png",
                url = "https://picsum.photos/1920/1080?random=2", 
                duration = 8
            )
        )
    }
    
    /**
     * Create demo media box
     */
    private fun createDemoMediaBox(mediaItemIds: List<String>): MediaBox {
        return MediaBox(
            mediaBoxId = "demo_box_1",
            name = "Demo Content Box",
            mediaItems = mediaItemIds
        )
    }
} 