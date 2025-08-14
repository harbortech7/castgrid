package com.example.castgrid.util

import java.util.*

/**
 * Utility for generating unique device identifiers for CastGrid TVs
 * 
 * This ensures each TV device has a globally unique identifier that won't
 * conflict with other devices in the same Firebase project.
 */
object UniqueDeviceIdGenerator {
    
    /**
     * Generate a completely unique device ID
     * Format: tv_[8-char-uuid]_[4-digit-timestamp]
     * 
     * Example output: "tv_a7f3k9m2_2024", "tv_b8g4l1n6_2024"
     */
    fun generateUniqueId(): String {
        val randomPart = UUID.randomUUID().toString().replace("-", "").take(8)
        val timestampPart = System.currentTimeMillis().toString().takeLast(4)
        return "tv_${randomPart}_$timestampPart"
    }
    
    /**
     * Generate multiple unique device IDs at once
     * Useful when setting up multiple TV devices
     */
    fun generateMultipleIds(count: Int): List<String> {
        return (1..count).map { 
            Thread.sleep(1) // Ensure different timestamps
            generateUniqueId() 
        }
    }
    
    /**
     * Generate a location-based unique device ID
     * Format: tv_[location]_[8-char-uuid]_[timestamp]
     */
    fun generateLocationBasedId(location: String): String {
        val cleanLocation = location.lowercase()
            .replace(" ", "")
            .replace("[^a-z0-9]".toRegex(), "")
            .take(6)
        
        val randomPart = UUID.randomUUID().toString().replace("-", "").take(6)
        val timestampPart = System.currentTimeMillis().toString().takeLast(4)
        
        return "tv_${cleanLocation}_${randomPart}_$timestampPart"
    }
    
    /**
     * Validate if a device ID follows the expected format
     */
    fun isValidDeviceId(deviceId: String): Boolean {
        return deviceId.matches(Regex("^tv_[a-zA-Z0-9]+_[0-9]{4}$"))
    }
    
    /**
     * Extract location from location-based device ID
     */
    fun extractLocationFromId(deviceId: String): String? {
        val parts = deviceId.split("_")
        return if (parts.size >= 4 && parts[0] == "tv") {
            parts[1]
        } else null
    }
    
    /**
     * Pre-generated unique device IDs for quick setup
     * Use these if you need to set up devices quickly
     */
    val preGeneratedIds = listOf(
        "tv_a7f3k9m2_2024",  // Currently used in FirebaseConfig
        "tv_b8g4l1n6_2024",
        "tv_c9h5m2o7_2024", 
        "tv_d1j6n3p8_2024",
        "tv_e2k7q4r9_2024",
        "tv_f3l8s5t1_2024",
        "tv_g4m9u6v2_2024",
        "tv_h5n1w7x3_2024",
        "tv_i6o2y8z4_2024",
        "tv_j7p3a9b5_2024"
    )
    
    /**
     * Get the next available pre-generated ID
     * Useful when you want to use pre-generated IDs in sequence
     */
    fun getNextPreGeneratedId(usedIds: Set<String>): String? {
        return preGeneratedIds.firstOrNull { it !in usedIds }
    }
    
    /**
     * Print instructions for using a new device ID
     */
    fun printSetupInstructions(deviceId: String, location: String? = null) {
        println("=".repeat(60))
        println("🆔 NEW DEVICE ID GENERATED")
        println("=".repeat(60))
        println("Device ID: $deviceId")
        if (location != null) {
            println("Location: $location")
        }
        println()
        println("📝 SETUP INSTRUCTIONS:")
        println("1. Open: app/src/main/java/com/example/castgrid/data/firebase/FirebaseConfig.kt")
        println("2. Replace the DEVICE_ID constant:")
        println("   const val DEVICE_ID = \"$deviceId\"")
        println()
        println("3. Add this device to your web admin dashboard:")
        println("   - Device ID: $deviceId")
        if (location != null) {
            println("   - Location: $location")
        }
        println("   - Grid Count: [Choose 1, 2, 4, or 8]")
        println()
        println("4. Rebuild and deploy your Android app")
        println("=".repeat(60))
    }
} 