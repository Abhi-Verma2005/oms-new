#!/usr/bin/env node

/**
 * 🧪 Comprehensive RAG Sidebar Test
 * Thoroughly test the RAG system with AI sidebar chatbot including streaming
 */

console.log('🧪 Comprehensive RAG Sidebar Test...\n')

async function comprehensiveRAGSidebarTest() {
  try {
    console.log('🔍 Testing RAG system integration with AI sidebar chatbot...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    let testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      details: []
    }
    
    // Test 1: Basic Memory Test
    console.log('\n📝 Test 1: Basic Memory Test')
    testResults.totalTests++
    
    try {
      // Step 1: Tell AI about preferences
      console.log('  🔸 Step 1: Sharing personal preferences...')
      const preferenceMessage = 'my favorite color is blue and I love chocolate ice cream'
      
      const prefResponse = await testStreamingMessage(preferenceMessage, testUserId)
      if (prefResponse.success) {
        console.log('  ✅ Preferences shared successfully')
        
        // Wait for storage
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Step 2: Ask about preferences
        console.log('  🔸 Step 2: Asking about preferences...')
        const askMessage = 'what are my favorite things?'
        const askResponse = await testStreamingMessage(askMessage, testUserId)
        
        if (askResponse.success && 
            (askResponse.content.toLowerCase().includes('blue') || 
             askResponse.content.toLowerCase().includes('chocolate'))) {
          console.log('  ✅ AI remembered preferences!')
          testResults.passedTests++
          testResults.details.push('✅ Basic Memory Test: PASSED')
        } else {
          console.log('  ❌ AI did not remember preferences')
          testResults.failedTests++
          testResults.details.push('❌ Basic Memory Test: FAILED - No memory retention')
        }
      } else {
        console.log('  ❌ Failed to share preferences')
        testResults.failedTests++
        testResults.details.push('❌ Basic Memory Test: FAILED - Could not share preferences')
      }
    } catch (error) {
      console.log(`  ❌ Basic Memory Test Error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Basic Memory Test: ERROR - ${error.message}`)
    }
    
    // Test 2: Multiple Conversation Threads
    console.log('\n📝 Test 2: Multiple Conversation Threads')
    testResults.totalTests++
    
    try {
      // Share multiple pieces of information
      const conversations = [
        'I work as a software developer',
        'I have a pet cat named Whiskers',
        'I live in New York City',
        'My favorite programming language is Python'
      ]
      
      console.log('  🔸 Sharing multiple conversation topics...')
      for (const conversation of conversations) {
        const response = await testStreamingMessage(conversation, testUserId)
        if (!response.success) {
          throw new Error(`Failed to process: ${conversation}`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait between messages
      }
      
      // Test retrieval of specific information
      console.log('  🔸 Testing retrieval of specific information...')
      const retrievalTests = [
        { question: 'what do I do for work?', expected: 'software developer' },
        { question: 'what is my pet\'s name?', expected: 'whiskers' },
        { question: 'where do I live?', expected: 'new york' },
        { question: 'what programming language do I like?', expected: 'python' }
      ]
      
      let retrievalPassed = 0
      for (const test of retrievalTests) {
        const response = await testStreamingMessage(test.question, testUserId)
        if (response.success && response.content.toLowerCase().includes(test.expected.toLowerCase())) {
          console.log(`    ✅ Remembered: ${test.expected}`)
          retrievalPassed++
        } else {
          console.log(`    ❌ Failed to remember: ${test.expected}`)
        }
      }
      
      if (retrievalPassed >= 3) {
        console.log('  ✅ Multiple conversation threads working!')
        testResults.passedTests++
        testResults.details.push('✅ Multiple Conversation Threads: PASSED')
      } else {
        console.log('  ❌ Multiple conversation threads partially working')
        testResults.failedTests++
        testResults.details.push('❌ Multiple Conversation Threads: PARTIAL')
      }
    } catch (error) {
      console.log(`  ❌ Multiple Conversation Threads Error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Multiple Conversation Threads: ERROR - ${error.message}`)
    }
    
    // Test 3: Streaming Performance
    console.log('\n📝 Test 3: Streaming Performance')
    testResults.totalTests++
    
    try {
      const streamingMessage = 'tell me a detailed story about a magical forest'
      console.log('  🔸 Testing streaming performance...')
      
      const response = await testStreamingMessage(streamingMessage, testUserId, true)
      if (response.success) {
        if (response.chunkCount > 10 && response.firstChunkTime < 5000) {
          console.log('  ✅ Streaming performance good!')
          console.log(`    📊 Chunks: ${response.chunkCount}, First chunk: ${response.firstChunkTime}ms`)
          testResults.passedTests++
          testResults.details.push('✅ Streaming Performance: PASSED')
        } else {
          console.log('  ⚠️ Streaming performance could be better')
          testResults.failedTests++
          testResults.details.push('⚠️ Streaming Performance: NEEDS IMPROVEMENT')
        }
      } else {
        console.log('  ❌ Streaming test failed')
        testResults.failedTests++
        testResults.details.push('❌ Streaming Performance: FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Streaming Performance Error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Streaming Performance: ERROR - ${error.message}`)
    }
    
    // Test 4: Edge Cases
    console.log('\n📝 Test 4: Edge Cases')
    testResults.totalTests++
    
    try {
      const edgeCases = [
        { message: '', description: 'Empty message' },
        { message: 'a'.repeat(1000), description: 'Very long message' },
        { message: 'What is 2+2?', description: 'Mathematical question' },
        { message: 'Tell me about quantum physics', description: 'Complex topic' }
      ]
      
      let edgeCasePassed = 0
      for (const testCase of edgeCases) {
        const response = await testStreamingMessage(testCase.message, testUserId)
        if (response.success) {
          console.log(`    ✅ Handled: ${testCase.description}`)
          edgeCasePassed++
        } else {
          console.log(`    ❌ Failed: ${testCase.description}`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (edgeCasePassed >= 3) {
        console.log('  ✅ Edge cases handled well!')
        testResults.passedTests++
        testResults.details.push('✅ Edge Cases: PASSED')
      } else {
        console.log('  ⚠️ Some edge cases need improvement')
        testResults.failedTests++
        testResults.details.push('⚠️ Edge Cases: PARTIAL')
      }
    } catch (error) {
      console.log(`  ❌ Edge Cases Error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Edge Cases: ERROR - ${error.message}`)
    }
    
    // Test 5: Tool Integration
    console.log('\n📝 Test 5: Tool Integration')
    testResults.totalTests++
    
    try {
      const toolMessage = 'help me navigate to the products page'
      console.log('  🔸 Testing tool integration...')
      
      const response = await testStreamingMessage(toolMessage, testUserId)
      if (response.success) {
        if (response.content.includes('[NAVIGATE:') || response.content.includes('[[TOOL]]')) {
          console.log('  ✅ Tool integration working!')
          testResults.passedTests++
          testResults.details.push('✅ Tool Integration: PASSED')
        } else {
          console.log('  ⚠️ Tool integration not detected')
          testResults.failedTests++
          testResults.details.push('⚠️ Tool Integration: NOT DETECTED')
        }
      } else {
        console.log('  ❌ Tool integration test failed')
        testResults.failedTests++
        testResults.details.push('❌ Tool Integration: FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Tool Integration Error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Tool Integration: ERROR - ${error.message}`)
    }
    
    // Final Results
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:')
    console.log(`  Total Tests: ${testResults.totalTests}`)
    console.log(`  Passed: ${testResults.passedTests}`)
    console.log(`  Failed: ${testResults.failedTests}`)
    console.log(`  Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`)
    
    console.log('\n📋 Detailed Results:')
    testResults.details.forEach(detail => console.log(`  ${detail}`))
    
    if (testResults.passedTests >= testResults.totalTests * 0.8) {
      console.log('\n🎉 RAG SYSTEM IS PRODUCTION READY!')
    } else {
      console.log('\n⚠️ RAG SYSTEM NEEDS IMPROVEMENTS')
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test error:', error.message)
  }
}

// Helper function to test streaming messages
async function testStreamingMessage(message, userId, detailed = false) {
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
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    let chunkCount = 0
    let firstChunkTime = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      chunkCount++
      const chunk = decoder.decode(value, { stream: true })
      content += chunk
      
      if (chunkCount === 1) {
        firstChunkTime = Date.now() - startTime
      }
      
      if (detailed && chunkCount <= 3) {
        console.log(`    📦 Chunk ${chunkCount}: "${chunk.substring(0, 30)}..."`)
      }
    }
    
    const totalTime = Date.now() - startTime
    
    if (detailed) {
      console.log(`    📊 Total time: ${totalTime}ms, Chunks: ${chunkCount}`)
    }
    
    return {
      success: true,
      content: content,
      chunkCount: chunkCount,
      firstChunkTime: firstChunkTime,
      totalTime: totalTime
    }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

comprehensiveRAGSidebarTest()
