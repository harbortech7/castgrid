package com.example.castgrid.data.models

import com.google.gson.annotations.SerializedName

/**
 * Device model representing a TV or display device
 * Matches the schema defined in ProjectPlan.md
 */
data class Device(
    @SerializedName("deviceId")
    val deviceId: String = "",
    
    @SerializedName("location")
    val location: String = "",
    
    @SerializedName("grids")
    val grids: List<String> = emptyList()
) {
    // Firestore requires a no-argument constructor
    constructor() : this("", "", emptyList())
    
    fun toMap(): Map<String, Any> {
        return mapOf(
            "deviceId" to deviceId,
            "location" to location,
            "grids" to grids
        )
    }
} 