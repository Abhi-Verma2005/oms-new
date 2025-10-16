#!/usr/bin/env node

/**
 * 🔍 Debug No Response Issue
 * Check why the AI isn't responding
 */

console.log('🔍 Debugging No Response Issue...\n')

async function debugNoResponse() {
  try {
    console.log('🔍 Testing API response with the exact same message...')
    
    const testUserId = 'cmf2xwqgp00003bg1lzw6pev0'
    
    // Test with the exact same message that's stuck
    console.log('📝 Testing with: "my fav colour is red"')
    
    const startTime = Date.now()
    const response = await fetch('http://localhost:3000/api/ai-chat?stream=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'my fav colour is red',
        userId: testUserId,
        messages: [
          { role: 'user', content: 'my fav colour is red' }
        ],
        config: {},
        currentUrl: '/test',
        cartState: null
      })
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`⏱️ Response time: ${duration}ms`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
      return
    }
    
    if (!response.body) {
      console.log('❌ No response body received')
      return
    }
    
    console.log('✅ Response body received, reading stream...')
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let content = ''
    let chunkCount = 0
    let firstChunkTime = 0
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('📦 Stream completed')
          break
        }
        
        chunkCount++
        const chunk = decoder.decode(value, { stream: true })
        content += chunk
        
        if (chunkCount === 1) {
          firstChunkTime = Date.now() - startTime
          console.log(`🚀 First chunk received: ${firstChunkTime}ms`)
        }
        
        console.log(`📦 Chunk ${chunkCount}: "${chunk}"`)
        
        // Stop after 30 chunks to avoid spam
        if (chunkCount >= 30) {
          console.log('⚠️ Stopping after 30 chunks to avoid spam')
          break
        }
      }
      
      console.log(`\n📝 Complete response: "${content}"`)
      console.log(`📊 Total chunks received: ${chunkCount}`)
      console.log(`⏱️ Time to first chunk: ${firstChunkTime}ms`)
      
    } catch (streamError) {
      console.error('❌ Stream reading error:', streamError.message)
    } finally {
      try {
        reader.releaseLock()
      } catch (e) {
        // Ignore release errors
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging no response:', error.message)
    console.error('❌ Error stack:', error.stack)
  }
}

debugNoResponse()
