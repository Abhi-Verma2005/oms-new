#!/usr/bin/env node

/**
 * 🧪 Test Modern Streaming Implementation
 * Test the new TransformStream-based streaming with RAG
 */

console.log('🧪 Testing Modern Streaming Implementation...\n')

async function testModernStreaming() {
  try {
    console.log('🔍 Testing modern TransformStream-based streaming...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test various message types to ensure streaming consistency
    const testMessages = [
      'what is my favorite food?',
      'hello, how are you today?',
      'help me navigate to the products page',
      'what can you do for me?',
      'tell me about the weather'
    ]
    
    let successCount = 0
    let totalTests = testMessages.length
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      console.log(`\n📝 Test ${i + 1}/${totalTests}: "${message}"`)
      
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
        
        // Test modern streaming with detailed analysis
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let content = ''
        let chunkCount = 0
        let firstChunkTime = 0
        let lastChunkTime = 0
        let toolEvents = 0
        let hasToolEvents = false
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            chunkCount++
            const chunk = decoder.decode(value, { stream: true })
            content += chunk
            
            // Track timing
            if (chunkCount === 1) {
              firstChunkTime = Date.now() - startTime
            }
            lastChunkTime = Date.now() - startTime
            
            // Count tool events
            if (chunk.includes('[[TOOL]]')) {
              toolEvents++
              hasToolEvents = true
            }
            
            // Log first few chunks for debugging
            if (chunkCount <= 3) {
              console.log(`  📦 Chunk ${chunkCount}: "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`)
            }
          }
          
          const totalTime = Date.now() - startTime
          
          console.log(`  📝 Final response: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`)
          console.log(`  📊 Total chunks: ${chunkCount}`)
          console.log(`  🚀 First chunk: ${firstChunkTime}ms`)
          console.log(`  ⏹️ Last chunk: ${lastChunkTime}ms`)
          console.log(`  🛠️ Tool events: ${toolEvents}`)
          console.log(`  ⏱️ Total time: ${totalTime}ms`)
          
          // Analyze streaming performance
          if (chunkCount === 0) {
            console.log('  ❌ No chunks received - streaming failed')
          } else if (chunkCount < 5) {
            console.log('  ⚠️ Very few chunks - might indicate issues')
          } else if (firstChunkTime > 5000) {
            console.log('  ⚠️ Slow first chunk - possible performance issue')
          } else if (totalTime - lastChunkTime > 2000) {
            console.log('  ⚠️ Long delay after last chunk - possible hanging')
          } else {
            console.log('  ✅ Modern streaming working correctly')
            successCount++
          }
          
          // Check for tool events if navigation was requested
          if (message.includes('navigate') && !hasToolEvents) {
            console.log('  ⚠️ Navigation requested but no tool events detected')
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
      
      // Wait between requests to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\n📊 Modern Streaming Test Results:`)
    console.log(`  ✅ Successful: ${successCount}/${totalTests}`)
    console.log(`  📈 Success rate: ${((successCount / totalTests) * 100).toFixed(1)}%`)
    
    if (successCount === totalTests) {
      console.log('\n🎉 All modern streaming tests passed!')
    } else if (successCount > totalTests / 2) {
      console.log('\n⚠️ Most tests passed, but some issues detected')
    } else {
      console.log('\n❌ Multiple streaming issues detected')
    }
    
  } catch (error) {
    console.error('❌ Error testing modern streaming:', error.message)
  }
}

testModernStreaming()
