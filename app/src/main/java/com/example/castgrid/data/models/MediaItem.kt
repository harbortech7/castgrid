package com.example.castgrid.data.models

import com.google.gson.annotations.SerializedName

/**
 * MediaItem model representing a single media file (video or image)
 * Supports automatic playback based on alphabetical order as specified in ProjectPlan.md
 */
data class MediaItem(
    @SerializedName("mediaId")
    val mediaId: String = "",
    
    @SerializedName("type")
    val type: MediaType = MediaType.IMAGE,
    
    @SerializedName("filename")
    val filename: String = "",
    
    @SerializedName("url")
    val url: String = "",
    
    @SerializedName("duration")
    val duration: Int = 30, // Duration in seconds for images, actual duration for videos
    
    @SerializedName("fileName")
    val fileName: String? = null,
    
    @SerializedName("fileSize")
    val fileSize: Long? = null,
    
    @SerializedName("uploadedAt")
    val uploadedAt: String? = null,
    
    @SerializedName("localPath")
    val localPath: String? = null,
    
    @SerializedName("isLocal")
    val isLocal: Boolean = false,
    
    @SerializedName("downloadStatus")
    val downloadStatus: String = "pending" // pending, downloading, completed, failed
) {
    // Firestore requires a no-argument constructor
    constructor() : this("", MediaType.IMAGE, "", "", 30)
    
    fun toMap(): Map<String, Any> {
        return mapOf(
            "mediaId" to mediaId,
            "type" to type.value,
            "filename" to filename,
            "url" to url,
            "duration" to duration
        )
    }
    
    /**
     * Returns true if this is a video file
     */
    fun isVideo(): Boolean {
        return type == MediaType.VIDEO
    }
    
    /**
     * Returns true if this is an image file
     */
    fun isImage(): Boolean {
        return type == MediaType.IMAGE
    }
    
    /**
     * Gets the file extension from filename
     */
    fun getFileExtension(): String {
        return filename.substringAfterLast('.', "").lowercase()
    }
    
    /**
     * Returns the alphabetical sort order based on filename
     * Videos play first if they come before images alphabetically
     */
    fun getAlphabeticalOrder(): String {
        return filename.lowercase()
    }
}

/**
 * Enum representing the type of media
 */
enum class MediaType(val value: String) {
    @SerializedName("video")
    VIDEO("video"),
    
    @SerializedName("image")
    IMAGE("image");
    
    companion object {
        fun fromString(value: String): MediaType {
            return when (value.lowercase()) {
                "video" -> VIDEO
                "image" -> IMAGE
                else -> IMAGE // Default to image
            }
        }
        
        fun fromFileExtension(extension: String): MediaType {
            return when (extension.lowercase()) {
                "mp4", "avi", "mov", "mkv", "webm" -> VIDEO
                "jpg", "jpeg", "png", "gif", "bmp", "webp" -> IMAGE
                else -> IMAGE // Default to image
            }
        }
    }
} 