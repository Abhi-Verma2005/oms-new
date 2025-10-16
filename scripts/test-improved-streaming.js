#!/usr/bin/env node

/**
 * 🧪 Test Improved Streaming
 * Test the improved streaming with better error handling
 */

console.log('🧪 Testing Improved Streaming...\n')

async function testImprovedStreaming() {
  try {
    console.log('🔍 Testing improved streaming implementation...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test multiple requests to check for consistency
    const testMessages = [
      'what is my fav food?',
      'hello, how are you?',
      'what is the weather like?',
      'help me with something'
    ]
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      console.log(`\n📝 Test ${i + 1}: "${message}"`)
      
      const startTime = Date.now()
      const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: testUserId,
          messages: [
            { role: 'user', content: message }
          ],
          config: {},
          currentUrl: '/test',
          cartState: null
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`  📊 Response status: ${response.status}`)
      console.log(`  ⏱️ Response time: ${duration}ms`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`  ❌ Error response: ${errorText}`)
        continue
      }
      
      if (!response.body) {
        console.log('  ❌ No response body received')
        continue
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      let chunkCount = 0
      let firstChunkTime = 0
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          chunkCount++
          const chunk = decoder.decode(value, { stream: true })
          content += chunk
          
          if (chunkCount === 1) {
            firstChunkTime = Date.now() - startTime
            console.log(`  🚀 First chunk received: ${firstChunkTime}ms`)
          }
        }
        
        console.log(`  📝 Response: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`)
        console.log(`  📊 Total chunks: ${chunkCount}`)
        
        if (chunkCount === 0) {
          console.log('  ⚠️ No chunks received - this indicates a streaming issue')
        } else if (chunkCount < 5) {
          console.log('  ⚠️ Very few chunks - might indicate incomplete streaming')
        } else {
          console.log('  ✅ Streaming worked correctly')
        }
        
      } catch (streamError) {
        console.log(`  ❌ Stream error: ${streamError.message}`)
      } finally {
        try {
          reader.releaseLock()
        } catch (e) {
          // Ignore
        }
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\n✅ Improved Streaming Test Completed!')
    
  } catch (error) {
    console.error('❌ Error testing improved streaming:', error.message)
  }
}

testImprovedStreaming()
