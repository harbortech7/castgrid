package com.example.castgrid.ui.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.castgrid.data.demo.DemoDataSeeder
import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.data.repository.CastGridRepository
import com.example.castgrid.data.firebase.FirebaseConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

/**
 * Main ViewModel for CastGrid application
 * Handles grid layout, media playback logic, and device management
 */
class CastGridViewModel(
    private val repository: CastGridRepository,
    private val context: Context // Add context to get device ID
) : ViewModel() {

    private val _uiState = MutableStateFlow(CastGridUiState())
    val uiState: StateFlow<CastGridUiState> = _uiState.asStateFlow()

    init {
        // Get device ID for this TV
        val currentDeviceId = FirebaseConfig.DEVICE_ID
        // Alternative: Use dynamic device ID
        // val currentDeviceId = DeviceIdManager.getDeviceId(context)
        
        loadDeviceData(currentDeviceId)
        
        // Load demo data if needed (for testing)
        seedDemoDataIfEmpty()
    }

    /**
     * Seed demo data for testing purposes
     */
    private fun seedDemoDataIfEmpty() {
        viewModelScope.launch {
            try {
                // Check if we have any devices
                val devicesResult = repository.getAllDevices()
                if (devicesResult.isSuccess && devicesResult.getOrNull()?.isEmpty() == true) {
                    // No devices found, seed demo data
                    val seeder = DemoDataSeeder(repository)
                    seeder.seedDemoData()
                }
            } catch (e: Exception) {
                // Ignore seeding errors for now
                handleError(e)
            }
        }
    }
    
    /**
     * Load data for the current device
     */
    private fun loadDeviceData(deviceId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null)
                
                // Load device information
                val device = repository.getDevice(deviceId)
                
                if (device != null) {
                    // Load grids for this device
                    val grids = repository.getGridsForDevice(deviceId)
                    
                    // Create playback states for each grid
                    val gridPlaybackStates = grids.map { grid ->
                        GridPlaybackState(
                            gridId = grid.gridId,
                            position = grid.position,
                            currentMediaItems = emptyList(),
                            currentIndex = 0,
                            isPlaying = false
                        )
                    }
                    
                    _uiState.value = _uiState.value.copy(
                        currentDevice = device,
                        grids = grids,
                        gridPlaybackStates = gridPlaybackStates,
                        isLoading = false
                    )
                    
                    // Load media content for each grid
                    loadMediaForGrids(grids)
                    
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Device '$deviceId' not found. Please configure this device in the admin dashboard."
                    )
                }
                
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to load device data: ${e.message}"
                )
            }
        }
    }
    
    /**
     * Load media items for all grids
     */
    private suspend fun loadMediaForGrids(grids: List<Grid>) {
        val gridMediaMap = mutableMapOf<Int, List<MediaItem>>()
        
        grids.forEach { grid ->
            if (grid.mediaBoxId.isNotEmpty()) {
                val mediaItemsResult = repository.getMediaItemsForBox(grid.mediaBoxId)
                if (mediaItemsResult.isSuccess) {
                    val mediaItems = mediaItemsResult.getOrNull() ?: emptyList()
                    gridMediaMap[grid.position] = mediaItems
                }
            }
        }
        
        _uiState.value = _uiState.value.copy(
            gridMediaItems = gridMediaMap
        )
    }
    
    /**
     * Get media items for a specific grid position
     */
    fun getMediaItemsForPosition(position: Int): List<MediaItem> {
        return _uiState.value.gridMediaItems[position] ?: emptyList()
    }
    
    /**
     * Get the current media item for a grid position based on playback state
     */
    fun getCurrentMediaItemForPosition(position: Int): MediaItem? {
        val mediaItems = getMediaItemsForPosition(position)
        if (mediaItems.isEmpty()) return null
        
        val playbackState = _uiState.value.playbackStates[position] ?: GridPlaybackState()
        val currentIndex = playbackState.currentMediaIndex
        
        return if (currentIndex < mediaItems.size) {
            mediaItems[currentIndex]
        } else {
            mediaItems.firstOrNull()
        }
    }
    
    /**
     * Advance to next media item in a grid position
     */
    fun advanceToNextMedia(position: Int) {
        val mediaItems = getMediaItemsForPosition(position)
        if (mediaItems.isEmpty()) return
        
        val currentPlaybackState = _uiState.value.playbackStates[position] ?: GridPlaybackState()
        val nextIndex = (currentPlaybackState.currentMediaIndex + 1) % mediaItems.size
        
        val updatedPlaybackStates = _uiState.value.playbackStates.toMutableMap()
        updatedPlaybackStates[position] = currentPlaybackState.copy(
            currentMediaIndex = nextIndex,
            isPlaying = true
        )
        
        _uiState.value = _uiState.value.copy(
            playbackStates = updatedPlaybackStates
        )
    }
    
    /**
     * Update playback state for a specific grid position
     */
    fun updatePlaybackState(position: Int, isPlaying: Boolean) {
        val currentState = _uiState.value.playbackStates[position] ?: GridPlaybackState()
        val updatedPlaybackStates = _uiState.value.playbackStates.toMutableMap()
        updatedPlaybackStates[position] = currentState.copy(isPlaying = isPlaying)
        
        _uiState.value = _uiState.value.copy(
            playbackStates = updatedPlaybackStates
        )
    }
    
    /**
     * Handle media playback completion for a grid position
     */
    fun onMediaPlaybackCompleted(position: Int) {
        val mediaItems = getMediaItemsForPosition(position)
        if (mediaItems.isNotEmpty()) {
            // Auto advance to next media item
            advanceToNextMedia(position)
        }
    }
    
    /**
     * Refresh data from repository
     */
    fun refresh() {
        val currentDeviceId = FirebaseConfig.DEVICE_ID
        // Alternative: Use dynamic device ID
        // val currentDeviceId = DeviceIdManager.getDeviceId(context)
        
        loadDeviceData(currentDeviceId)
    }
    
    /**
     * Handle errors
     */
    private fun handleError(error: Throwable) {
        _uiState.value = _uiState.value.copy(
            isLoading = false,
            error = error.message
        )
    }
}

/**
 * UI State for CastGrid application
 */
data class CastGridUiState(
    val currentDevice: Device? = null,
    val grids: List<Grid> = emptyList(),
    val gridPlaybackStates: List<GridPlaybackState> = emptyList(),
    val gridMediaItems: Map<Int, List<MediaItem>> = emptyMap(),
    val playbackStates: Map<Int, GridPlaybackState> = emptyMap(),
    val isLoading: Boolean = true,
    val error: String? = null
)

/**
 * Playback state for each grid position
 */
data class GridPlaybackState(
    val gridId: String = "",
    val position: Int = 0,
    val currentMediaItems: List<MediaItem> = emptyList(),
    val currentIndex: Int = 0,
    val isPlaying: Boolean = false,
    val currentMediaIndex: Int = 0,
    val playbackPosition: Long = 0L
) 