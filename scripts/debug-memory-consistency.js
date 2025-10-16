#!/usr/bin/env node

/**
 * 🧪 Debug Memory Consistency
 * Debug why memory retrieval is inconsistent
 */

console.log('🧪 Debugging Memory Consistency Issues...\n')

async function debugMemoryConsistency() {
  try {
    console.log('🔍 Investigating why memory retrieval is inconsistent...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testId = Date.now()
    
    // Test 1: Check what's actually stored in the database
    console.log('\n📊 Step 1: Checking what\'s stored in knowledge base...')
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const storedConversations = await prisma.$queryRaw`
        SELECT id, content, content_type, created_at
        FROM user_knowledge_base 
        WHERE user_id = ${testUserId}
        ORDER BY created_at DESC
        LIMIT 10
      `
      
      console.log(`📊 Found ${storedConversations.length} stored conversations:`)
      storedConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. "${conv.content.substring(0, 100)}..."`)
        console.log(`     Created: ${conv.created_at}`)
        console.log('')
      })
      
    } catch (dbError) {
      console.log('❌ Database connection failed:', dbError.message)
      console.log('🔍 This might be why memory retrieval is inconsistent')
      return
    } finally {
      await prisma.$disconnect()
    }
    
    // Test 2: Store new information and test retrieval immediately
    console.log('\n📝 Step 2: Testing immediate memory storage and retrieval...')
    
    const uniqueInfo = `I am a software engineer and I love coffee - immediate test ${testId}`
    console.log(`🔸 Storing: "${uniqueInfo}"`)
    
    const storeResponse = await sendMessage(uniqueInfo, testUserId)
    if (storeResponse.success) {
      console.log('✅ Information stored successfully')
      console.log(`📝 AI Response: "${storeResponse.content.substring(0, 100)}..."`)
      
      // Wait for processing
      console.log('⏳ Waiting for storage to complete...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Test immediate retrieval
      console.log('\n🔸 Testing immediate retrieval...')
      const retrieveResponse = await sendMessage('what do I do for work and what do I love?', testUserId)
      
      if (retrieveResponse.success) {
        console.log(`📝 AI Response: "${retrieveResponse.content}"`)
        
        if (retrieveResponse.content.toLowerCase().includes('software engineer') || 
            retrieveResponse.content.toLowerCase().includes('engineer')) {
          console.log('✅ SUCCESS: AI remembered the work information!')
        } else {
          console.log('❌ FAILED: AI did not remember work information')
        }
        
        if (retrieveResponse.content.toLowerCase().includes('coffee')) {
          console.log('✅ SUCCESS: AI remembered the coffee preference!')
        } else {
          console.log('❌ FAILED: AI did not remember coffee preference')
        }
      } else {
        console.log('❌ Failed to retrieve information')
      }
      
    } else {
      console.log('❌ Failed to store information')
    }
    
    // Test 3: Check if it's a cache issue
    console.log('\n📝 Step 3: Testing cache interference...')
    
    const cacheTestMessage = 'what is my favorite programming language?'
    console.log(`🔸 Testing: "${cacheTestMessage}"`)
    
    const cacheResponse = await sendMessage(cacheTestMessage, testUserId)
    if (cacheResponse.success) {
      console.log(`📝 AI Response: "${cacheResponse.content}"`)
      
      if (cacheResponse.content.includes('Sorry, I don\'t have access to personal information')) {
        console.log('🔍 ISSUE FOUND: AI is giving generic privacy response')
        console.log('🔍 This suggests cache interference or RAG context not being used')
      } else {
        console.log('✅ No cache interference detected')
      }
    }
    
    // Test 4: Test with different query phrasings
    console.log('\n📝 Step 4: Testing different query phrasings...')
    
    const queryVariations = [
      'what did I tell you about my job?',
      'tell me about my work',
      'what is my profession?',
      'what do I do for a living?'
    ]
    
    for (const query of queryVariations) {
      console.log(`🔸 Testing: "${query}"`)
      const response = await sendMessage(query, testUserId)
      
      if (response.success) {
        const content = response.content.toLowerCase()
        if (content.includes('engineer') || content.includes('software') || content.includes('developer')) {
          console.log('  ✅ Retrieved work information')
        } else {
          console.log('  ❌ Did not retrieve work information')
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Test 5: Check RAG context injection
    console.log('\n📝 Step 5: Testing RAG context injection...')
    
    console.log('🔸 Testing with a question that should definitely use RAG...')
    const ragTestMessage = `what did I tell you about my work in the immediate test ${testId}?`
    const ragResponse = await sendMessage(ragTestMessage, testUserId)
    
    if (ragResponse.success) {
      console.log(`📝 AI Response: "${ragResponse.content}"`)
      
      if (ragResponse.content.toLowerCase().includes('software engineer')) {
        console.log('✅ RAG context injection working!')
      } else {
        console.log('❌ RAG context injection not working properly')
        console.log('🔍 This explains why memory retrieval is inconsistent')
      }
    }
    
    console.log('\n📊 DIAGNOSIS:')
    console.log('🔍 Possible causes of inconsistent memory:')
    console.log('  1. Cache interference (generic responses)')
    console.log('  2. RAG context not being injected into prompts')
    console.log('  3. Database connection issues')
    console.log('  4. Timing issues with async storage')
    console.log('  5. Vector similarity threshold too high')
    
  } catch (error) {
    console.error('❌ Debug memory consistency error:', error.message)
  }
}

// Helper function to send messages
async function sendMessage(message, userId) {
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

debugMemoryConsistency()
