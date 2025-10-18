/**
 * 🧪 Simple RAG System Testing
 * Test if expected data is returned from RAG system
 */

console.log('🧪 Simple RAG System Testing...\n')

async function testRAGSystem() {
  const baseUrl = 'http://localhost:3000'
  
  // Test 1: Basic "hi" message
  console.log('🔍 Test 1: Basic greeting')
  try {
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'hi',
        messages: [],
        config: { navigationData: [] },
        currentUrl: baseUrl,
        cartState: { items: [], totalItems: 0, totalPrice: 0 },
        userId: 'test-user-simple'
      })
    })
    
    console.log(`  Status: ${response.status}`)
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      console.log(`  Content Length: ${content.length}`)
      console.log(`  Has Content: ${content.trim().length > 0 ? '✅' : '❌'}`)
      console.log(`  Content Preview: "${content.substring(0, 100)}..."`)
    } else {
      console.log(`  ❌ Request failed with status ${response.status}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 2: Personal information storage
  console.log('\n🔍 Test 2: Store personal information')
  try {
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'my name is anish suman',
        messages: [],
        config: { navigationData: [] },
        currentUrl: baseUrl,
        cartState: { items: [], totalItems: 0, totalPrice: 0 },
        userId: 'test-user-simple'
      })
    })
    
    console.log(`  Status: ${response.status}`)
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      console.log(`  Content Length: ${content.length}`)
      console.log(`  Has Content: ${content.trim().length > 0 ? '✅' : '❌'}`)
      console.log(`  Content Preview: "${content.substring(0, 100)}..."`)
    } else {
      console.log(`  ❌ Request failed with status ${response.status}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }

  // Wait a bit for data to be processed
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Test 3: Retrieve personal information
  console.log('\n🔍 Test 3: Retrieve personal information')
  try {
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'what is my name?',
        messages: [],
        config: { navigationData: [] },
        currentUrl: baseUrl,
        cartState: { items: [], totalItems: 0, totalPrice: 0 },
        userId: 'test-user-simple'
      })
    })
    
    console.log(`  Status: ${response.status}`)
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      console.log(`  Content Length: ${content.length}`)
      console.log(`  Has Content: ${content.trim().length > 0 ? '✅' : '❌'}`)
      console.log(`  Contains "anish": ${content.toLowerCase().includes('anish') ? '✅' : '❌'}`)
      console.log(`  Contains "suman": ${content.toLowerCase().includes('suman') ? '✅' : '❌'}`)
      console.log(`  Content Preview: "${content.substring(0, 150)}..."`)
    } else {
      console.log(`  ❌ Request failed with status ${response.status}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }

  // Test 4: Navigation request
  console.log('\n🔍 Test 4: Navigation request')
  try {
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'help me navigate to orders',
        messages: [],
        config: { navigationData: [
          { name: 'Orders', route: '/orders' },
          { name: 'Cart', route: '/cart' },
          { name: 'Publishers', route: '/publishers' }
        ]},
        currentUrl: baseUrl,
        cartState: { items: [], totalItems: 0, totalPrice: 0 },
        userId: 'test-user-simple'
      })
    })
    
    console.log(`  Status: ${response.status}`)
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      console.log(`  Content Length: ${content.length}`)
      console.log(`  Has Content: ${content.trim().length > 0 ? '✅' : '❌'}`)
      console.log(`  Contains navigation: ${content.includes('NAVIGATE') ? '✅' : '❌'}`)
      console.log(`  Content Preview: "${content.substring(0, 150)}..."`)
    } else {
      console.log(`  ❌ Request failed with status ${response.status}`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }

  console.log('\n✅ Simple RAG System Test Complete!')
}

// Run the test
testRAGSystem().catch(error => {
  console.error('❌ RAG testing failed:', error.message)
  process.exit(1)
})


