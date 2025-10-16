#!/usr/bin/env node

/**
 * 🔍 Test Cache Error
 * Reproduce the exact foreign key constraint error
 */

console.log('🔍 Testing Cache Error...\n')

async function testCacheError() {
  try {
    // Test with a user ID that might cause the foreign key constraint error
    const problematicUserId = 'some-random-user-id'
    
    console.log(`👤 Testing with userId: ${problematicUserId}`)
    
    const response = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test message',
        userId: problematicUserId, // This should cause the error
        messages: [
          { role: 'user', content: 'test message' }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      console.log(`📊 Response length: ${content.length} characters`)
      console.log(`📝 Content: "${content}"`)
    } else {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing cache:', error.message)
  }
}

testCacheError()
