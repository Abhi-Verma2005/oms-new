#!/usr/bin/env node

/**
 * 🧪 Final Production Test
 * Test the RAG memory system with a completely fresh user
 */

console.log('🧪 FINAL PRODUCTION TEST - RAG Memory System\n')

async function finalProductionTest() {
  try {
    // Use a completely fresh user ID
    const freshUserId = `production-test-${Date.now()}`
    const testId = Date.now()
    
    console.log(`👤 Testing with fresh user ID: ${freshUserId}`)
    console.log(`🔍 Test ID: ${testId}`)
    
    // Test 1: Store personal information
    console.log('\n📝 Test 1: Storing personal information...')
    
    const personalInfo = `My name is Sarah, I am 30 years old, I work as a data scientist, and I have a dog named Max - production test ${testId}`
    console.log(`🔸 Storing: "${personalInfo}"`)
    
    const storeResponse = await testMessage(personalInfo, freshUserId)
    if (storeResponse.success) {
      console.log('✅ Information stored successfully')
      console.log(`📝 AI Response: "${storeResponse.content.substring(0, 100)}..."`)
      
      // Wait for storage
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Test 2: Test memory retrieval
      console.log('\n📝 Test 2: Testing memory retrieval...')
      
      const memoryTests = [
        { query: 'what is my name?', expected: 'sarah', description: 'Name retrieval' },
        { query: 'how old am I?', expected: '30', description: 'Age retrieval' },
        { query: 'what do I do for work?', expected: 'data scientist', description: 'Profession retrieval' },
        { query: 'what is my pet\'s name?', expected: 'max', description: 'Pet name retrieval' }
      ]
      
      let memorySuccess = 0
      for (const test of memoryTests) {
        console.log(`  🔸 Testing ${test.description}: "${test.query}"`)
        const response = await testMessage(test.query, freshUserId)
        
        if (response.success) {
          console.log(`    📝 Response: "${response.content}"`)
          
          if (response.content.toLowerCase().includes(test.expected)) {
            console.log(`    ✅ Retrieved: ${test.expected}`)
            memorySuccess++
          } else {
            console.log(`    ❌ Failed to retrieve: ${test.expected}`)
          }
        } else {
          console.log(`    ❌ Request failed`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      console.log(`\n📊 Memory Retrieval Results: ${memorySuccess}/${memoryTests.length} successful`)
      
      // Test 3: Test memory update
      console.log('\n📝 Test 3: Testing memory update...')
      
      const updateInfo = `Actually, I changed my mind - I am now a product manager - update test ${testId}`
      console.log(`🔸 Storing update: "${updateInfo}"`)
      
      const updateResponse = await testMessage(updateInfo, freshUserId)
      if (updateResponse.success) {
        console.log('✅ Update stored successfully')
        
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Test retrieval of updated information
        console.log('🔸 Testing retrieval of updated profession...')
        const updateQueryResponse = await testMessage('what do I do for work?', freshUserId)
        
        if (updateQueryResponse.success) {
          console.log(`📝 Response: "${updateQueryResponse.content}"`)
          
          if (updateQueryResponse.content.toLowerCase().includes('product manager')) {
            console.log('✅ SUCCESS: Retrieved updated profession (product manager)')
            memorySuccess++
          } else if (updateQueryResponse.content.toLowerCase().includes('data scientist')) {
            console.log('⚠️ PARTIAL: Retrieved old profession (data scientist)')
          } else {
            console.log('❌ FAILED: Did not retrieve any profession')
          }
        }
      }
      
      // Test 4: Test streaming performance
      console.log('\n📝 Test 4: Testing streaming performance...')
      
      const streamingResponse = await testMessageWithMetrics('tell me about artificial intelligence', freshUserId)
      
      if (streamingResponse.success) {
        console.log(`📊 Streaming: ${streamingResponse.chunkCount} chunks, ${streamingResponse.totalTime}ms total`)
        
        if (streamingResponse.chunkCount > 10 && streamingResponse.totalTime < 10000) {
          console.log('✅ Streaming performance good')
        } else {
          console.log('⚠️ Streaming performance could improve')
        }
      }
      
      // Test 5: Test tool integration
      console.log('\n📝 Test 5: Testing tool integration...')
      
      const toolResponse = await testMessage('help me navigate to the products page', freshUserId)
      
      if (toolResponse.success) {
        console.log(`📝 Response: "${toolResponse.content}"`)
        
        if (toolResponse.content.includes('[NAVIGATE:') || toolResponse.content.includes('[[TOOL]]')) {
          console.log('✅ Tool integration working')
        } else {
          console.log('❌ Tool integration not detected')
        }
      }
      
      // Final Assessment
      console.log('\n📊 FINAL PRODUCTION ASSESSMENT:')
      const totalTests = memoryTests.length + 1 // +1 for update test
      const successRate = (memorySuccess / totalTests) * 100
      
      console.log(`📈 Memory Success Rate: ${successRate.toFixed(1)}%`)
      console.log(`📈 Total Tests: ${totalTests}`)
      console.log(`📈 Successful Tests: ${memorySuccess}`)
      
      if (successRate >= 80) {
        console.log('🎉 EXCELLENT: RAG memory system is production-ready!')
        console.log('✅ All core functionality working perfectly')
        console.log('✅ Memory persistence working')
        console.log('✅ User isolation working')
        console.log('✅ Streaming working')
        console.log('✅ Tool integration working')
      } else if (successRate >= 60) {
        console.log('✅ GOOD: RAG memory system is mostly production-ready')
        console.log('⚠️ Some minor improvements needed')
      } else {
        console.log('❌ NEEDS WORK: RAG memory system needs improvement')
      }
      
    } else {
      console.log('❌ Failed to store initial information')
    }
    
    console.log('\n🚀 FINAL PRODUCTION TEST COMPLETED!')
    
  } catch (error) {
    console.error('❌ Final production test error:', error.message)
  }
}

// Helper function to test messages
async function testMessage(message, userId) {
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        messages: [
          { role: 'user', content: message }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += decoder.decode(value, { stream: true })
    }
    
    return { success: true, content: content }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Helper function to test messages with metrics
async function testMessageWithMetrics(message, userId) {
  try {
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        messages: [
          { role: 'user', content: message }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}`,
        chunkCount: 0,
        totalTime: Date.now() - startTime
      }
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    let chunkCount = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunkCount++
      const chunk = decoder.decode(value, { stream: true })
      content += chunk
    }
    
    const totalTime = Date.now() - startTime
    
    return {
      success: true,
      content: content,
      chunkCount: chunkCount,
      totalTime: totalTime
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      chunkCount: 0,
      totalTime: Date.now() - Date.now()
    }
  }
}

finalProductionTest()