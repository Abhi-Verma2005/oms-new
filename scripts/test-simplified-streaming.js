#!/usr/bin/env node

/**
 * 🧪 Test Simplified Streaming
 * Test the simplified streaming implementation
 */

console.log('🧪 Testing Simplified Streaming Implementation...\n')

async function testSimplifiedStreaming() {
  try {
    console.log('🔍 Testing simplified streaming...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test with the problematic message
    const testMessage = 'my fav colour is red'
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
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`📊 Response status: ${response.status}`)
      console.log(`⏱️ Response time: ${duration}ms`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error response: ${errorText}`)
        return
      }
      
      if (!response.body) {
        console.log('❌ No response body received')
        return
      }
      
      // Test simplified streaming
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      let chunkCount = 0
      let firstChunkTime = 0
      
      console.log('🚀 Starting stream reading...')
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('✅ Stream completed')
            break
          }
          
          chunkCount++
          const chunk = decoder.decode(value, { stream: true })
          content += chunk
          
          if (chunkCount === 1) {
            firstChunkTime = Date.now() - startTime
            console.log(`🚀 First chunk received: ${firstChunkTime}ms`)
          }
          
          console.log(`📦 Chunk ${chunkCount}: "${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}"`)
        }
        
        const totalTime = Date.now() - startTime
        
        console.log(`\n📊 Results:`)
        console.log(`  📝 Final response: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"`)
        console.log(`  📊 Total chunks: ${chunkCount}`)
        console.log(`  🚀 First chunk: ${firstChunkTime}ms`)
        console.log(`  ⏱️ Total time: ${totalTime}ms`)
        
        if (chunkCount === 0) {
          console.log('  ❌ No chunks received - streaming failed')
        } else if (chunkCount < 3) {
          console.log('  ⚠️ Very few chunks - might indicate issues')
        } else if (firstChunkTime > 10000) {
          console.log('  ⚠️ Very slow first chunk - possible performance issue')
        } else {
          console.log('  ✅ Simplified streaming working correctly')
        }
        
      } catch (streamError) {
        console.log(`❌ Stream error: ${streamError.message}`)
      } finally {
        try {
          reader.releaseLock()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
    } catch (requestError) {
      console.log(`❌ Request error: ${requestError.message}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing simplified streaming:', error.message)
  }
}

testSimplifiedStreaming()
