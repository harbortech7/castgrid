package com.example.castgrid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.ui.viewmodel.CastGridViewModel

/**
 * Main grid layout composable that displays up to 8 grid zones
 * Supports flexible grid arrangements as specified in ProjectPlan.md
 */
@Composable
fun GridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    
    if (uiState.isLoading) {
        LoadingIndicator(modifier = modifier)
        return
    }
    
    if (uiState.error != null) {
        ErrorDisplay(
            error = uiState.error!!,
            onRetry = { viewModel.refresh() },
            modifier = modifier
        )
        return
    }
    
    val grids = uiState.grids
    val maxPosition = grids.maxOfOrNull { it.position } ?: 1
    
    when {
        maxPosition <= 1 -> SingleGridLayout(viewModel, modifier)
        maxPosition <= 2 -> TwoGridLayout(viewModel, modifier)
        maxPosition <= 3 -> ThreeGridLayout(viewModel, modifier)
        maxPosition <= 4 -> FourGridLayout(viewModel, modifier)
        maxPosition <= 6 -> SixGridLayout(viewModel, modifier)
        else -> EightGridLayout(viewModel, modifier)
    }
}

/**
 * Single grid layout (1 zone)
 */
@Composable
private fun SingleGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        GridZone(
            position = 1,
            viewModel = viewModel,
            modifier = Modifier.fillMaxSize()
        )
    }
}

/**
 * Two grid layout (2 zones, side by side)
 */
@Composable
private fun TwoGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxSize(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        GridZone(
            position = 1,
            viewModel = viewModel,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
        )
        GridZone(
            position = 2,
            viewModel = viewModel,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
        )
    }
}

/**
 * Three grid layout (3 zones, horizontal)
 */
@Composable
private fun ThreeGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxSize(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        GridZone(
            position = 1,
            viewModel = viewModel,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
        )
        GridZone(
            position = 2,
            viewModel = viewModel,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
        )
        GridZone(
            position = 3,
            viewModel = viewModel,
            modifier = Modifier
                .weight(1f)
                .fillMaxSize()
        )
    }
}

/**
 * Four grid layout (2x2 grid)
 */
@Composable
private fun FourGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceEvenly
    ) {
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            GridZone(
                position = 1,
                viewModel = viewModel,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
            )
            GridZone(
                position = 2,
                viewModel = viewModel,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
            )
        }
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            GridZone(
                position = 3,
                viewModel = viewModel,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
            )
            GridZone(
                position = 4,
                viewModel = viewModel,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
            )
        }
    }
}

/**
 * Six grid layout (2x3 grid)
 */
@Composable
private fun SixGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceEvenly
    ) {
        // Top row (positions 1-3)
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            for (position in 1..3) {
                GridZone(
                    position = position,
                    viewModel = viewModel,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize()
                )
            }
        }
        // Bottom row (positions 4-6)
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            for (position in 4..6) {
                GridZone(
                    position = position,
                    viewModel = viewModel,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize()
                )
            }
        }
    }
}

/**
 * Eight grid layout (2x4 grid)
 */
@Composable
private fun EightGridLayout(
    viewModel: CastGridViewModel,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.SpaceEvenly
    ) {
        // Top row (positions 1-4)
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            for (position in 1..4) {
                GridZone(
                    position = position,
                    viewModel = viewModel,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize()
                )
            }
        }
        // Bottom row (positions 5-8)
        Row(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            for (position in 5..8) {
                GridZone(
                    position = position,
                    viewModel = viewModel,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxSize()
                )
            }
        }
    }
}

/**
 * Loading indicator
 */
@Composable
private fun LoadingIndicator(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "Loading CastGrid...",
            color = Color.White,
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Error display
 */
@Composable
private fun ErrorDisplay(
    error: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Red.copy(alpha = 0.8f)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Error: $error",
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(16.dp)
            )
            Text(
                text = "Retrying in 10 seconds...",
                color = Color.White,
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center
            )
        }
    }
} 