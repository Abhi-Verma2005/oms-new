#!/usr/bin/env node

/**
 * 🧪 Debug User-Specific Data
 * Check if data is being stored and retrieved per user correctly
 */

console.log('🧪 Debugging User-Specific Data Storage and Retrieval...\n')

async function debugUserSpecificData() {
  try {
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const uniqueTestId = Date.now()
    
    console.log(`👤 Testing with userId: ${testUserId}`)
    console.log(`🔍 Test ID: ${uniqueTestId}`)
    
    // Check what's currently in the database for this user
    console.log('\n📊 Step 1: Checking current database contents...')
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const userKnowledge = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at, user_id
        FROM user_knowledge_base 
        WHERE user_id = ${testUserId}
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      console.log(`📊 Found ${userKnowledge.length} entries for user ${testUserId}:`)
      userKnowledge.forEach((entry, index) => {
        console.log(`  ${index + 1}. [${entry.content_type}] "${entry.content.substring(0, 80)}..."`)
        console.log(`     Created: ${entry.created_at}`)
        console.log(`     User ID: ${entry.user_id}`)
        console.log('')
      })
      
    } catch (dbError) {
      console.log('❌ Database query failed:', dbError.message)
    } finally {
      await prisma.$disconnect()
    }
    
    // Test storing new user-specific data
    console.log('\n📝 Step 2: Storing new user-specific data...')
    
    const newUserData = `I am a unique user named TestUser${uniqueTestId} and I work as a software architect - user specific test ${uniqueTestId}`
    console.log(`🔸 Storing: "${newUserData}"`)
    
    const storeResponse = await testMessage(newUserData, testUserId)
    if (storeResponse.success) {
      console.log('✅ Data stored successfully')
      console.log(`📝 AI Response: "${storeResponse.content.substring(0, 100)}..."`)
      
      // Wait for storage
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check what was actually stored
      console.log('\n📊 Step 3: Checking what was stored...')
      
      try {
        await prisma.$connect()
        const newEntries = await prisma.$queryRaw`
          SELECT id, content, content_type, created_at, user_id
          FROM user_knowledge_base 
          WHERE user_id = ${testUserId}
          AND content LIKE ${'%' + uniqueTestId + '%'}
          ORDER BY created_at DESC
        `
        
        console.log(`📊 Found ${newEntries.length} new entries with test ID ${uniqueTestId}:`)
        newEntries.forEach((entry, index) => {
          console.log(`  ${index + 1}. [${entry.content_type}] "${entry.content}"`)
          console.log(`     Created: ${entry.created_at}`)
          console.log(`     User ID: ${entry.user_id}`)
        })
        
      } catch (dbError) {
        console.log('❌ Database query failed:', dbError.message)
      } finally {
        await prisma.$disconnect()
      }
      
      // Test retrieval
      console.log('\n📝 Step 4: Testing retrieval...')
      
      const retrievalTests = [
        `what is my name according to test ${uniqueTestId}?`,
        `what do I do for work according to test ${uniqueTestId}?`,
        `what did I tell you about being TestUser${uniqueTestId}?`
      ]
      
      for (const query of retrievalTests) {
        console.log(`🔸 Testing: "${query}"`)
        const response = await testMessage(query, testUserId)
        
        if (response.success) {
          console.log(`📝 Response: "${response.content}"`)
          
          if (response.content.toLowerCase().includes(`testuser${uniqueTestId}`) || 
              response.content.toLowerCase().includes('software architect')) {
            console.log('  ✅ Retrieved user-specific data correctly')
          } else {
            console.log('  ❌ Did not retrieve user-specific data')
          }
        } else {
          console.log('  ❌ Request failed')
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      // Test with different user ID to ensure isolation
      console.log('\n📝 Step 5: Testing user isolation...')
      
      const differentUserId = `test-user-${uniqueTestId}`
      console.log(`🔸 Testing with different user ID: ${differentUserId}`)
      
      const isolationQuery = `what do I do for work?`
      const isolationResponse = await testMessage(isolationQuery, differentUserId)
      
      if (isolationResponse.success) {
        console.log(`📝 Response for different user: "${isolationResponse.content}"`)
        
        if (isolationResponse.content.toLowerCase().includes('software architect') || 
            isolationResponse.content.toLowerCase().includes(`testuser${uniqueTestId}`)) {
          console.log('  ❌ USER ISOLATION FAILED: Retrieved data from different user')
        } else {
          console.log('  ✅ USER ISOLATION WORKING: No data from other users')
        }
      }
      
    } else {
      console.log('❌ Failed to store data')
    }
    
    console.log('\n📊 DIAGNOSIS:')
    console.log('🔍 Key issues to check:')
    console.log('  1. Are entries being stored with correct user_id?')
    console.log('  2. Are RAG queries filtering by user_id correctly?')
    console.log('  3. Is the user_id consistent across requests?')
    console.log('  4. Are old entries being cleaned up?')
    
  } catch (error) {
    console.error('❌ Debug user-specific data error:', error.message)
  }
}

// Helper function to test messages
async function testMessage(message, userId) {
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        messages: [
          { role: 'user', content: message }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += decoder.decode(value, { stream: true })
    }
    
    return { success: true, content: content }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

debugUserSpecificData()
