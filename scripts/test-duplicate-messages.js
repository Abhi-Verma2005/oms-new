#!/usr/bin/env node

/**
 * 🧪 Test Duplicate Messages
 * Test to reproduce the duplicate message issue
 */

console.log('🧪 Testing for Duplicate Messages...\n')

async function testDuplicateMessages() {
  try {
    console.log('🔍 Testing to reproduce duplicate message issue...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test with a simple message that might cause duplicates
    console.log('📝 Testing with: "my fav food is pizza"')
    
    const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'my fav food is pizza',
        userId: testUserId,
        messages: [
          { role: 'user', content: 'my fav food is pizza' }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
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
        
        console.log(`📦 Chunk ${chunkCount}: "${chunk}"`)
      }
      
      console.log(`\n📝 Complete response: "${content}"`)
      console.log(`📊 Total chunks received: ${chunkCount}`)
      
      // Check for potential issues
      if (content.includes('Sorry, I encountered an error')) {
        console.log('⚠️ Error message detected in response')
      }
      
      if (chunkCount > 10) {
        console.log('⚠️ High chunk count might indicate streaming issues')
      }
      
      // Check for duplicate content
      const lines = content.split('\n').filter(line => line.trim())
      const uniqueLines = [...new Set(lines)]
      
      if (lines.length !== uniqueLines.length) {
        console.log('⚠️ Potential duplicate content detected')
        console.log(`📊 Total lines: ${lines.length}, Unique lines: ${uniqueLines.length}`)
      }
      
    } else {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing duplicate messages:', error.message)
  }
}

testDuplicateMessages()
