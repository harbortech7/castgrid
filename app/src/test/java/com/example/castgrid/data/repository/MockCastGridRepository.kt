package com.example.castgrid.data.repository

import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaBox
import com.example.castgrid.data.models.MediaItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

/**
 * Mock implementation of CastGridRepository for testing
 * Returns empty/null results to allow unit testing without Firebase
 */
class MockCastGridRepository : CastGridRepository {
    
    // Device operations
    override suspend fun createDevice(device: Device): Result<Unit> = Result.success(Unit)
    override suspend fun getDevice(deviceId: String): Device? = null
    override suspend fun updateDevice(device: Device): Result<Unit> = Result.success(Unit)
    override suspend fun deleteDevice(deviceId: String): Result<Unit> = Result.success(Unit)
    override suspend fun getAllDevices(): Result<List<Device>> = Result.success(emptyList())
    
    // Grid operations
    override suspend fun createGrid(grid: Grid): Result<Unit> = Result.success(Unit)
    override suspend fun getGrid(gridId: String): Grid? = null
    override suspend fun updateGrid(grid: Grid): Result<Unit> = Result.success(Unit)
    override suspend fun deleteGrid(gridId: String): Result<Unit> = Result.success(Unit)
    override suspend fun getGridsForDevice(deviceId: String): List<Grid> = emptyList()
    
    // MediaBox operations
    override suspend fun createMediaBox(mediaBox: MediaBox): Result<Unit> = Result.success(Unit)
    override suspend fun getMediaBox(mediaBoxId: String): MediaBox? = null
    override suspend fun updateMediaBox(mediaBox: MediaBox): Result<Unit> = Result.success(Unit)
    override suspend fun deleteMediaBox(mediaBoxId: String): Result<Unit> = Result.success(Unit)
    override suspend fun getAllMediaBoxes(): Result<List<MediaBox>> = Result.success(emptyList())
    
    // MediaItem operations
    override suspend fun createMediaItem(mediaItem: MediaItem): Result<Unit> = Result.success(Unit)
    override suspend fun getMediaItem(mediaId: String): MediaItem? = null
    override suspend fun updateMediaItem(mediaItem: MediaItem): Result<Unit> = Result.success(Unit)
    override suspend fun deleteMediaItem(mediaId: String): Result<Unit> = Result.success(Unit)
    override suspend fun getMediaItemsForBox(mediaBoxId: String): Result<List<MediaItem>> = Result.success(emptyList())
    override suspend fun addMediaToBox(mediaBoxId: String, mediaId: String): Result<Unit> = Result.success(Unit)
    override suspend fun removeMediaFromBox(mediaBoxId: String, mediaId: String): Result<Unit> = Result.success(Unit)
    
    // Real-time observation methods (return empty flows)
    override fun observeDevice(deviceId: String): Flow<Device?> = flowOf(null)
    override fun observeGridsForDevice(deviceId: String): Flow<List<Grid>> = flowOf(emptyList())
    override fun observeMediaBox(mediaBoxId: String): Flow<MediaBox?> = flowOf(null)
    override fun observeMediaItemsForBox(mediaBoxId: String): Flow<List<MediaItem>> = flowOf(emptyList())
    
    // Utility functions
    override fun getSortedMediaItems(mediaItems: List<MediaItem>): List<MediaItem> {
        return mediaItems.sortedBy { it.filename }
    }
} 