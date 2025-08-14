package com.example.castgrid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.data.models.MediaType
import com.example.castgrid.ui.viewmodel.CastGridViewModel
import kotlinx.coroutines.delay

/**
 * Individual grid zone that displays media content
 * Handles both video and image playback with automatic advancement
 */
@Composable
fun GridZone(
    position: Int,
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val mediaItems = viewModel.getMediaItemsForPosition(position)
    val currentMediaItem = viewModel.getCurrentMediaItemForPosition(position)
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .border(1.dp, Color.Gray.copy(alpha = 0.3f))
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        when {
            currentMediaItem == null -> {
                EmptyGridZone(position = position)
            }
            currentMediaItem.isVideo() -> {
                VideoPlayer(
                    mediaItem = currentMediaItem,
                    onPlaybackCompleted = {
                        viewModel.onMediaPlaybackCompleted(position)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
            currentMediaItem.isImage() -> {
                ImagePlayer(
                    mediaItem = currentMediaItem,
                    onDisplayCompleted = {
                        viewModel.onMediaPlaybackCompleted(position)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
        
        // Debug info in bottom corner (remove in production)
        if (currentMediaItem != null) {
            Text(
                text = "Grid $position: ${currentMediaItem.filename}",
                color = Color.White.copy(alpha = 0.7f),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(4.dp)
                    .background(Color.Black.copy(alpha = 0.5f))
                    .padding(4.dp)
            )
        }
    }
}

/**
 * Empty grid zone display
 */
@Composable
private fun EmptyGridZone(position: Int) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Gray.copy(alpha = 0.2f)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "Grid $position\nNo Media",
            color = Color.Gray,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Video player component using ExoPlayer
 */
@Composable
private fun VideoPlayer(
    mediaItem: MediaItem,
    onPlaybackCompleted: () -> Unit,
    modifier: Modifier = Modifier
) {
    // For now, show a placeholder since ExoPlayer setup requires more complex implementation
    // This would be replaced with actual ExoPlayer integration
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.DarkGray),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "🎥 VIDEO\n${mediaItem.filename}\n${mediaItem.duration}s",
            color = Color.White,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
    }
    
    // Auto-advance after video duration
    LaunchedEffect(mediaItem.mediaId) {
        delay((mediaItem.duration * 1000).toLong())
        onPlaybackCompleted()
    }
}

/**
 * Image player component with slideshow functionality
 */
@Composable
private fun ImagePlayer(
    mediaItem: MediaItem,
    onDisplayCompleted: () -> Unit,
    modifier: Modifier = Modifier
) {
    var imageLoaded by remember(mediaItem.mediaId) { mutableStateOf(false) }
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        // AsyncImage for actual image loading (using Coil)
        AsyncImageWithPlaceholder(
            imageUrl = mediaItem.url,
            contentDescription = mediaItem.filename,
            onImageLoaded = { imageLoaded = true },
            modifier = Modifier.fillMaxSize()
        )
    }
    
    // Auto-advance after image duration
    LaunchedEffect(mediaItem.mediaId) {
        delay((mediaItem.duration * 1000).toLong())
        onDisplayCompleted()
    }
}

/**
 * Async image component with placeholder
 */
@Composable
private fun AsyncImageWithPlaceholder(
    imageUrl: String,
    contentDescription: String,
    onImageLoaded: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    // For now, show a placeholder since Coil integration requires more setup
    // This would be replaced with actual Coil AsyncImage
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Blue.copy(alpha = 0.3f)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "🖼️ IMAGE\n$contentDescription\nURL: ${imageUrl.take(30)}...",
            color = Color.White,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )
    }
    
    // Simulate image loading
    LaunchedEffect(imageUrl) {
        delay(500) // Simulate loading time
        onImageLoaded()
    }
} 