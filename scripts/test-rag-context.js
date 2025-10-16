#!/usr/bin/env node

/**
 * 🧪 Test RAG Context
 * Test if the RAG context is being included in the API response
 */

console.log('🧪 Testing RAG Context...\n')

async function testRAGContext() {
  try {
    console.log('🔍 Testing if RAG context is being used...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test with a message that should retrieve pizza information
    const testMessage = 'what is my favorite food?'
    console.log(`📝 Testing: "${testMessage}"`)
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
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
          config: {},
          currentUrl: '/test',
          cartState: null
        })
      })
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`)
        return
      }
      
      // Read the response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`📊 Response time: ${duration}ms`)
      console.log(`📝 AI Response: "${content}"`)
      
      // Check if the AI remembered the pizza preference
      if (content.toLowerCase().includes('pizza')) {
        console.log('✅ SUCCESS: AI remembered your favorite food!')
        console.log('✅ RAG context is working correctly!')
      } else {
        console.log('❌ FAILED: AI did not remember your favorite food')
        console.log('❌ RAG context might not be working')
        
        // Check if it's giving a generic response
        if (content.toLowerCase().includes("don't have access to personal information")) {
          console.log('🔍 AI is giving a generic privacy response')
          console.log('🔍 This suggests the RAG context is not being included in the prompt')
        }
      }
      
    } catch (requestError) {
      console.log(`❌ Request error: ${requestError.message}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing RAG context:', error.message)
  }
}

testRAGContext()
