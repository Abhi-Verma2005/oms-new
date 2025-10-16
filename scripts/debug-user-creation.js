#!/usr/bin/env node

/**
 * 🔍 Debug User Creation
 * Check what's happening with user creation and foreign key constraints
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

console.log('🔍 Debugging User Creation Issues...\n')

const prisma = new PrismaClient()

async function debugUserCreation() {
  try {
    console.log('🔍 Testing user creation logic...')
    
    // Test different user IDs
    const testUserIds = [
      'test-user-123',
      'anonymous',
      'streaming-test-user',
      'debug-test-user',
      'error-test-user',
      'integration-test-user',
      'cmf2xwqgp00003bg1lzw6pev0', // Existing user
      'non-existent-user-123'
    ]
    
    for (const userId of testUserIds) {
      console.log(`\n🔍 Testing userId: "${userId}"`)
      
      let validUserId = userId
      
      // Apply the same logic as in the API
      if (userId === 'test-user-123' || userId === 'anonymous' || userId === 'streaming-test-user' || userId === 'debug-test-user' || userId === 'error-test-user' || userId === 'integration-test-user') {
        console.log('  📝 Creating test user...')
        const testUser = await prisma.user.upsert({
          where: { email: 'test-user@example.com' },
          update: {},
          create: {
            email: 'test-user@example.com',
            name: 'Test User'
          }
        })
        validUserId = testUser.id
        console.log(`  ✅ Test user created/found: ${validUserId}`)
      }
      
      // Check if validUserId exists in database
      const userExists = await prisma.$queryRaw`
        SELECT id, email, name
        FROM users
        WHERE id = ${validUserId}
      `
      
      if (userExists.length > 0) {
        console.log(`  ✅ User exists in database: ${userExists[0].email}`)
        
        // Test cache insertion
        const queryHash = crypto.createHash('sha256').update('test message').digest('hex')
        const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
        
        try {
          await prisma.$executeRaw`
            INSERT INTO semantic_cache (user_id, query_hash, query_embedding, cached_response, expires_at)
            VALUES (${validUserId}, ${queryHash}, ${`[${mockEmbedding.join(',')}]`}::vector(1536), ${JSON.stringify({ test: 'data' })}::jsonb, NOW() + INTERVAL '1 hour')
            ON CONFLICT (user_id, query_hash) 
            DO UPDATE SET 
              cached_response = EXCLUDED.cached_response,
              expires_at = EXCLUDED.expires_at
          `
          console.log(`  ✅ Cache insertion successful`)
          
          // Clean up test cache entry
          await prisma.$executeRaw`
            DELETE FROM semantic_cache
            WHERE user_id = ${validUserId} AND query_hash = ${queryHash}
          `
          console.log(`  🧹 Test cache entry cleaned up`)
          
        } catch (cacheError) {
          console.log(`  ❌ Cache insertion failed: ${cacheError.message}`)
        }
        
      } else {
        console.log(`  ❌ User does NOT exist in database: ${validUserId}`)
        
        // Try to create the user
        try {
          const newUser = await prisma.user.create({
            data: {
              id: validUserId,
              email: `user-${validUserId}@example.com`,
              name: `User ${validUserId}`
            }
          })
          console.log(`  ✅ User created: ${newUser.id}`)
        } catch (createError) {
          console.log(`  ❌ User creation failed: ${createError.message}`)
        }
      }
    }
    
    // Check all users in database
    console.log('\n🔍 All users in database:')
    const allUsers = await prisma.$queryRaw`
      SELECT id, email, name, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    console.log(`📊 Total users: ${allUsers.length}`)
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`)
      console.log(`     Email: ${user.email}`)
      console.log(`     Name: ${user.name}`)
      console.log(`     Created: ${user.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error debugging user creation:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserCreation()
