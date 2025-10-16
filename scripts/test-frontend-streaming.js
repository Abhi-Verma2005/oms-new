#!/usr/bin/env node

/**
 * 🔍 Test Frontend Streaming Compatibility
 * Test if the RAG API streaming response is compatible with frontend expectations
 */

console.log('🔍 Testing Frontend Streaming Compatibility...\n')

async function testFrontendStreaming() {
  try {
    console.log('📡 Testing RAG API streaming compatibility...')
    
    const response = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, this is a test message',
        userId: 'test-user-123',
        messages: [
          { role: 'user', content: 'Hello, this is a test message' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response ok: ${response.ok}`)
    console.log(`📊 Response body: ${response.body ? 'Available' : 'Not available'}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error: ${errorText}`)
      return
    }
    
    if (!response.body) {
      console.log(`❌ No response body available`)
      return
    }
    
    console.log('\n📡 Testing stream processing...')
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let chunkCount = 0
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log(`✅ Stream completed successfully`)
          break
        }
        
        chunkCount++
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk
          
          if (chunkCount <= 5) {
            console.log(`  Chunk ${chunkCount}: "${chunk}"`)
          }
        }
      }
      
      console.log(`📊 Total chunks: ${chunkCount}`)
      console.log(`📊 Full response length: ${fullResponse.length}`)
      console.log(`📊 Response preview: "${fullResponse.substring(0, 100)}..."`)
      
      // Check if response looks complete
      if (fullResponse.trim().length > 0) {
        console.log(`✅ Response appears complete`)
      } else {
        console.log(`❌ Response appears empty`)
      }
      
    } catch (streamError) {
      console.log(`❌ Stream processing error: ${streamError.message}`)
    }
    
    // Test with a longer message to see if there are any issues
    console.log('\n📡 Testing with longer message...')
    
    const longResponse = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Can you give me a detailed explanation of digital marketing strategies for SaaS companies?',
        userId: 'test-user-123',
        messages: [
          { role: 'user', content: 'Can you give me a detailed explanation of digital marketing strategies for SaaS companies?' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    if (longResponse.ok && longResponse.body) {
      const longReader = longResponse.body.getReader()
      const longDecoder = new TextDecoder()
      let longFullResponse = ''
      let longChunkCount = 0
      
      try {
        while (true) {
          const { done, value } = await longReader.read()
          
          if (done) {
            break
          }
          
          longChunkCount++
          
          if (value) {
            const chunk = longDecoder.decode(value, { stream: true })
            longFullResponse += chunk
          }
        }
        
        console.log(`📊 Long response chunks: ${longChunkCount}`)
        console.log(`📊 Long response length: ${longFullResponse.length}`)
        console.log(`📊 Long response preview: "${longFullResponse.substring(0, 150)}..."`)
        
        if (longFullResponse.length > 100) {
          console.log(`✅ Long response appears complete`)
        } else {
          console.log(`❌ Long response appears truncated`)
        }
        
      } catch (longStreamError) {
        console.log(`❌ Long stream processing error: ${longStreamError.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend streaming:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  }
}

console.log('📊 Test Plan:')
console.log('  • Test basic streaming compatibility')
console.log('  • Test stream processing')
console.log('  • Test with longer responses')
console.log('  • Verify response completeness')

testFrontendStreaming()
