package com.example.castgrid.di

import android.content.Context
import com.example.castgrid.data.firebase.FirebaseConfig
import com.example.castgrid.data.repository.CastGridRepository
import com.example.castgrid.data.repository.FirebaseCastGridRepository
import com.example.castgrid.data.demo.DemoDataSeeder
import com.example.castgrid.ui.viewmodel.CastGridViewModel

/**
 * Simple dependency injection module for CastGrid app
 * Provides singleton instances of core dependencies
 */
object AppModule {
    
    @Volatile
    private var repository: CastGridRepository? = null
    
    @Volatile
    private var viewModel: CastGridViewModel? = null
    
    @Volatile
    private var demoDataSeeder: DemoDataSeeder? = null
    
    /**
     * Initialize the module with Firebase
     */
    fun initialize() {
        FirebaseConfig.initialize()
    }
    
    /**
     * Provide CastGrid repository instance
     */
    fun provideCastGridRepository(): CastGridRepository {
        return repository ?: synchronized(this) {
            repository ?: FirebaseCastGridRepository().also { repository = it }
        }
    }
    
    /**
     * Provide CastGrid ViewModel instance
     */
    fun provideCastGridViewModel(context: Context): CastGridViewModel {
        return viewModel ?: synchronized(this) {
            viewModel ?: CastGridViewModel(
                repository = provideCastGridRepository(),
                context = context.applicationContext
            ).also { viewModel = it }
        }
    }
    
    /**
     * Provide demo data seeder instance
     */
    fun provideDemoDataSeeder(): DemoDataSeeder {
        return demoDataSeeder ?: synchronized(this) {
            demoDataSeeder ?: DemoDataSeeder(provideCastGridRepository()).also { demoDataSeeder = it }
        }
    }
} 