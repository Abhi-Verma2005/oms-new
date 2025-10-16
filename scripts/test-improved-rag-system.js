#!/usr/bin/env node

/**
 * 🧪 Test Improved RAG System
 * Comprehensive test of the improved RAG memory system
 */

console.log('🧪 Testing Improved RAG Memory System...\n')

async function testImprovedRAGSystem() {
  try {
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testId = Date.now()
    
    console.log('🚀 Testing improved RAG system with latest best practices...')
    
    // Test 1: Store clear personal information
    console.log('\n📝 Test 1: Storing clear personal information...')
    
    const personalInfo = `My name is Emma, I am 29 years old, I work as a data scientist, and I have a cat named Luna - test ${testId}`
    console.log(`🔸 Storing: "${personalInfo}"`)
    
    const storeResponse = await testMessage(personalInfo, testUserId)
    if (storeResponse.success) {
      console.log('✅ Information stored successfully')
      console.log(`📝 AI Response: "${storeResponse.content.substring(0, 100)}..."`)
      
      // Wait for storage to complete
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Test 2: Test exact keyword matches
      console.log('\n📝 Test 2: Testing exact keyword matches...')
      
      const keywordTests = [
        { query: 'what is my name?', expected: 'emma', description: 'Name retrieval' },
        { query: 'how old am I?', expected: '29', description: 'Age retrieval' },
        { query: 'what do I do for work?', expected: 'data scientist', description: 'Profession retrieval' },
        { query: 'what is my pet\'s name?', expected: 'luna', description: 'Pet name retrieval' }
      ]
      
      let keywordSuccess = 0
      for (const test of keywordTests) {
        console.log(`  🔸 Testing ${test.description}: "${test.query}"`)
        const response = await testMessage(test.query, testUserId)
        
        if (response.success) {
          console.log(`    📝 Response: "${response.content}"`)
          
          if (response.content.toLowerCase().includes(test.expected)) {
            console.log(`    ✅ Retrieved: ${test.expected}`)
            keywordSuccess++
          } else {
            console.log(`    ❌ Failed to retrieve: ${test.expected}`)
          }
        } else {
          console.log(`    ❌ Request failed`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      console.log(`\n📊 Keyword Match Results: ${keywordSuccess}/${keywordTests.length} successful`)
      
      // Test 3: Test semantic similarity
      console.log('\n📝 Test 3: Testing semantic similarity...')
      
      const semanticTests = [
        { query: 'tell me about my job', expected: 'data scientist', description: 'Job description' },
        { query: 'what are my personal details?', expected: 'emma', description: 'Personal details' },
        { query: 'who am I?', expected: 'emma', description: 'Identity query' }
      ]
      
      let semanticSuccess = 0
      for (const test of semanticTests) {
        console.log(`  🔸 Testing ${test.description}: "${test.query}"`)
        const response = await testMessage(test.query, testUserId)
        
        if (response.success) {
          console.log(`    📝 Response: "${response.content}"`)
          
          if (response.content.toLowerCase().includes(test.expected)) {
            console.log(`    ✅ Retrieved: ${test.expected}`)
            semanticSuccess++
          } else {
            console.log(`    ❌ Failed to retrieve: ${test.expected}`)
          }
        } else {
          console.log(`    ❌ Request failed`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      console.log(`\n📊 Semantic Match Results: ${semanticSuccess}/${semanticTests.length} successful`)
      
      // Test 4: Test memory update
      console.log('\n📝 Test 4: Testing memory update...')
      
      const updatedInfo = `Actually, I changed my mind - I am now a product manager - update test ${testId}`
      console.log(`🔸 Storing update: "${updatedInfo}"`)
      
      const updateResponse = await testMessage(updatedInfo, testUserId)
      if (updateResponse.success) {
        console.log('✅ Update stored successfully')
        
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Test retrieval of updated information
        console.log('🔸 Testing retrieval of updated profession...')
        const updateQueryResponse = await testMessage('what do I do for work?', testUserId)
        
        if (updateQueryResponse.success) {
          console.log(`📝 Response: "${updateQueryResponse.content}"`)
          
          if (updateQueryResponse.content.toLowerCase().includes('product manager')) {
            console.log('✅ SUCCESS: Retrieved updated profession (product manager)')
          } else if (updateQueryResponse.content.toLowerCase().includes('data scientist')) {
            console.log('⚠️ PARTIAL: Retrieved old profession (data scientist)')
          } else {
            console.log('❌ FAILED: Did not retrieve any profession')
          }
        }
      }
      
      // Test 5: Test with specific test ID reference
      console.log('\n📝 Test 5: Testing with specific test ID reference...')
      
      const specificQuery = `what did I tell you about my work in test ${testId}?`
      console.log(`🔸 Testing: "${specificQuery}"`)
      
      const specificResponse = await testMessage(specificQuery, testUserId)
      if (specificResponse.success) {
        console.log(`📝 Response: "${specificResponse.content}"`)
        
        if (specificResponse.content.toLowerCase().includes('product manager') || 
            specificResponse.content.toLowerCase().includes('data scientist')) {
          console.log('✅ SUCCESS: Retrieved profession information with test ID')
        } else {
          console.log('❌ FAILED: Did not retrieve profession with test ID')
        }
      }
      
    } else {
      console.log('❌ Failed to store initial information')
    }
    
    // Final Assessment
    console.log('\n📊 FINAL ASSESSMENT:')
    const totalTests = keywordTests.length + semanticTests.length
    const totalSuccess = keywordSuccess + semanticSuccess
    const successRate = (totalSuccess / totalTests) * 100
    
    console.log(`📈 Overall Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`📈 Keyword Matches: ${keywordSuccess}/${keywordTests.length}`)
    console.log(`📈 Semantic Matches: ${semanticSuccess}/${semanticTests.length}`)
    
    if (successRate >= 80) {
      console.log('🎉 EXCELLENT: RAG memory system is working very well!')
    } else if (successRate >= 60) {
      console.log('✅ GOOD: RAG memory system is working well with room for improvement')
    } else if (successRate >= 40) {
      console.log('⚠️ FAIR: RAG memory system needs improvement')
    } else {
      console.log('❌ POOR: RAG memory system needs significant work')
    }
    
    console.log('\n🚀 Improved RAG System Testing Completed!')
    
  } catch (error) {
    console.error('❌ Test improved RAG system error:', error.message)
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

testImprovedRAGSystem()
