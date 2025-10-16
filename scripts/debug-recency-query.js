#!/usr/bin/env node

/**
 * 🧪 Debug Recency Query
 * Debug why the recency boost isn't working
 */

console.log('🧪 Debugging Recency Query...\n')

async function debugRecencyQuery() {
  try {
    console.log('🔍 Debugging why recency boost isn\'t working...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test 1: Check if the query is actually using recency boost
    console.log('\n📝 Test 1: Testing with completely new unique information...')
    
    const uniqueId = Date.now()
    const uniqueInfo = `My name is Sarah and I am a graphic designer - unique ${uniqueId}`
    
    console.log(`🔸 Storing: "${uniqueInfo}"`)
    const storeResponse = await sendMessage(uniqueInfo, testUserId)
    
    if (storeResponse.success) {
      console.log('✅ Information stored')
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test retrieval with very specific query
      console.log('🔸 Testing retrieval with specific query...')
      const specificQuery = `what did I tell you about being a graphic designer with ID ${uniqueId}?`
      const queryResponse = await sendMessage(specificQuery, testUserId)
      
      if (queryResponse.success) {
        console.log(`📝 AI Response: "${queryResponse.content}"`)
        
        if (queryResponse.content.toLowerCase().includes('graphic designer') && 
            queryResponse.content.includes(uniqueId.toString())) {
          console.log('✅ SUCCESS: Retrieved the specific recent information!')
          console.log('✅ RAG system is working correctly')
        } else {
          console.log('❌ FAILED: Did not retrieve the specific information')
        }
      }
    }
    
    // Test 2: Check if cache is interfering
    console.log('\n📝 Test 2: Testing cache interference...')
    
    const cacheTestMessage = 'what do I do for work?'
    console.log(`🔸 Testing: "${cacheTestMessage}"`)
    
    const cacheResponse = await sendMessage(cacheTestMessage, testUserId)
    if (cacheResponse.success) {
      console.log(`📝 AI Response: "${cacheResponse.content}"`)
      
      if (cacheResponse.content.includes('Sorry, I don\'t have access to personal information')) {
        console.log('🔍 ISSUE: Cache is interfering with RAG retrieval')
        console.log('🔍 The system is returning cached responses instead of using RAG')
      } else {
        console.log('✅ No cache interference detected')
      }
    }
    
    // Test 3: Force a cache miss with unique query
    console.log('\n📝 Test 3: Forcing cache miss...')
    
    const uniqueQuery = `what is my profession as of ${Date.now()}?`
    console.log(`🔸 Testing unique query: "${uniqueQuery}"`)
    
    const uniqueQueryResponse = await sendMessage(uniqueQuery, testUserId)
    if (uniqueQueryResponse.success) {
      console.log(`📝 AI Response: "${uniqueQueryResponse.content}"`)
      
      if (uniqueQueryResponse.content.toLowerCase().includes('graphic designer')) {
        console.log('✅ SUCCESS: Retrieved recent information when cache missed!')
      } else {
        console.log('❌ FAILED: Still not retrieving recent information')
      }
    }
    
    console.log('\n📊 DIAGNOSIS:')
    console.log('🔍 The issue might be:')
    console.log('  1. Cache is interfering with RAG retrieval')
    console.log('  2. SQL query syntax error in recency boost')
    console.log('  3. Vector similarity is still too dominant')
    console.log('  4. Timing issue with async storage')
    
  } catch (error) {
    console.error('❌ Debug recency query error:', error.message)
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

debugRecencyQuery()
