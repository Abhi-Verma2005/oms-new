#!/usr/bin/env node

/**
 * 🔍 Test RAG API Response Format
 * Check what format the RAG API is returning vs what frontend expects
 */

console.log('🔍 Testing RAG API Response Format...\n')

async function testRAGResponseFormat() {
  try {
    console.log('📡 Testing RAG API streaming response format...')
    
    const response = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        userId: 'test-user-123',
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response headers:`)
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error: ${errorText}`)
      return
    }
    
    console.log('\n📡 Raw streaming response:')
    console.log('─'.repeat(50))
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let chunkCount = 0
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      chunkCount++
      const chunk = decoder.decode(value, { stream: true })
      
      console.log(`Chunk ${chunkCount}: ${JSON.stringify(chunk)}`)
      console.log(`  Length: ${chunk.length}`)
      console.log(`  Content: "${chunk}"`)
      console.log('')
      
      if (chunkCount >= 5) {
        console.log('... (stopping after 5 chunks)')
        break
      }
    }
    
    console.log('─'.repeat(50))
    console.log(`📊 Total chunks received: ${chunkCount}`)
    
    // Test non-streaming response format
    console.log('\n📝 Testing non-streaming response format...')
    
    const nonStreamResponse = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        userId: 'test-user-123',
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Non-stream response status: ${nonStreamResponse.status}`)
    
    if (nonStreamResponse.ok) {
      const responseData = await nonStreamResponse.json()
      console.log(`📊 Response format:`)
      console.log(`  Type: ${typeof responseData}`)
      console.log(`  Keys: ${Object.keys(responseData).join(', ')}`)
      console.log(`  Message length: ${responseData.message?.length || 'N/A'}`)
      console.log(`  Cached: ${responseData.cached}`)
      console.log(`  Sources: ${responseData.sources?.join(', ')}`)
      console.log(`  Message preview: "${responseData.message?.substring(0, 100)}..."`)
    }
    
  } catch (error) {
    console.error('❌ Error testing response format:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  }
}

console.log('📊 Test Plan:')
console.log('  • Test streaming response format')
console.log('  • Test non-streaming response format')
console.log('  • Compare with expected frontend format')

testRAGResponseFormat()
