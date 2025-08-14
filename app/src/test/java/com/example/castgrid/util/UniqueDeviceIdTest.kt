package com.example.castgrid.util

import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for unique device ID generation
 * Also serves as documentation/examples for device ID usage
 */
class UniqueDeviceIdTest {
    
    @Test
    fun `test device ID generation produces unique IDs`() {
        // Generate multiple IDs and ensure they're all unique
        val generatedIds = (1..10).map { 
            UniqueDeviceIdGenerator.generateUniqueId()
        }.toSet()
        
        // All IDs should be unique
        assertEquals(10, generatedIds.size)
        
        // All IDs should follow the expected format
        generatedIds.forEach { deviceId ->
            assertTrue("Device ID $deviceId should be valid", 
                UniqueDeviceIdGenerator.isValidDeviceId(deviceId))
            assertTrue("Device ID should start with tv_", deviceId.startsWith("tv_"))
        }
        
        println("✅ Generated 10 unique device IDs:")
        generatedIds.forEach { println("   $it") }
    }
    
    @Test
    fun `test location-based device ID generation`() {
        val testLocations = listOf(
            "Main Lobby",
            "Restaurant Area",
            "Conference Room A",
            "Break Room"
        )
        
        val locationBasedIds = testLocations.map { location ->
            UniqueDeviceIdGenerator.generateLocationBasedId(location)
        }
        
        // All IDs should be unique
        assertEquals(testLocations.size, locationBasedIds.toSet().size)
        
        // Test location extraction
        locationBasedIds.forEach { deviceId ->
            assertTrue("Location-based ID should be valid", 
                UniqueDeviceIdGenerator.isValidDeviceId(deviceId))
            
            val extractedLocation = UniqueDeviceIdGenerator.extractLocationFromId(deviceId)
            assertNotNull("Should extract location from ID", extractedLocation)
        }
        
        println("✅ Generated location-based device IDs:")
        testLocations.zip(locationBasedIds).forEach { (location, deviceId) ->
            println("   $location -> $deviceId")
        }
    }
    
    @Test
    fun `test pre-generated device IDs are valid`() {
        val preGeneratedIds = UniqueDeviceIdGenerator.preGeneratedIds
        
        // Should have multiple pre-generated IDs
        assertTrue("Should have at least 5 pre-generated IDs", 
            preGeneratedIds.size >= 5)
        
        // All pre-generated IDs should be valid
        preGeneratedIds.forEach { deviceId ->
            assertTrue("Pre-generated ID $deviceId should be valid", 
                UniqueDeviceIdGenerator.isValidDeviceId(deviceId))
        }
        
        // All pre-generated IDs should be unique
        assertEquals("All pre-generated IDs should be unique", 
            preGeneratedIds.size, preGeneratedIds.toSet().size)
        
        println("✅ Pre-generated device IDs are all valid:")
        preGeneratedIds.forEach { println("   $it") }
    }
    
    @Test
    fun `test device ID validation`() {
        // Valid device IDs
        val validIds = listOf(
            "tv_a7f3k9m2_2024",
            "tv_xyz123_9999",
            "tv_lobby_abc_1234"
        )
        
        validIds.forEach { deviceId ->
            assertTrue("$deviceId should be valid", 
                UniqueDeviceIdGenerator.isValidDeviceId(deviceId))
        }
        
        // Invalid device IDs
        val invalidIds = listOf(
            "device_123",      // Wrong prefix
            "tv_abc",          // Missing timestamp
            "tv_abc_",         // Empty timestamp
            "tv_abc_12a4",     // Non-numeric timestamp
            "",                // Empty string
            "tv__1234"         // Empty middle part
        )
        
        invalidIds.forEach { deviceId ->
            assertFalse("$deviceId should be invalid", 
                UniqueDeviceIdGenerator.isValidDeviceId(deviceId))
        }
        
        println("✅ Device ID validation working correctly")
    }
    
    @Test
    fun `test collision resistance`() {
        // Generate many IDs in quick succession to test for collisions
        val manyIds = mutableSetOf<String>()
        
        repeat(100) {
            val newId = UniqueDeviceIdGenerator.generateUniqueId()
            assertFalse("Generated ID $newId should not collide with existing IDs", 
                newId in manyIds)
            manyIds.add(newId)
        }
        
        assertEquals("Should generate 100 unique IDs", 100, manyIds.size)
        println("✅ Generated 100 unique IDs without collisions")
    }
    
    @Test
    fun `demo device setup for different scenarios`() {
        println("\n🏭 DEMO: Device Setup for Different Scenarios")
        println("=" * 60)
        
        // Scenario 1: Restaurant chain
        println("\n🍽️  Restaurant Chain Setup:")
        val restaurantLocations = listOf("Downtown Branch", "Mall Branch", "Airport Branch")
        restaurantLocations.forEach { location ->
            val deviceId = UniqueDeviceIdGenerator.generateLocationBasedId(location)
            println("   $location: $deviceId")
        }
        
        // Scenario 2: Office building
        println("\n🏢 Office Building Setup:")
        val officeLocations = listOf("Lobby", "Conference A", "Conference B", "Break Room")
        officeLocations.forEach { location ->
            val deviceId = UniqueDeviceIdGenerator.generateLocationBasedId(location)
            println("   $location: $deviceId")
        }
        
        // Scenario 3: Hospital
        println("\n🏥 Hospital Setup:")
        val hospitalLocations = listOf("Main Lobby", "Emergency", "Waiting Area", "Cafeteria")
        hospitalLocations.forEach { location ->
            val deviceId = UniqueDeviceIdGenerator.generateLocationBasedId(location)
            println("   $location: $deviceId")
        }
        
        println("\n✅ All scenarios demonstrated successfully!")
    }
}

// Extension function for string repetition (since Kotlin doesn't have * operator for strings in tests)
private operator fun String.times(count: Int): String = repeat(count) 