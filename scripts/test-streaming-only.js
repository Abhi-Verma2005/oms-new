#!/usr/bin/env node

/**
 * 🔍 Test Streaming Only
 * Test just the streaming functionality
 */

console.log('🔍 Testing Streaming Only...\n')

async function testStreamingOnly() {
  try {
    console.log('🔍 Testing streaming request...')
    
    const response = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello streaming test',
        userId: 'streaming-test-user',
        messages: [
          { role: 'user', content: 'Hello streaming test' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response ok: ${response.ok}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
      
      try {
        const errorData = JSON.parse(errorText)
        console.log(`📊 Error data:`, errorData)
      } catch (e) {
        console.log(`📊 Raw error text: ${errorText}`)
      }
    } else {
      console.log('✅ Streaming response successful')
      
      const reader = response.body.getReader()
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
        
        console.log(`📊 Stream completed: ${chunkCount} chunks, ${streamContent.length} characters`)
        console.log(`📝 Content preview: "${streamContent.substring(0, 100)}..."`)
        
      } catch (streamError) {
        console.log(`❌ Stream processing error: ${streamError.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message)
  }
}

testStreamingOnly()
