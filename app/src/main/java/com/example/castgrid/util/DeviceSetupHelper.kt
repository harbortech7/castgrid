package com.example.castgrid.util

import android.util.Log

/**
 * Helper class for setting up new CastGrid devices
 * Use this during development to generate unique device IDs
 */
object DeviceSetupHelper {
    
    private const val TAG = "DeviceSetupHelper"
    
    /**
     * Generate and log instructions for a new device setup
     * Call this method during development to get setup instructions
     */
    fun generateNewDeviceSetup(location: String = "Unknown"): String {
        val deviceId = UniqueDeviceIdGenerator.generateUniqueId()
        
        val instructions = """
            
            🆔 NEW UNIQUE DEVICE ID GENERATED
            ════════════════════════════════════════
            Device ID: $deviceId
            Location: $location
            Generated: ${java.util.Date()}
            
            📝 ANDROID APP SETUP:
            1. Open: FirebaseConfig.kt
            2. Replace DEVICE_ID with: "$deviceId"
            3. Rebuild the app
            
            🌐 WEB ADMIN SETUP:
            1. Open your web admin dashboard
            2. Go to "Device Management"
            3. Click "Add New Device"
            4. Enter:
               - Device ID: $deviceId
               - Location: $location
               - Grid Count: 2 (or your preference)
            5. Save the device
            
            ✅ READY TO USE!
            ════════════════════════════════════════
            
        """.trimIndent()
        
        Log.d(TAG, instructions)
        return deviceId
    }
    
    /**
     * Generate multiple device IDs for batch setup
     */
    fun generateMultipleDeviceSetups(locations: List<String>): List<Pair<String, String>> {
        val deviceSetups = mutableListOf<Pair<String, String>>()
        
        Log.d(TAG, "\n🏭 BATCH DEVICE SETUP")
        Log.d(TAG, "════════════════════════════════════════")
        
        locations.forEachIndexed { index, location ->
            val deviceId = UniqueDeviceIdGenerator.generateLocationBasedId(location)
            deviceSetups.add(deviceId to location)
            
            Log.d(TAG, "${index + 1}. $location")
            Log.d(TAG, "   Device ID: $deviceId")
            Log.d(TAG, "   FirebaseConfig: const val DEVICE_ID = \"$deviceId\"")
            Log.d(TAG, "")
        }
        
        Log.d(TAG, "✅ Generated ${deviceSetups.size} unique device IDs")
        Log.d(TAG, "════════════════════════════════════════")
        
        return deviceSetups
    }
    
    /**
     * Validate current device configuration
     */
    fun validateCurrentDeviceId(currentDeviceId: String): Boolean {
        val isValid = UniqueDeviceIdGenerator.isValidDeviceId(currentDeviceId)
        
        if (isValid) {
            Log.d(TAG, "✅ Device ID '$currentDeviceId' is valid")
        } else {
            Log.e(TAG, "❌ Device ID '$currentDeviceId' is invalid!")
            Log.e(TAG, "Expected format: tv_[alphanumeric]_[4digits]")
        }
        
        return isValid
    }
    
    /**
     * Get pre-generated device IDs for quick setup
     */
    fun getPreGeneratedDeviceIds(): List<String> {
        Log.d(TAG, "\n🎯 PRE-GENERATED DEVICE IDs")
        Log.d(TAG, "════════════════════════════════════════")
        
        UniqueDeviceIdGenerator.preGeneratedIds.forEachIndexed { index, deviceId ->
            Log.d(TAG, "${index + 1}. $deviceId")
        }
        
        Log.d(TAG, "════════════════════════════════════════")
        Log.d(TAG, "💡 Use these IDs for quick device setup")
        
        return UniqueDeviceIdGenerator.preGeneratedIds
    }
    
    /**
     * Example usage for common locations
     */
    fun generateCommonLocationDevices(): List<Pair<String, String>> {
        val commonLocations = listOf(
            "Main Lobby",
            "Restaurant", 
            "Conference Room A",
            "Conference Room B",
            "Waiting Area",
            "Reception Desk",
            "Break Room",
            "Kitchen Display"
        )
        
        return generateMultipleDeviceSetups(commonLocations)
    }
} 