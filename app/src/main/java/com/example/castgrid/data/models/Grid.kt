package com.example.castgrid.data.models

import com.google.gson.annotations.SerializedName

/**
 * Grid model representing a grid position on a device
 * Supports up to 8 grid zones per screen as specified in ProjectPlan.md
 */
data class Grid(
    @SerializedName("gridId")
    val gridId: String = "",
    
    @SerializedName("deviceId")
    val deviceId: String = "",
    
    @SerializedName("position")
    val position: Int = 1, // 1-8 positions supported
    
    @SerializedName("mediaBoxId")
    val mediaBoxId: String = ""
) {
    // Firestore requires a no-argument constructor
    constructor() : this("", "", 1, "")
    
    fun toMap(): Map<String, Any> {
        return mapOf(
            "gridId" to gridId,
            "deviceId" to deviceId,
            "position" to position,
            "mediaBoxId" to mediaBoxId
        )
    }
    
    companion object {
        const val MAX_GRID_POSITIONS = 8
        
        fun isValidPosition(position: Int): Boolean {
            return position in 1..MAX_GRID_POSITIONS
        }
    }
} 