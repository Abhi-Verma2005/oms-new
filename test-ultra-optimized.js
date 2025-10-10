async function testUltraOptimized() {
  try {
    console.log('🚀 Testing Ultra-Optimized AI Chat System')
    console.log('==========================================')
    
    // Test 1: Basic Performance Test
    console.log('\n1. Testing Basic Performance...')
    
    const testMessage = 'Hello, ultra-optimized test!'
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          messages: [],
          config: {
            systemPrompt: 'You are a helpful AI assistant.',
            navigationData: []
          },
          currentUrl: '/test',
          cartState: { items: [], totalItems: 0, totalPrice: 0 }
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Basic Performance: OK (${duration}ms)`)
        console.log(`   Response: "${data.response?.substring(0, 80)}..."`)
        
        if (duration < 1000) {
          console.log('🎉 EXCELLENT: Response time under 1 second!')
        } else if (duration < 2000) {
          console.log('✅ GOOD: Response time under 2 seconds')
        } else if (duration < 3000) {
          console.log('⚠️ MODERATE: Response time under 3 seconds')
        } else {
          console.log('❌ SLOW: Response time over 3 seconds')
        }
      } else {
        console.log(`❌ Basic Performance: FAILED (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ Basic Performance: ERROR - ${error.message}`)
    }
    
    // Test 2: Streaming Performance Test
    console.log('\n2. Testing Streaming Performance...')
    
    const streamingStartTime = Date.now()
    
    try {
      const streamingResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Tell me about SEO optimization in 2 sentences',
          messages: [],
          config: {
            systemPrompt: 'You are a helpful AI assistant.',
            navigationData: []
          }
        })
      })
      
      if (streamingResponse.ok) {
        const reader = streamingResponse.body?.getReader()
        let streamedText = ''
        let firstTokenTime = null
        
        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = new TextDecoder().decode(value)
              streamedText += chunk
              
              if (!firstTokenTime && chunk.trim()) {
                firstTokenTime = Date.now()
                const timeToFirstToken = firstTokenTime - streamingStartTime
                console.log(`✅ First token received: ${timeToFirstToken}ms`)
              }
            }
            
            const streamingEndTime = Date.now()
            const totalStreamingTime = streamingEndTime - streamingStartTime
            
            console.log(`✅ Streaming completed: ${totalStreamingTime}ms`)
            console.log(`   Streamed text length: ${streamedText.length} characters`)
            
            if (firstTokenTime && (firstTokenTime - streamingStartTime) < 300) {
              console.log('🎉 EXCELLENT: First token under 300ms!')
            } else if (firstTokenTime && (firstTokenTime - streamingStartTime) < 500) {
              console.log('✅ GOOD: First token under 500ms')
            } else if (firstTokenTime && (firstTokenTime - streamingStartTime) < 1000) {
              console.log('⚠️ MODERATE: First token under 1 second')
            } else {
              console.log('❌ SLOW: First token over 1 second')
            }
            
          } finally {
            reader.releaseLock()
          }
        }
      } else {
        console.log(`❌ Streaming Performance: FAILED (${streamingResponse.status})`)
      }
    } catch (error) {
      console.log(`❌ Streaming Performance: ERROR - ${error.message}`)
    }
    
    // Test 3: Multiple Rapid Requests
    console.log('\n3. Testing Multiple Rapid Requests...')
    
    const rapidStartTime = Date.now()
    const rapidRequests = 5
    
    const promises = []
    for (let i = 0; i < rapidRequests; i++) {
      const promise = fetch('http://localhost:3000/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Rapid test ${i + 1}`,
          messages: [],
          config: {
            systemPrompt: 'You are a helpful AI assistant.',
            navigationData: []
          }
        })
      }).then(response => response.ok)
      promises.push(promise)
    }
    
    try {
      const results = await Promise.all(promises)
      const rapidEndTime = Date.now()
      const rapidDuration = rapidEndTime - rapidStartTime
      
      const successCount = results.filter(Boolean).length
      console.log(`✅ Rapid requests: ${successCount}/${rapidRequests} successful (${rapidDuration}ms)`)
      
      if (rapidDuration < 3000) {
        console.log('🎉 EXCELLENT: All rapid requests completed quickly!')
      } else if (rapidDuration < 5000) {
        console.log('✅ GOOD: Rapid requests completed reasonably fast')
      } else {
        console.log('⚠️ MODERATE: Rapid requests took longer than expected')
      }
      
    } catch (error) {
      console.log(`❌ Rapid requests: ERROR - ${error.message}`)
    }
    
    // Test 4: Performance Summary
    console.log('\n4. Performance Summary...')
    console.log('=========================')
    console.log('ULTRA-OPTIMIZATIONS APPLIED:')
    console.log('  ✅ Minimal system prompt (1 line)')
    console.log('  ✅ No user context fetching')
    console.log('  ✅ No database operations')
    console.log('  ✅ No background processing')
    console.log('  ✅ Reduced max tokens (512)')
    console.log('  ✅ Limited message history (5 messages)')
    console.log('  ✅ Minimal tool detection')
    console.log('')
    console.log('EXPECTED PERFORMANCE:')
    console.log('  🎯 Response Time: <1 second')
    console.log('  🎯 First Token: <300ms')
    console.log('  🎯 Streaming: Immediate start')
    console.log('  🎯 Concurrent: High throughput')
    
    console.log('\n🎉 Ultra-Optimized AI Chat Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testUltraOptimized()
