package com.example.castgrid.data.repository

import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaBox
import com.example.castgrid.data.models.MediaItem
import kotlinx.coroutines.flow.Flow

/**
 * Main repository interface for CastGrid data operations
 * Provides access to all data sources as defined in ProjectPlan.md API endpoints
 */
interface CastGridRepository {
    
    // Device operations
    suspend fun createDevice(device: Device): Result<Unit>
    suspend fun getDevice(deviceId: String): Device?
    suspend fun updateDevice(device: Device): Result<Unit>
    suspend fun deleteDevice(deviceId: String): Result<Unit>
    suspend fun getAllDevices(): Result<List<Device>>
    
    // Grid operations  
    suspend fun createGrid(grid: Grid): Result<Unit>
    suspend fun getGrid(gridId: String): Grid?
    suspend fun updateGrid(grid: Grid): Result<Unit>
    suspend fun deleteGrid(gridId: String): Result<Unit>
    suspend fun getGridsForDevice(deviceId: String): List<Grid>
    
    // MediaBox operations
    suspend fun createMediaBox(mediaBox: MediaBox): Result<Unit>
    suspend fun getMediaBox(mediaBoxId: String): MediaBox?
    suspend fun updateMediaBox(mediaBox: MediaBox): Result<Unit>
    suspend fun deleteMediaBox(mediaBoxId: String): Result<Unit>
    suspend fun getAllMediaBoxes(): Result<List<MediaBox>>
    
    // MediaItem operations
    suspend fun createMediaItem(mediaItem: MediaItem): Result<Unit>
    suspend fun getMediaItem(mediaId: String): MediaItem?
    suspend fun updateMediaItem(mediaItem: MediaItem): Result<Unit>
    suspend fun deleteMediaItem(mediaId: String): Result<Unit>
    suspend fun getMediaItemsForBox(mediaBoxId: String): Result<List<MediaItem>>
    suspend fun addMediaToBox(mediaBoxId: String, mediaId: String): Result<Unit>
    suspend fun removeMediaFromBox(mediaBoxId: String, mediaId: String): Result<Unit>
    
    // Real-time data streams for live updates
    fun observeDevice(deviceId: String): Flow<Device?>
    fun observeGridsForDevice(deviceId: String): Flow<List<Grid>>
    fun observeMediaBox(mediaBoxId: String): Flow<MediaBox?>
    fun observeMediaItemsForBox(mediaBoxId: String): Flow<List<MediaItem>>
    
    // Utility functions for playback logic
    fun getSortedMediaItems(mediaItems: List<MediaItem>): List<MediaItem>

    // Media file management for offline playback
    suspend fun downloadMediaFile(mediaItem: MediaItem): Result<String> // Returns local file path
    suspend fun getLocalMediaPath(mediaItem: MediaItem): String?
    suspend fun isMediaFileLocal(mediaItem: MediaItem): Boolean
    suspend fun cleanupOldMediaFiles()
    suspend fun getLocalStorageSize(): Long
    suspend fun getAvailableStorageSpace(): Long
} 