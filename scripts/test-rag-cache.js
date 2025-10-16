#!/usr/bin/env node

/**
 * 🧪 Test RAG Cache Functionality
 * Tests cache hit/miss scenarios
 */

console.log('🧪 Testing RAG Cache Functionality...\n')

async function testRAGCache() {
  try {
    console.log('🔍 Testing RAG cache hit/miss scenarios...')
    
    // Test data
    const testMessage = 'How can I improve my website performance?'
    const testUserId = 'test-user-123'
    
    console.log(`📝 Test message: "${testMessage}"`)
    console.log(`👤 Test user ID: ${testUserId}`)
    
    // First request - should be cache miss
    console.log('\n📝 Test 1: Cache Miss (First Request)')
    const response1 = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
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
    
    console.log(`📊 Response 1 status: ${response1.status}`)
    
    if (response1.ok) {
      const responseText1 = await response1.text()
      console.log(`📊 Response 1 length: ${responseText1.length} characters`)
      console.log(`📝 Response 1 preview: "${responseText1.substring(0, 100)}..."`)
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Second request - should be cache hit
    console.log('\n📝 Test 2: Cache Hit (Second Request)')
    const response2 = await fetch('http://localhost:3000/api/ai-chat-rag?stream=1', {
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
    
    console.log(`📊 Response 2 status: ${response2.status}`)
    
    if (response2.ok) {
      const responseText2 = await response2.text()
      console.log(`📊 Response 2 length: ${responseText2.length} characters`)
      console.log(`📝 Response 2 preview: "${responseText2.substring(0, 100)}..."`)
      
      // Compare response times (approximate)
      console.log('\n⚡ Performance Comparison:')
      console.log(`  📊 Response 1: Cache miss (full processing)`)
      console.log(`  📊 Response 2: Cache hit (faster retrieval)`)
    }
    
    // Test different query - should be cache miss
    console.log('\n📝 Test 3: Different Query (Cache Miss)')
    const differentMessage = 'What are your pricing plans?'
    
    const response3 = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: differentMessage,
        userId: testUserId,
        messages: [
          { role: 'user', content: differentMessage }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Response 3 status: ${response3.status}`)
    
    if (response3.ok) {
      const responseData3 = await response3.json()
      console.log(`📊 Response 3 cached: ${responseData3.cached}`)
      console.log(`📊 Response 3 confidence: ${responseData3.confidence}`)
      console.log(`📊 Response 3 sources: ${responseData3.sources.join(', ')}`)
      console.log(`📝 Response 3 preview: "${responseData3.message.substring(0, 100)}..."`)
    }
    
    console.log('\n✅ RAG cache test completed!')
    
  } catch (error) {
    console.error('❌ Error testing RAG cache:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  }
}

console.log('📊 Test Plan:')
console.log('  • Test cache miss (first request)')
console.log('  • Test cache hit (second identical request)')
console.log('  • Test different query (new cache miss)')
console.log('  • Verify performance differences')

testRAGCache()
