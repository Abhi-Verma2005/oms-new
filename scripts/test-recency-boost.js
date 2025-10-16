#!/usr/bin/env node

/**
 * 🧪 Test Recency Boost
 * Test the improved memory system with recency boost
 */

console.log('🧪 Testing Recency Boost Memory System...\n')

async function testRecencyBoost() {
  try {
    console.log('🚀 Testing improved memory system with recency boost...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    const testId = Date.now()
    
    // Test 1: Store new information
    console.log('\n📝 Test 1: Storing new information with recency boost...')
    
    const newInfo = `I am a data scientist and I love machine learning - recency test ${testId}`
    console.log(`🔸 Storing: "${newInfo}"`)
    
    const storeResponse = await sendMessage(newInfo, testUserId)
    if (storeResponse.success) {
      console.log('✅ New information stored successfully')
      console.log(`📝 AI Response: "${storeResponse.content.substring(0, 100)}..."`)
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test 2: Query for work information (should prioritize recent)
      console.log('\n📝 Test 2: Testing recency boost retrieval...')
      
      const queryMessage = 'what do I do for work?'
      console.log(`🔸 Querying: "${queryMessage}"`)
      
      const queryResponse = await sendMessage(queryMessage, testUserId)
      if (queryResponse.success) {
        console.log(`📝 AI Response: "${queryResponse.content}"`)
        
        // Check if it retrieved the NEW information (data scientist) vs OLD (software developer)
        if (queryResponse.content.toLowerCase().includes('data scientist')) {
          console.log('✅ SUCCESS: Retrieved NEW information (data scientist)!')
          console.log('✅ Recency boost is working!')
        } else if (queryResponse.content.toLowerCase().includes('software developer')) {
          console.log('❌ FAILED: Retrieved OLD information (software developer)')
          console.log('❌ Recency boost not working properly')
        } else {
          console.log('⚠️ Retrieved different information')
        }
      } else {
        console.log('❌ Failed to query information')
      }
      
      // Test 3: Store conflicting information
      console.log('\n📝 Test 3: Testing with conflicting information...')
      
      const conflictingInfo = `Actually, I changed my mind - I am now a product manager - conflict test ${testId}`
      console.log(`🔸 Storing conflicting info: "${conflictingInfo}"`)
      
      const conflictStoreResponse = await sendMessage(conflictingInfo, testUserId)
      if (conflictStoreResponse.success) {
        console.log('✅ Conflicting information stored')
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Test retrieval again
        console.log('🔸 Testing retrieval after conflicting information...')
        const conflictQueryResponse = await sendMessage('what is my current job?', testUserId)
        
        if (conflictQueryResponse.success) {
          console.log(`📝 AI Response: "${conflictQueryResponse.content}"`)
          
          if (conflictQueryResponse.content.toLowerCase().includes('product manager')) {
            console.log('✅ SUCCESS: Retrieved MOST RECENT information (product manager)!')
            console.log('✅ Recency boost working perfectly!')
          } else {
            console.log('❌ FAILED: Did not retrieve most recent information')
          }
        }
      }
      
    } else {
      console.log('❌ Failed to store new information')
    }
    
    console.log('\n📊 RECENCY BOOST TEST RESULTS:')
    console.log('🔍 The system should now prioritize recent conversations over older ones')
    console.log('✅ Recent conversations get a 0.1 boost (within 24 hours)')
    console.log('✅ Older conversations get a 0.05 boost (within 7 days)')
    console.log('✅ Very old conversations get no boost')
    
  } catch (error) {
    console.error('❌ Recency boost test error:', error.message)
  }
}

// Helper function to send messages
async function sendMessage(message, userId) {
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

testRecencyBoost()
