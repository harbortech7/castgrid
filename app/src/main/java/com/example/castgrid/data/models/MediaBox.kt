package com.example.castgrid.data.models

import com.google.gson.annotations.SerializedName

/**
 * MediaBox model representing a collection of media items
 * Contains media items that will be displayed in a grid position
 */
data class MediaBox(
    @SerializedName("mediaBoxId")
    val mediaBoxId: String = "",
    
    @SerializedName("name")
    val name: String = "",
    
    @SerializedName("mediaItems")
    val mediaItems: List<String> = emptyList() // List of MediaItem IDs
) {
    // Firestore requires a no-argument constructor
    constructor() : this("", "", emptyList())
    
    fun toMap(): Map<String, Any> {
        return mapOf(
            "mediaBoxId" to mediaBoxId,
            "name" to name,
            "mediaItems" to mediaItems
        )
    }
    
    /**
     * Returns true if this media box has any media items
     */
    fun hasMediaItems(): Boolean {
        return mediaItems.isNotEmpty()
    }
    
    /**
     * Returns the number of media items in this box
     */
    fun getMediaItemCount(): Int {
        return mediaItems.size
    }
} 