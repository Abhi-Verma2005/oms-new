#!/usr/bin/env node

/**
 * 🧪 Test Without Cache
 * Test memory system by avoiding cache hits completely
 */

console.log('🧪 Testing Memory System Without Cache Interference...\n')

async function testWithoutCache() {
  try {
    console.log('🔍 Testing memory system by avoiding cache hits...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testId = Date.now()
    
    // Test 1: Store information with unique identifier
    console.log('\n📝 Test 1: Storing information with unique identifier...')
    
    const uniqueInfo = `My profession is marketing manager and I specialize in digital marketing - unique ${testId}`
    console.log(`🔸 Storing: "${uniqueInfo}"`)
    
    const storeResponse = await sendMessage(uniqueInfo, testUserId)
    if (storeResponse.success) {
      console.log('✅ Information stored successfully')
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test 2: Query with unique identifier to avoid cache
      console.log('\n📝 Test 2: Querying with unique identifier to avoid cache...')
      
      const uniqueQuery = `what is my profession according to unique test ${testId}?`
      console.log(`🔸 Querying: "${uniqueQuery}"`)
      
      const queryResponse = await sendMessage(uniqueQuery, testUserId)
      if (queryResponse.success) {
        console.log(`📝 AI Response: "${queryResponse.content}"`)
        
        if (queryResponse.content.toLowerCase().includes('marketing manager')) {
          console.log('✅ SUCCESS: Retrieved the correct profession!')
          console.log('✅ RAG system is working when cache is avoided')
        } else {
          console.log('❌ FAILED: Did not retrieve the correct profession')
        }
      }
      
      // Test 3: Test with general query after unique query
      console.log('\n📝 Test 3: Testing general query after unique query...')
      
      const generalQuery = 'what do I do for work?'
      console.log(`🔸 Querying: "${generalQuery}"`)
      
      const generalResponse = await sendMessage(generalQuery, testUserId)
      if (generalResponse.success) {
        console.log(`📝 AI Response: "${generalResponse.content}"`)
        
        if (generalResponse.content.toLowerCase().includes('marketing manager')) {
          console.log('✅ SUCCESS: Retrieved recent profession with general query!')
          console.log('✅ Memory system is working correctly')
        } else {
          console.log('❌ FAILED: Did not retrieve recent profession with general query')
          console.log('❌ This suggests the recency boost is not working')
        }
      }
      
    } else {
      console.log('❌ Failed to store information')
    }
    
    console.log('\n📊 ANALYSIS:')
    console.log('🔍 If the unique query works but general query doesn\'t:')
    console.log('  - RAG system is working correctly')
    console.log('  - Recency boost is not working')
    console.log('  - Cache might be interfering with general queries')
    
  } catch (error) {
    console.error('❌ Test without cache error:', error.message)
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

testWithoutCache()
