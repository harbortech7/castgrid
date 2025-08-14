package com.example.castgrid.data.repository

import com.example.castgrid.data.firebase.FirebaseConfig
import com.example.castgrid.data.models.Device
import com.example.castgrid.data.models.Grid
import com.example.castgrid.data.models.MediaBox
import com.example.castgrid.data.models.MediaItem
import com.example.castgrid.data.models.MediaType
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/**
 * Firebase implementation of CastGridRepository
 * Handles all data operations with Firestore backend
 */
class FirebaseCastGridRepository : CastGridRepository {

    private val firestore = FirebaseConfig.firestore
    private val storage = FirebaseConfig.storage

    override suspend fun createDevice(device: Device): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
                .document(device.deviceId)
                .set(device.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getDevice(deviceId: String): Device? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
                .document(deviceId)
                .get()
                .await()
            
            if (snapshot.exists()) {
                snapshot.toObject(Device::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun updateDevice(device: Device): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
                .document(device.deviceId)
                .set(device.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteDevice(deviceId: String): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
                .document(deviceId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getAllDevices(): Result<List<Device>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
                .get()
                .await()
            
            val devices = snapshot.documents.mapNotNull { doc ->
                doc.toObject(Device::class.java)
            }
            Result.success(devices)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createGrid(grid: Grid): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
                .document(grid.gridId)
                .set(grid.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getGrid(gridId: String): Grid? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
                .document(gridId)
                .get()
                .await()
            
            if (snapshot.exists()) {
                snapshot.toObject(Grid::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun updateGrid(grid: Grid): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
                .document(grid.gridId)
                .set(grid.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteGrid(gridId: String): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
                .document(gridId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getGridsForDevice(deviceId: String): List<Grid> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
                .whereEqualTo("deviceId", deviceId)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(Grid::class.java)
            }.sortedBy { it.position }
        } catch (e: Exception) {
            emptyList()
        }
    }

    override suspend fun createMediaBox(mediaBox: MediaBox): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBox.mediaBoxId)
                .set(mediaBox.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMediaBox(mediaBoxId: String): MediaBox? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBoxId)
                .get()
                .await()
            
            if (snapshot.exists()) {
                snapshot.toObject(MediaBox::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    override suspend fun updateMediaBox(mediaBox: MediaBox): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBox.mediaBoxId)
                .set(mediaBox.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteMediaBox(mediaBoxId: String): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBoxId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getAllMediaBoxes(): Result<List<MediaBox>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .get()
                .await()
            
            val mediaBoxes = snapshot.documents.mapNotNull { doc ->
                doc.toObject(MediaBox::class.java)
            }
            Result.success(mediaBoxes)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun createMediaItem(mediaItem: MediaItem): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                .document(mediaItem.mediaId)
                .set(mediaItem.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMediaItem(mediaId: String): MediaItem? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                .document(mediaId)
                .get()
                .await()
            
            if (snapshot.exists()) {
                snapshot.toObject(MediaItem::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun updateMediaItem(mediaItem: MediaItem): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                .document(mediaItem.mediaId)
                .set(mediaItem.toMap())
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteMediaItem(mediaId: String): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                .document(mediaId)
                .delete()
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun getMediaItemsForBox(mediaBoxId: String): Result<List<MediaItem>> {
        return try {
            val mediaBox = getMediaBox(mediaBoxId)
            if (mediaBox != null && mediaBox.mediaItems.isNotEmpty()) {
                val snapshot = firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                    .whereIn("mediaId", mediaBox.mediaItems)
                    .get()
                    .await()
                
                val mediaItems = snapshot.documents.mapNotNull { doc ->
                    doc.toObject(MediaItem::class.java)
                }
                
                Result.success(getSortedMediaItems(mediaItems))
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun addMediaToBox(mediaBoxId: String, mediaId: String): Result<Unit> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBoxId)
                .get()
                .await()
            
            val mediaBox = snapshot.toObject(MediaBox::class.java)
            if (mediaBox != null) {
                val updatedMediaItems = mediaBox.mediaItems.toMutableList()
                if (!updatedMediaItems.contains(mediaId)) {
                    updatedMediaItems.add(mediaId)
                    
                    firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                        .document(mediaBoxId)
                        .update("mediaItems", updatedMediaItems)
                        .await()
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun removeMediaFromBox(mediaBoxId: String, mediaId: String): Result<Unit> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                .document(mediaBoxId)
                .get()
                .await()
            
            val mediaBox = snapshot.toObject(MediaBox::class.java)
            if (mediaBox != null) {
                val updatedMediaItems = mediaBox.mediaItems.toMutableList()
                updatedMediaItems.remove(mediaId)
                
                firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
                    .document(mediaBoxId)
                    .update("mediaItems", updatedMediaItems)
                    .await()
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Real-time data streams for live updates
    override fun observeDevice(deviceId: String): Flow<Device?> = callbackFlow {
        val listener = firestore.collection(FirebaseConfig.DEVICES_COLLECTION)
            .document(deviceId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                
                val device = snapshot?.toObject(Device::class.java)
                trySend(device)
            }
        
        awaitClose { listener.remove() }
    }
    
    override fun observeGridsForDevice(deviceId: String): Flow<List<Grid>> = callbackFlow {
        val listener = firestore.collection(FirebaseConfig.GRIDS_COLLECTION)
            .whereEqualTo("deviceId", deviceId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                
                val grids = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Grid::class.java)
                }?.sortedBy { it.position } ?: emptyList()
                
                trySend(grids)
            }
        
        awaitClose { listener.remove() }
    }
    
    override fun observeMediaBox(mediaBoxId: String): Flow<MediaBox?> = callbackFlow {
        val listener = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
            .document(mediaBoxId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                
                val mediaBox = snapshot?.toObject(MediaBox::class.java)
                trySend(mediaBox)
            }
        
        awaitClose { listener.remove() }
    }
    
    override fun observeMediaItemsForBox(mediaBoxId: String): Flow<List<MediaItem>> = callbackFlow {
        val listener = firestore.collection(FirebaseConfig.MEDIA_BOXES_COLLECTION)
            .document(mediaBoxId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                
                val mediaBox = snapshot?.toObject(MediaBox::class.java)
                if (mediaBox != null && mediaBox.mediaItems.isNotEmpty()) {
                    // Get all media items for this box
                    firestore.collection(FirebaseConfig.MEDIA_ITEMS_COLLECTION)
                        .whereIn("mediaId", mediaBox.mediaItems)
                        .get()
                        .addOnSuccessListener { itemsSnapshot ->
                            val mediaItems = itemsSnapshot.documents.mapNotNull { doc ->
                                doc.toObject(MediaItem::class.java)
                            }
                            trySend(getSortedMediaItems(mediaItems))
                        }
                        .addOnFailureListener { exception ->
                            close(exception)
                        }
                } else {
                    trySend(emptyList())
                }
            }
        
        awaitClose { listener.remove() }
    }
    
    /**
     * Sort media items alphabetically as per project requirements
     */
    override fun getSortedMediaItems(mediaItems: List<MediaItem>): List<MediaItem> {
        return mediaItems.sortedBy { it.filename }
    }
} 