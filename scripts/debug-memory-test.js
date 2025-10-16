#!/usr/bin/env node

/**
 * 🧪 Debug Memory Test
 * Debug why the basic memory test is failing
 */

console.log('🧪 Debugging Memory Test...\n')

async function debugMemoryTest() {
  try {
    console.log('🔍 Debugging basic memory retention...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test 1: Clear any existing cache by using a unique message
    const uniqueId = Date.now()
    console.log(`📝 Using unique ID: ${uniqueId}`)
    
    // Step 1: Share specific preferences with unique identifier
    console.log('\n🔸 Step 1: Sharing unique preferences...')
    const preferenceMessage = `my favorite color is blue and I love chocolate ice cream - unique ID ${uniqueId}`
    
    const prefResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: preferenceMessage,
        userId: testUserId,
        messages: [
          { role: 'user', content: preferenceMessage }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (prefResponse.ok) {
      console.log('✅ Preferences shared successfully')
      
      // Read the response
      const reader = prefResponse.body.getReader()
      const decoder = new TextDecoder()
      let prefContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        prefContent += decoder.decode(value, { stream: true })
      }
      
      console.log(`📝 AI Response: "${prefContent.substring(0, 100)}..."`)
      
      // Wait for storage
      console.log('⏳ Waiting for storage...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Step 2: Ask about the specific preferences
      console.log('\n🔸 Step 2: Asking about specific preferences...')
      const askMessage = `what did I tell you about my favorite color and ice cream with ID ${uniqueId}?`
      
      const askResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: askMessage,
          userId: testUserId,
          messages: [
            { role: 'user', content: askMessage }
          ],
          config: {},
          currentUrl: '/test',
          cartState: null
        })
      })
      
      if (askResponse.ok) {
        // Read the response
        const reader2 = askResponse.body.getReader()
        const decoder2 = new TextDecoder()
        let askContent = ''
        
        while (true) {
          const { done, value } = await reader2.read()
          if (done) break
          askContent += decoder.decode(value, { stream: true })
        }
        
        console.log(`📝 AI Response: "${askContent}"`)
        
        // Check for memory retention
        if (askContent.toLowerCase().includes('blue') && askContent.toLowerCase().includes('chocolate')) {
          console.log('✅ SUCCESS: AI remembered both preferences!')
        } else if (askContent.toLowerCase().includes('blue')) {
          console.log('⚠️ PARTIAL: AI remembered color but not ice cream')
        } else if (askContent.toLowerCase().includes('chocolate')) {
          console.log('⚠️ PARTIAL: AI remembered ice cream but not color')
        } else {
          console.log('❌ FAILED: AI did not remember either preference')
        }
        
        // Check if it's hitting cache
        if (askContent.includes('Sorry, I don\'t have access to personal information')) {
          console.log('🔍 Issue: AI is giving generic privacy response (cache hit)')
        }
        
      } else {
        console.log('❌ Failed to ask about preferences')
      }
      
    } else {
      console.log('❌ Failed to share preferences')
    }
    
    // Test 2: Try a completely different approach - ask about something we know is stored
    console.log('\n🔸 Test 2: Asking about previously stored information...')
    const knownMessage = 'what did I tell you about my work and pet?'
    
    const knownResponse = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: knownMessage,
        userId: testUserId,
        messages: [
          { role: 'user', content: knownMessage }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    if (knownResponse.ok) {
        const reader3 = knownResponse.body.getReader()
        const decoder3 = new TextDecoder()
        let knownContent = ''
        
        while (true) {
          const { done, value } = await reader3.read()
          if (done) break
          knownContent += decoder3.decode(value, { stream: true })
        }
      
      console.log(`📝 AI Response: "${knownContent}"`)
      
      if (knownContent.toLowerCase().includes('developer') || knownContent.toLowerCase().includes('whiskers')) {
        console.log('✅ SUCCESS: AI remembered previously stored information!')
        console.log('🔍 This suggests the memory system is working for some queries')
      } else {
        console.log('❌ FAILED: AI did not remember previously stored information')
      }
    }
    
  } catch (error) {
    console.error('❌ Debug memory test error:', error.message)
  }
}

debugMemoryTest()
