#!/usr/bin/env node

/**
 * 🧪 Test RAG API Streaming
 * Tests the actual RAG API endpoint with streaming
 */

// Using built-in fetch (Node.js 18+)

console.log('🧪 Testing RAG API Streaming...\n')

async function testRAGAPIStreaming() {
  try {
    console.log('🔍 Testing RAG API streaming endpoint...')
    
    // Test data
    const testMessage = 'How can I improve my website SEO?'
    const testUserId = 'test-user-123'
    
    console.log(`📝 Test message: "${testMessage}"`)
    console.log(`👤 Test user ID: ${testUserId}`)
    
    // Make streaming request
    const response = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
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
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      console.error(`📝 Error details: ${errorText}`)
      return
    }
    
    // Handle streaming response
    console.log('\n📡 Streaming response:')
    console.log('─'.repeat(50))
    
    let fullResponse = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }
      
      const chunk = decoder.decode(value, { stream: true })
      fullResponse += chunk
      
      // Print each chunk as it arrives
      process.stdout.write(chunk)
    }
    
    console.log('\n' + '─'.repeat(50))
    console.log(`📊 Full response length: ${fullResponse.length} characters`)
    console.log(`📝 Response preview: "${fullResponse.substring(0, 100)}..."`)
    
    // Test non-streaming request
    console.log('\n🔍 Testing non-streaming RAG API...')
    
    const nonStreamResponse = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What are your pricing plans?',
        userId: testUserId,
        messages: [
          { role: 'user', content: 'What are your pricing plans?' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Non-stream response status: ${nonStreamResponse.status}`)
    
    if (nonStreamResponse.ok) {
      const nonStreamText = await nonStreamResponse.text()
      console.log(`📊 Non-stream response length: ${nonStreamText.length} characters`)
      console.log(`📝 Non-stream response preview: "${nonStreamText.substring(0, 100)}..."`)
    } else {
      const errorText = await nonStreamResponse.text()
      console.error(`❌ Non-stream API Error: ${nonStreamResponse.status}`)
      console.error(`📝 Error details: ${errorText}`)
    }
    
    console.log('\n✅ RAG API streaming test completed!')
    
  } catch (error) {
    console.error('❌ Error testing RAG API:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  }
}

console.log('📊 Test Plan:')
console.log('  • Test streaming RAG API endpoint')
console.log('  • Test non-streaming RAG API endpoint')
console.log('  • Verify response handling')
console.log('  • Check for errors')

testRAGAPIStreaming()
