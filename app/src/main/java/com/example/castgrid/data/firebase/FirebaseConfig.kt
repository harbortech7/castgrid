package com.example.castgrid.data.firebase

import com.google.firebase.Firebase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.firestore
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.storage

/**
 * Firebase configuration and service initialization
 * Provides singleton access to Firebase services
 */
object FirebaseConfig {
    
    // Collections
    const val DEVICES_COLLECTION = "devices"
    const val GRIDS_COLLECTION = "grids"
    const val MEDIA_BOXES_COLLECTION = "media-boxes"
    const val MEDIA_ITEMS_COLLECTION = "media-items"
    
    // 📺 Device Configuration - UNIQUE HARDCODED ID
    // This ID is generated using UUID to ensure uniqueness across all devices
    // Format: tv_[unique-8-char-code]_[timestamp-based-suffix]
    const val DEVICE_ID = "tv_a7f3k9m2_2024" // UNIQUE - Replace for each device installation
    
    /**
     * Generate a new unique device ID for different device installations
     * Call this method to get a new unique ID when setting up a new TV device
     * 
     * Example usage:
     * val newDeviceId = FirebaseConfig.generateUniqueDeviceId()
     * println("New device ID: $newDeviceId") 
     * // Then hardcode this ID above for each device
     */
    fun generateUniqueDeviceId(): String {
        val randomPart = java.util.UUID.randomUUID().toString().replace("-", "").take(8)
        val timestampPart = System.currentTimeMillis().toString().takeLast(4)
        return "tv_${randomPart}_$timestampPart"
    }
    
    // Lazy initialization to avoid creating instances before Firebase is initialized
    val firestore: FirebaseFirestore by lazy {
        FirebaseFirestore.getInstance().apply {
            // Enable offline persistence for better performance
            firestoreSettings = FirebaseFirestoreSettings.Builder()
                .setPersistenceEnabled(true)
                .build()
        }
    }
    
    val storage: FirebaseStorage by lazy {
        FirebaseStorage.getInstance()
    }
    
    fun initialize() {
        // Initialize Firebase services
        firestore
        storage
    }
} 