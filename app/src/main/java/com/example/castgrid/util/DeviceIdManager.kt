package com.example.castgrid.util

import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings
import java.util.*

/**
 * Manages device identification for CastGrid
 * 
 * This class provides multiple ways to identify the TV device:
 * 1. Manual configuration via SharedPreferences
 * 2. Auto-generated based on Android ID
 * 3. Custom naming scheme
 */
object DeviceIdManager {
    
    private const val PREFS_NAME = "castgrid_device_config"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_DEVICE_LOCATION = "device_location"
    
    /**
     * Get the device ID for this TV
     * Priority: Manual config > Auto-generated > Default
     */
    fun getDeviceId(context: Context): String {
        val prefs = getPreferences(context)
        
        // Check if manually configured
        val manualId = prefs.getString(KEY_DEVICE_ID, null)
        if (!manualId.isNullOrBlank()) {
            return manualId
        }
        
        // Auto-generate based on Android ID
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        val generatedId = "tv_${androidId.take(8)}"
        
        // Save for future use
        setDeviceId(context, generatedId)
        
        return generatedId
    }
    
    /**
     * Manually set device ID (useful for setup)
     */
    fun setDeviceId(context: Context, deviceId: String) {
        getPreferences(context)
            .edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .apply()
    }
    
    /**
     * Get device location/description
     */
    fun getDeviceLocation(context: Context): String? {
        return getPreferences(context).getString(KEY_DEVICE_LOCATION, null)
    }
    
    /**
     * Set device location/description
     */
    fun setDeviceLocation(context: Context, location: String) {
        getPreferences(context)
            .edit()
            .putString(KEY_DEVICE_LOCATION, location)
            .apply()
    }
    
    /**
     * Check if device is configured
     */
    fun isConfigured(context: Context): Boolean {
        val deviceId = getDeviceId(context)
        return deviceId.isNotBlank()
    }
    
    /**
     * Clear device configuration (for reset)
     */
    fun clearConfiguration(context: Context) {
        getPreferences(context)
            .edit()
            .clear()
            .apply()
    }
    
    /**
     * Generate suggested device IDs based on location
     */
    fun generateSuggestedIds(): List<String> {
        return listOf(
            "tv_lobby",
            "tv_restaurant", 
            "tv_conference",
            "tv_retail",
            "tv_waiting_room",
            "tv_kitchen",
            "tv_office",
            "tv_break_room"
        )
    }
    
    private fun getPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
} 