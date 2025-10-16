#!/usr/bin/env node

/**
 * 🔧 Test RAG Error Fixes
 * Test the fixes for duplicate cache and database connection errors
 */

console.log('🔧 Testing RAG Error Fixes...\n')

async function testRAGErrorFixes() {
  try {
    console.log('🔍 Testing RAG API error fixes...')
    
    // Test rapid requests to trigger duplicate cache entry
    console.log('📝 Test 1: Rapid duplicate requests (should handle cache conflicts)')
    
    const testMessage = 'What is the best programming language to learn?'
    const testUserId = 'error-test-user'
    
    // Make multiple rapid requests
    const promises = []
    for (let i = 0; i < 3; i++) {
      promises.push(
        fetch('http://localhost:3000/api/ai-chat-rag', {
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
            clientConfig: {},
            cartState: null,
            currentUrl: '/test'
          })
        })
      )
    }
    
    console.log('  🚀 Sending 3 rapid requests...')
    const responses = await Promise.all(promises)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      if (response.ok) {
        const data = await response.json()
        console.log(`  ✅ Request ${i + 1}: ${response.status} - Cached: ${data.cacheHit}`)
        successCount++
      } else {
        const errorText = await response.text()
        console.log(`  ❌ Request ${i + 1}: ${response.status} - ${errorText}`)
        errorCount++
      }
    }
    
    console.log(`  📊 Results: ${successCount} successful, ${errorCount} errors`)
    
    // Test streaming with cache
    console.log('\n📝 Test 2: Streaming with cache (should handle connection issues)')
    
    const streamResponse = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Tell me about web development',
        userId: testUserId,
        messages: [
          { role: 'user', content: 'Tell me about web development' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`  📊 Stream response status: ${streamResponse.status}`)
    
    if (streamResponse.ok) {
      console.log('  📡 Reading stream...')
      
      const reader = streamResponse.body.getReader()
      const decoder = new TextDecoder()
      let streamContent = ''
      let chunkCount = 0
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          chunkCount++
          const chunk = decoder.decode(value, { stream: true })
          streamContent += chunk
        }
        
        console.log(`  ✅ Stream completed: ${chunkCount} chunks, ${streamContent.length} characters`)
        console.log(`  📝 Content preview: "${streamContent.substring(0, 100)}..."`)
        
      } catch (streamError) {
        console.log(`  ❌ Stream error: ${streamError.message}`)
      }
    } else {
      const errorText = await streamResponse.text()
      console.log(`  ❌ Stream request failed: ${errorText}`)
    }
    
    // Test cache hit scenario
    console.log('\n📝 Test 3: Cache hit scenario (should be fast)')
    
    const cacheHitStart = Date.now()
    const cacheHitResponse = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage, // Same message as before
        userId: testUserId,
        messages: [
          { role: 'user', content: testMessage }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    const cacheHitEnd = Date.now()
    const cacheHitDuration = cacheHitEnd - cacheHitStart
    
    if (cacheHitResponse.ok) {
      const cacheData = await cacheHitResponse.json()
      console.log(`  ✅ Cache hit: ${cacheHitDuration}ms - Cached: ${cacheData.cacheHit}`)
      console.log(`  📝 Response: "${cacheData.message.substring(0, 80)}..."`)
    } else {
      const errorText = await cacheHitResponse.text()
      console.log(`  ❌ Cache hit failed: ${errorText}`)
    }
    
    console.log('\n✅ RAG Error Fixes Test Completed!')
    
  } catch (error) {
    console.error('❌ Error testing RAG fixes:', error.message)
  }
}

console.log('📊 Test Plan:')
console.log('  • Test rapid duplicate requests (cache conflicts)')
console.log('  • Test streaming with cache (connection issues)')
console.log('  • Test cache hit scenarios')
console.log('  • Verify error handling improvements')

testRAGErrorFixes()
