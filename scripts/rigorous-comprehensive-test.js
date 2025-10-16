#!/usr/bin/env node

/**
 * 🧪 Rigorous Comprehensive Test Suite
 * Thorough, detailed, and rigorous testing of the entire RAG system with AI sidebar chatbot
 */

console.log('🧪 RIGOROUS COMPREHENSIVE TEST SUITE - RAG SYSTEM WITH AI SIDEBAR\n')

async function rigorousComprehensiveTest() {
  try {
    console.log('🚀 Starting rigorous comprehensive testing...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testSessionId = Date.now()
    
    const testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      performanceMetrics: [],
      memoryTests: [],
      streamingTests: [],
      toolTests: [],
      edgeCaseTests: [],
      details: []
    }
    
    // ========================================
    // TEST SUITE 1: MEMORY SYSTEM RIGOROUS TESTING
    // ========================================
    
    console.log('\n📋 TEST SUITE 1: MEMORY SYSTEM RIGOROUS TESTING')
    console.log('=' * 60)
    
    // Test 1.1: Basic Memory Storage and Retrieval
    console.log('\n🧠 Test 1.1: Basic Memory Storage and Retrieval')
    testResults.totalTests++
    
    try {
      const basicMemoryInfo = `My name is Alice, I'm 25 years old, I work as a UX designer, and I have a golden retriever named Buddy - basic test ${testSessionId}`
      
      console.log('  🔸 Storing basic personal information...')
      const storeResponse = await testMessageWithMetrics(basicMemoryInfo, testUserId)
      
      if (storeResponse.success) {
        console.log('  ✅ Basic information stored successfully')
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Test retrieval with multiple query variations
        const retrievalTests = [
          { query: 'what is my name?', expected: 'alice' },
          { query: 'how old am I?', expected: '25' },
          { query: 'what do I do for work?', expected: 'ux designer' },
          { query: 'what is my pet\'s name?', expected: 'buddy' }
        ]
        
        let retrievalSuccess = 0
        for (const test of retrievalTests) {
          console.log(`  🔸 Testing retrieval: "${test.query}"`)
          const response = await testMessageWithMetrics(test.query, testUserId)
          
          if (response.success && response.content.toLowerCase().includes(test.expected)) {
            console.log(`    ✅ Retrieved: ${test.expected}`)
            retrievalSuccess++
          } else {
            console.log(`    ❌ Failed to retrieve: ${test.expected}`)
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        testResults.memoryTests.push({
          test: 'Basic Memory Storage and Retrieval',
          success: retrievalSuccess >= 3,
          details: `${retrievalSuccess}/4 retrieval tests passed`
        })
        
        if (retrievalSuccess >= 3) {
          console.log('  ✅ Basic memory system working!')
          testResults.passedTests++
          testResults.details.push('✅ Test 1.1: Basic Memory - PASSED')
        } else {
          console.log('  ❌ Basic memory system needs improvement')
          testResults.failedTests++
          testResults.details.push('❌ Test 1.1: Basic Memory - FAILED')
        }
      } else {
        console.log('  ❌ Failed to store basic information')
        testResults.failedTests++
        testResults.details.push('❌ Test 1.1: Basic Memory - FAILED - Storage issue')
      }
    } catch (error) {
      console.log(`  ❌ Basic memory test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 1.1: Basic Memory - ERROR - ${error.message}`)
    }
    
    // Test 1.2: Memory Persistence Across Different Query Types
    console.log('\n🧠 Test 1.2: Memory Persistence Across Different Query Types')
    testResults.totalTests++
    
    try {
      const persistenceInfo = `I love playing tennis on weekends and my favorite movie is The Matrix - persistence test ${testSessionId}`
      
      console.log('  🔸 Storing persistence test information...')
      const storeResponse = await testMessageWithMetrics(persistenceInfo, testUserId)
      
      if (storeResponse.success) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Test different query types
        const queryTypes = [
          { type: 'Direct', query: 'what do I love playing?', expected: 'tennis' },
          { type: 'Indirect', query: 'what are my hobbies?', expected: 'tennis' },
          { type: 'Contextual', query: 'tell me about my weekend activities', expected: 'tennis' },
          { type: 'Specific', query: 'what is my favorite movie?', expected: 'matrix' }
        ]
        
        let queryTypeSuccess = 0
        for (const test of queryTypes) {
          console.log(`  🔸 Testing ${test.type} query: "${test.query}"`)
          const response = await testMessageWithMetrics(test.query, testUserId)
          
          if (response.success && response.content.toLowerCase().includes(test.expected)) {
            console.log(`    ✅ ${test.type} query successful`)
            queryTypeSuccess++
          } else {
            console.log(`    ❌ ${test.type} query failed`)
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        if (queryTypeSuccess >= 3) {
          console.log('  ✅ Memory persistence across query types working!')
          testResults.passedTests++
          testResults.details.push('✅ Test 1.2: Memory Persistence - PASSED')
        } else {
          console.log('  ❌ Memory persistence needs improvement')
          testResults.failedTests++
          testResults.details.push('❌ Test 1.2: Memory Persistence - FAILED')
        }
      } else {
        console.log('  ❌ Failed to store persistence test information')
        testResults.failedTests++
        testResults.details.push('❌ Test 1.2: Memory Persistence - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Memory persistence test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 1.2: Memory Persistence - ERROR - ${error.message}`)
    }
    
    // Test 1.3: Memory Update and Override
    console.log('\n🧠 Test 1.3: Memory Update and Override')
    testResults.totalTests++
    
    try {
      // Store initial information
      const initialInfo = `I live in San Francisco - initial ${testSessionId}`
      console.log('  🔸 Storing initial information...')
      await testMessageWithMetrics(initialInfo, testUserId)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update with new information
      const updatedInfo = `Actually, I moved to New York City last month - updated ${testSessionId}`
      console.log('  🔸 Storing updated information...')
      await testMessageWithMetrics(updatedInfo, testUserId)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test retrieval of updated information
      console.log('  🔸 Testing retrieval of updated information...')
      const response = await testMessageWithMetrics('where do I live?', testUserId)
      
      if (response.success) {
        if (response.content.toLowerCase().includes('new york')) {
          console.log('  ✅ Memory update successful - retrieved new location')
          testResults.passedTests++
          testResults.details.push('✅ Test 1.3: Memory Update - PASSED')
        } else if (response.content.toLowerCase().includes('san francisco')) {
          console.log('  ⚠️ Memory update partial - retrieved old location')
          testResults.failedTests++
          testResults.details.push('⚠️ Test 1.3: Memory Update - PARTIAL')
        } else {
          console.log('  ❌ Memory update failed - no location retrieved')
          testResults.failedTests++
          testResults.details.push('❌ Test 1.3: Memory Update - FAILED')
        }
      } else {
        console.log('  ❌ Failed to retrieve updated information')
        testResults.failedTests++
        testResults.details.push('❌ Test 1.3: Memory Update - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Memory update test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 1.3: Memory Update - ERROR - ${error.message}`)
    }
    
    // ========================================
    // TEST SUITE 2: STREAMING PERFORMANCE RIGOROUS TESTING
    // ========================================
    
    console.log('\n📋 TEST SUITE 2: STREAMING PERFORMANCE RIGOROUS TESTING')
    console.log('=' * 60)
    
    // Test 2.1: Streaming Speed and Consistency
    console.log('\n⚡ Test 2.1: Streaming Speed and Consistency')
    testResults.totalTests++
    
    try {
      const streamingTests = [
        { message: 'tell me a short story', expectedChunks: 10, maxFirstChunk: 5000 },
        { message: 'explain quantum computing', expectedChunks: 15, maxFirstChunk: 8000 },
        { message: 'give me a recipe for pasta', expectedChunks: 12, maxFirstChunk: 6000 }
      ]
      
      let streamingSuccess = 0
      for (const test of streamingTests) {
        console.log(`  🔸 Testing streaming: "${test.message}"`)
        const response = await testMessageWithMetrics(test.message, testUserId, true)
        
        if (response.success) {
          const performance = {
            message: test.message,
            chunks: response.chunkCount,
            firstChunk: response.firstChunkTime,
            totalTime: response.totalTime,
            chunksPerSecond: response.chunkCount / (response.totalTime / 1000)
          }
          
          testResults.performanceMetrics.push(performance)
          
          console.log(`    📊 Chunks: ${response.chunkCount}, First: ${response.firstChunkTime}ms, Total: ${response.totalTime}ms`)
          
          if (response.chunkCount >= test.expectedChunks && 
              response.firstChunkTime <= test.maxFirstChunk) {
            console.log(`    ✅ Streaming performance good`)
            streamingSuccess++
          } else {
            console.log(`    ⚠️ Streaming performance could improve`)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      testResults.streamingTests.push({
        test: 'Streaming Speed and Consistency',
        success: streamingSuccess >= 2,
        details: `${streamingSuccess}/3 streaming tests passed`
      })
      
      if (streamingSuccess >= 2) {
        console.log('  ✅ Streaming performance is good!')
        testResults.passedTests++
        testResults.details.push('✅ Test 2.1: Streaming Performance - PASSED')
      } else {
        console.log('  ❌ Streaming performance needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 2.1: Streaming Performance - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Streaming performance test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 2.1: Streaming Performance - ERROR - ${error.message}`)
    }
    
    // Test 2.2: Streaming Error Handling
    console.log('\n⚡ Test 2.2: Streaming Error Handling')
    testResults.totalTests++
    
    try {
      const errorTests = [
        { message: '', description: 'Empty message' },
        { message: 'a'.repeat(2000), description: 'Very long message' },
        { message: 'test\n\n\n\n\n', description: 'Message with newlines' }
      ]
      
      let errorHandlingSuccess = 0
      for (const test of errorTests) {
        console.log(`  🔸 Testing error handling: ${test.description}`)
        const response = await testMessageWithMetrics(test.message, testUserId)
        
        if (response.success && response.content.length > 0) {
          console.log(`    ✅ Handled gracefully: ${test.description}`)
          errorHandlingSuccess++
        } else {
          console.log(`    ❌ Failed to handle: ${test.description}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (errorHandlingSuccess >= 2) {
        console.log('  ✅ Streaming error handling is robust!')
        testResults.passedTests++
        testResults.details.push('✅ Test 2.2: Streaming Error Handling - PASSED')
      } else {
        console.log('  ❌ Streaming error handling needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 2.2: Streaming Error Handling - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Streaming error handling test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 2.2: Streaming Error Handling - ERROR - ${error.message}`)
    }
    
    // ========================================
    // TEST SUITE 3: TOOL INTEGRATION RIGOROUS TESTING
    // ========================================
    
    console.log('\n📋 TEST SUITE 3: TOOL INTEGRATION RIGOROUS TESTING')
    console.log('=' * 60)
    
    // Test 3.1: Navigation Tool Integration
    console.log('\n🛠️ Test 3.1: Navigation Tool Integration')
    testResults.totalTests++
    
    try {
      const navigationTests = [
        { message: 'help me navigate to the products page', expectedTool: 'navigate' },
        { message: 'take me to the cart', expectedTool: 'navigate' },
        { message: 'go to the homepage', expectedTool: 'navigate' }
      ]
      
      let navigationSuccess = 0
      for (const test of navigationTests) {
        console.log(`  🔸 Testing navigation: "${test.message}"`)
        const response = await testMessageWithMetrics(test.message, testUserId)
        
        if (response.success) {
          const hasNavigationTool = response.content.includes('[NAVIGATE:') || 
                                   response.content.includes('[[TOOL]]')
          
          if (hasNavigationTool) {
            console.log(`    ✅ Navigation tool detected`)
            navigationSuccess++
          } else {
            console.log(`    ❌ Navigation tool not detected`)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      testResults.toolTests.push({
        test: 'Navigation Tool Integration',
        success: navigationSuccess >= 2,
        details: `${navigationSuccess}/3 navigation tests passed`
      })
      
      if (navigationSuccess >= 2) {
        console.log('  ✅ Navigation tool integration working!')
        testResults.passedTests++
        testResults.details.push('✅ Test 3.1: Navigation Tool - PASSED')
      } else {
        console.log('  ❌ Navigation tool integration needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 3.1: Navigation Tool - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Navigation tool test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 3.1: Navigation Tool - ERROR - ${error.message}`)
    }
    
    // Test 3.2: Cart Tool Integration
    console.log('\n🛠️ Test 3.2: Cart Tool Integration')
    testResults.totalTests++
    
    try {
      const cartTests = [
        { message: 'show me my cart', expectedTool: 'viewCart' },
        { message: 'what\'s in my shopping cart?', expectedTool: 'viewCart' },
        { message: 'clear my cart', expectedTool: 'clearCart' }
      ]
      
      let cartSuccess = 0
      for (const test of cartTests) {
        console.log(`  🔸 Testing cart: "${test.message}"`)
        const response = await testMessageWithMetrics(test.message, testUserId)
        
        if (response.success) {
          const hasCartTool = response.content.includes('[VIEW_CART]') || 
                             response.content.includes('[CLEAR_CART]') ||
                             response.content.includes('[[TOOL]]')
          
          if (hasCartTool) {
            console.log(`    ✅ Cart tool detected`)
            cartSuccess++
          } else {
            console.log(`    ❌ Cart tool not detected`)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (cartSuccess >= 2) {
        console.log('  ✅ Cart tool integration working!')
        testResults.passedTests++
        testResults.details.push('✅ Test 3.2: Cart Tool - PASSED')
      } else {
        console.log('  ❌ Cart tool integration needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 3.2: Cart Tool - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Cart tool test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 3.2: Cart Tool - ERROR - ${error.message}`)
    }
    
    // ========================================
    // TEST SUITE 4: EDGE CASES RIGOROUS TESTING
    // ========================================
    
    console.log('\n📋 TEST SUITE 4: EDGE CASES RIGOROUS TESTING')
    console.log('=' * 60)
    
    // Test 4.1: Extreme Input Cases
    console.log('\n🔍 Test 4.1: Extreme Input Cases')
    testResults.totalTests++
    
    try {
      const extremeTests = [
        { message: 'a', description: 'Single character' },
        { message: 'a'.repeat(5000), description: 'Very long message (5000 chars)' },
        { message: '🚀🎉💻🔥⭐', description: 'Emoji only message' },
        { message: 'SELECT * FROM users; DROP TABLE users;', description: 'SQL injection attempt' },
        { message: '<script>alert("xss")</script>', description: 'XSS attempt' }
      ]
      
      let extremeSuccess = 0
      for (const test of extremeTests) {
        console.log(`  🔸 Testing extreme case: ${test.description}`)
        const response = await testMessageWithMetrics(test.message, testUserId)
        
        if (response.success && response.content.length > 0) {
          console.log(`    ✅ Handled gracefully: ${test.description}`)
          extremeSuccess++
        } else {
          console.log(`    ❌ Failed to handle: ${test.description}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      testResults.edgeCaseTests.push({
        test: 'Extreme Input Cases',
        success: extremeSuccess >= 4,
        details: `${extremeSuccess}/5 extreme cases handled`
      })
      
      if (extremeSuccess >= 4) {
        console.log('  ✅ Extreme input handling is robust!')
        testResults.passedTests++
        testResults.details.push('✅ Test 4.1: Extreme Input Cases - PASSED')
      } else {
        console.log('  ❌ Extreme input handling needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 4.1: Extreme Input Cases - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Extreme input test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 4.1: Extreme Input Cases - ERROR - ${error.message}`)
    }
    
    // Test 4.2: Concurrent Usage Simulation
    console.log('\n🔍 Test 4.2: Concurrent Usage Simulation')
    testResults.totalTests++
    
    try {
      console.log('  🔸 Simulating concurrent requests...')
      
      const concurrentRequests = [
        'what is my name?',
        'tell me about my work',
        'what are my hobbies?',
        'help me navigate to products'
      ]
      
      const promises = concurrentRequests.map((message, index) => {
        return new Promise(async (resolve) => {
          setTimeout(async () => {
            const response = await testMessageWithMetrics(message, testUserId)
            resolve({ 
              index, 
              message: message.substring(0, 30),
              success: response.success,
              responseTime: response.totalTime
            })
          }, index * 200) // Stagger requests by 200ms
        })
      })
      
      const results = await Promise.all(promises)
      const successfulRequests = results.filter(r => r.success).length
      
      console.log(`  📊 Concurrent results: ${successfulRequests}/${results.length} successful`)
      results.forEach((result, index) => {
        console.log(`    ${index + 1}. "${result.message}...": ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`)
      })
      
      if (successfulRequests >= 3) {
        console.log('  ✅ Concurrent usage handled well!')
        testResults.passedTests++
        testResults.details.push('✅ Test 4.2: Concurrent Usage - PASSED')
      } else {
        console.log('  ❌ Concurrent usage needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 4.2: Concurrent Usage - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ Concurrent usage test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 4.2: Concurrent Usage - ERROR - ${error.message}`)
    }
    
    // ========================================
    // TEST SUITE 5: INTEGRATION AND END-TO-END TESTING
    // ========================================
    
    console.log('\n📋 TEST SUITE 5: INTEGRATION AND END-TO-END TESTING')
    console.log('=' * 60)
    
    // Test 5.1: Complete User Journey Simulation
    console.log('\n🔄 Test 5.1: Complete User Journey Simulation')
    testResults.totalTests++
    
    try {
      console.log('  🔸 Simulating complete user journey...')
      
      const userJourney = [
        { step: 'Introduction', message: 'Hi, I\'m new here. My name is Charlie and I love photography.' },
        { step: 'Question', message: 'What can you help me with?' },
        { step: 'Navigation', message: 'Can you help me find the products page?' },
        { step: 'Memory Test', message: 'What did I tell you about my hobby?' },
        { step: 'Complex Query', message: 'Based on what you know about me, what products might I be interested in?' }
      ]
      
      let journeySuccess = 0
      for (const step of userJourney) {
        console.log(`  🔸 ${step.step}: "${step.message}"`)
        const response = await testMessageWithMetrics(step.message, testUserId)
        
        if (response.success) {
          console.log(`    ✅ ${step.step} successful`)
          journeySuccess++
          
          // Special validation for memory test
          if (step.step === 'Memory Test' && response.content.toLowerCase().includes('photography')) {
            console.log(`    ✅ Memory retention verified`)
          }
        } else {
          console.log(`    ❌ ${step.step} failed`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      if (journeySuccess >= 4) {
        console.log('  ✅ Complete user journey successful!')
        testResults.passedTests++
        testResults.details.push('✅ Test 5.1: User Journey - PASSED')
      } else {
        console.log('  ❌ User journey needs improvement')
        testResults.failedTests++
        testResults.details.push('❌ Test 5.1: User Journey - FAILED')
      }
    } catch (error) {
      console.log(`  ❌ User journey test error: ${error.message}`)
      testResults.failedTests++
      testResults.details.push(`❌ Test 5.1: User Journey - ERROR - ${error.message}`)
    }
    
    // ========================================
    // FINAL RESULTS AND ANALYSIS
    // ========================================
    
    console.log('\n📊 RIGOROUS COMPREHENSIVE TEST RESULTS')
    console.log('=' * 60)
    
    console.log(`📈 Overall Statistics:`)
    console.log(`  Total Tests: ${testResults.totalTests}`)
    console.log(`  Passed: ${testResults.passedTests}`)
    console.log(`  Failed: ${testResults.failedTests}`)
    console.log(`  Skipped: ${testResults.skippedTests}`)
    console.log(`  Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`)
    
    console.log('\n📋 Detailed Test Results:')
    testResults.details.forEach(detail => console.log(`  ${detail}`))
    
    console.log('\n📊 Performance Metrics:')
    testResults.performanceMetrics.forEach(metric => {
      console.log(`  📈 "${metric.message}...": ${metric.chunks} chunks, ${metric.firstChunk}ms first chunk, ${metric.totalTime}ms total`)
    })
    
    console.log('\n🧠 Memory System Analysis:')
    testResults.memoryTests.forEach(test => {
      console.log(`  🧠 ${test.test}: ${test.success ? '✅' : '❌'} - ${test.details}`)
    })
    
    console.log('\n⚡ Streaming Analysis:')
    testResults.streamingTests.forEach(test => {
      console.log(`  ⚡ ${test.test}: ${test.success ? '✅' : '❌'} - ${test.details}`)
    })
    
    console.log('\n🛠️ Tool Integration Analysis:')
    testResults.toolTests.forEach(test => {
      console.log(`  🛠️ ${test.test}: ${test.success ? '✅' : '❌'} - ${test.details}`)
    })
    
    console.log('\n🔍 Edge Cases Analysis:')
    testResults.edgeCaseTests.forEach(test => {
      console.log(`  🔍 ${test.test}: ${test.success ? '✅' : '❌'} - ${test.details}`)
    })
    
    // Production Readiness Assessment
    const successRate = (testResults.passedTests / testResults.totalTests) * 100
    
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:')
    if (successRate >= 95) {
      console.log('🎉 EXCELLENT: System is production-ready with outstanding performance!')
      console.log('✅ All critical systems functioning perfectly')
    } else if (successRate >= 85) {
      console.log('✅ VERY GOOD: System is production-ready with minor optimizations needed')
      console.log('⚠️ Address any failing tests for optimal performance')
    } else if (successRate >= 75) {
      console.log('⚠️ GOOD: System is mostly production-ready but needs improvements')
      console.log('🔧 Focus on failing test categories before deployment')
    } else if (successRate >= 60) {
      console.log('❌ FAIR: System needs significant improvements before production')
      console.log('🚨 Address multiple failing test categories')
    } else {
      console.log('🚨 POOR: System is not ready for production deployment')
      console.log('🚨 Major issues need to be resolved')
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (successRate >= 85) {
      console.log('  ✅ System ready for production deployment')
      console.log('  📊 Monitor performance metrics in production')
      console.log('  🔄 Implement continuous monitoring')
      console.log('  📈 Consider performance optimizations')
    } else {
      console.log('  🔧 Address failing test categories')
      console.log('  📊 Implement better error handling')
      console.log('  ⚡ Optimize streaming performance')
      console.log('  🧠 Improve memory consistency')
      console.log('  🛠️ Enhance tool integration')
    }
    
    console.log('\n🚀 RIGOROUS TESTING COMPLETED!')
    
  } catch (error) {
    console.error('❌ Rigorous comprehensive test error:', error.message)
  }
}

// Helper function to test messages with detailed metrics
async function testMessageWithMetrics(message, userId, detailed = false) {
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
        firstChunkTime: 0,
        totalTime: Date.now() - startTime
      }
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
    
    return {
      success: true,
      content: content,
      chunkCount: chunkCount,
      firstChunkTime: firstChunkTime,
      totalTime: totalTime
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      chunkCount: 0,
      firstChunkTime: 0,
      totalTime: Date.now() - Date.now()
    }
  }
}

rigorousComprehensiveTest()
