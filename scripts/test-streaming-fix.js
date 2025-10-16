#!/usr/bin/env node

/**
 * 🧪 Test Streaming Fix
 * Test that the streaming fix resolves the stuck typing indicator issue
 */

console.log('🧪 Testing Streaming Fix...\n')

async function testStreamingFix() {
  try {
    console.log('🔍 Testing streaming fix with multiple messages...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test various message types
    const testMessages = [
      'my fav colour is red',
      'hello there',
      'what is my favorite food?',
      'help me navigate to products'
    ]
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      console.log(`\n📝 Test ${i + 1}: "${message}"`)
      
      const startTime = Date.now()
      
      try {
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
        
        // Test streaming
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let content = ''
        let chunkCount = 0
        let firstChunkTime = 0
        let lastChunkTime = 0
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            chunkCount++
            const chunk = decoder.decode(value, { stream: true })
            content += chunk
            
            if (chunkCount === 1) {
              firstChunkTime = Date.now() - startTime
            }
            lastChunkTime = Date.now() - startTime
            
            // Log first few chunks
            if (chunkCount <= 3) {
              console.log(`  📦 Chunk ${chunkCount}: "${chunk.substring(0, 30)}${chunk.length > 30 ? '...' : ''}"`)
            }
          }
          
          const totalTime = Date.now() - startTime
          
          console.log(`  📝 Response: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`)
          console.log(`  📊 Chunks: ${chunkCount}, First: ${firstChunkTime}ms, Total: ${totalTime}ms`)
          
          // Check if streaming worked properly
          if (chunkCount === 0) {
            console.log('  ❌ No chunks - streaming failed')
          } else if (chunkCount < 3) {
            console.log('  ⚠️ Very few chunks - possible issue')
          } else if (firstChunkTime > 10000) {
            console.log('  ⚠️ Slow first chunk - possible performance issue')
          } else {
            console.log('  ✅ Streaming working correctly')
          }
          
        } catch (streamError) {
          console.log(`  ❌ Stream error: ${streamError.message}`)
        } finally {
          try {
            reader.releaseLock()
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
      } catch (requestError) {
        console.log(`  ❌ Request error: ${requestError.message}`)
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\n✅ Streaming Fix Test Completed!')
    
  } catch (error) {
    console.error('❌ Error testing streaming fix:', error.message)
  }
}

testStreamingFix()
