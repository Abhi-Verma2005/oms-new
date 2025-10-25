#!/usr/bin/env node

// Test script for minimal AI chat implementation
console.log('🧪 Testing Minimal AI Chat Implementation\n')

const tests = [
  {
    name: 'Basic Chat',
    messages: [{ role: 'user', content: 'Hello, can you help me?' }]
  },
  {
    name: 'Filter Request',
    messages: [{ role: 'user', content: 'Show me websites with DA above 50 and spam score below 3' }]
  },
  {
    name: 'Navigation Request',
    messages: [{ role: 'user', content: 'Take me to the publishers page' }]
  },
  {
    name: 'Cart Request',
    messages: [{ role: 'user', content: 'Add website ID 123 to my cart' }]
  }
]

async function runTest(test) {
  console.log(`📝 Testing: ${test.name}`)
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: test.messages,
        userId: 'test-user-123'
      })
    })
    
    if (!response.ok) {
      console.error(`❌ FAIL: HTTP ${response.status}`)
      const text = await response.text()
      console.error(`   Error: ${text}`)
      return false
    }
    
    console.log(`✅ PASS: ${test.name}`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Headers: ${response.headers.get('content-type')}`)
    
    // Read a bit of the stream to verify it's working
    const reader = response.body.getReader()
    const { value } = await reader.read()
    if (value) {
      const text = new TextDecoder().decode(value)
      console.log(`   Response preview: ${text.slice(0, 100)}...`)
    }
    reader.cancel()
    
    return true
  } catch (error) {
    console.error(`❌ FAIL: ${error.message}`)
    return false
  }
}

async function main() {
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await runTest(test)
    if (result) {
      passed++
    } else {
      failed++
    }
    console.log('')
  }
  
  console.log('📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Total: ${tests.length}`)
  console.log(`   🎯 Success Rate: ${Math.round((passed / tests.length) * 100)}%`)
  
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)


