package com.example.castgrid

import android.app.Application
import com.example.castgrid.di.AppModule

/**
 * CastGrid Application class
 * Initializes all dependencies and Firebase configuration
 */
class CastGridApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Firebase and all dependencies
        AppModule.initialize()
    }
} 