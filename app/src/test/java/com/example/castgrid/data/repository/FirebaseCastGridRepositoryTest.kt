package com.example.castgrid.data.repository

import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaBox
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.data.models.MediaType
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for CastGridRepository
 * Tests core data operations and business logic using mock implementation
 */
class FirebaseCastGridRepositoryTest {
    
    private lateinit var repository: CastGridRepository
    
    @Before
    fun setup() {
        // Use mock repository to avoid Firebase dependencies in tests
        repository = MockCastGridRepository()
    }
    
    @Test
    fun `test media item alphabetical sorting`() {
        // Create test media items with mixed order
        val mediaItems = listOf(
            MediaItem(
                mediaId = "1",
                filename = "C_image.jpg",
                type = MediaType.IMAGE
            ),
            MediaItem(
                mediaId = "2",
                filename = "A_video.mp4",
                type = MediaType.VIDEO
            ),
            MediaItem(
                mediaId = "3",
                filename = "B_image.jpg",
                type = MediaType.IMAGE
            )
        )
        
        // Test sorting
        val sorted = repository.getSortedMediaItems(mediaItems)
        
        // Should be sorted alphabetically by filename
        assertEquals("A_video.mp4", sorted[0].filename)
        assertEquals("B_image.jpg", sorted[1].filename)
        assertEquals("C_image.jpg", sorted[2].filename)
    }
    
    @Test
    fun `test grid position validation`() {
        // Test valid positions
        assertTrue(Grid.isValidPosition(1))
        assertTrue(Grid.isValidPosition(4))
        assertTrue(Grid.isValidPosition(8))
        
        // Test invalid positions
        assertFalse(Grid.isValidPosition(0))
        assertFalse(Grid.isValidPosition(9))
        assertFalse(Grid.isValidPosition(-1))
    }
    
    @Test
    fun `test media type detection from filename`() {
        // Test video extensions
        assertEquals(MediaType.VIDEO, MediaType.fromFileExtension("mp4"))
        assertEquals(MediaType.VIDEO, MediaType.fromFileExtension("avi"))
        assertEquals(MediaType.VIDEO, MediaType.fromFileExtension("MOV"))
        
        // Test image extensions
        assertEquals(MediaType.IMAGE, MediaType.fromFileExtension("jpg"))
        assertEquals(MediaType.IMAGE, MediaType.fromFileExtension("PNG"))
        assertEquals(MediaType.IMAGE, MediaType.fromFileExtension("gif"))
        
        // Test unknown extension (should default to image)
        assertEquals(MediaType.IMAGE, MediaType.fromFileExtension("unknown"))
    }
    
    @Test
    fun `test device model serialization`() {
        val device = Device(
            deviceId = "test_device",
            location = "Test Location",
            grids = listOf("grid1", "grid2")
        )
        
        val map = device.toMap()
        
        assertEquals("test_device", map["deviceId"])
        assertEquals("Test Location", map["location"])
        assertEquals(listOf("grid1", "grid2"), map["grids"])
    }
    
    @Test
    fun `test media box has media items`() {
        val emptyBox = MediaBox(
            mediaBoxId = "empty",
            name = "Empty Box",
            mediaItems = emptyList()
        )
        
        val filledBox = MediaBox(
            mediaBoxId = "filled",
            name = "Filled Box",
            mediaItems = listOf("media1", "media2")
        )
        
        assertFalse(emptyBox.hasMediaItems())
        assertTrue(filledBox.hasMediaItems())
        assertEquals(0, emptyBox.getMediaItemCount())
        assertEquals(2, filledBox.getMediaItemCount())
    }
    
    @Test
    fun `test media item type detection`() {
        val videoItem = MediaItem(
            mediaId = "video",
            type = MediaType.VIDEO,
            filename = "test.mp4"
        )
        
        val imageItem = MediaItem(
            mediaId = "image",
            type = MediaType.IMAGE,
            filename = "test.jpg"
        )
        
        assertTrue(videoItem.isVideo())
        assertFalse(videoItem.isImage())
        assertTrue(imageItem.isImage())
        assertFalse(imageItem.isVideo())
    }
} 