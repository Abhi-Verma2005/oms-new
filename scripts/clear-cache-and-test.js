#!/usr/bin/env node

/**
 * 🧪 Clear Cache and Test
 * Clear the cache and test if RAG works without cache hits
 */

console.log('🧪 Clearing Cache and Testing RAG...\n')

async function clearCacheAndTest() {
  try {
    console.log('🔍 Testing RAG without cache interference...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // First, let's try a completely new question to avoid cache hits
    const testMessage = 'what did I tell you about my favorite food earlier?'
    console.log(`📝 Testing: "${testMessage}"`)
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          userId: testUserId,
          messages: [
            { role: 'user', content: testMessage }
          ],
          config: {},
          currentUrl: '/test',
          cartState: null
        })
      })
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`)
        return
      }
      
      // Read the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`📊 Response time: ${duration}ms`)
      console.log(`📝 AI Response: "${content}"`)
      
      // Check if the AI remembered the pizza preference
      if (content.toLowerCase().includes('pizza')) {
        console.log('✅ SUCCESS: AI remembered your favorite food!')
        console.log('✅ RAG is working correctly!')
      } else {
        console.log('❌ FAILED: AI did not remember your favorite food')
        console.log('❌ RAG context is not being used properly')
      }
      
    } catch (requestError) {
      console.log(`❌ Request error: ${requestError.message}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing RAG:', error.message)
  }
}

clearCacheAndTest()
