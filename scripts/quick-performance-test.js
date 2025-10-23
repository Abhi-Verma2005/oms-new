/**
 * 🚀 Quick Performance Test
 * Simple test to validate streaming optimizations
 */

const fetch = require('node-fetch')
const { performance } = require('perf_hooks')

console.log('🧪 Quick Performance Validation...\n')

async function quickTest() {
  const baseUrl = 'http://localhost:3000'
  
  try {
    console.log('📡 Testing streaming response...')
    const startTime = performance.now()
    
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, test the streaming performance',
        messages: [],
        userId: 'test-user',
        currentUrl: 'http://localhost:3000/publishers',
        cartState: { items: [], totalItems: 0, totalPrice: 0 }
      })
    })
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let firstByteTime = null
      let totalContent = ''
      let chunkCount = 0
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        chunkCount++
        totalContent += chunk
        
        if (!firstByteTime) {
          firstByteTime = performance.now() - startTime
        }
      }
      
      const totalTime = performance.now() - startTime
      
      console.log(`✅ Response received successfully`)
      console.log(`   First byte: ${firstByteTime.toFixed(0)}ms`)
      console.log(`   Total time: ${totalTime.toFixed(0)}ms`)
      console.log(`   Chunks: ${chunkCount}`)
      console.log(`   Content length: ${totalContent.length} chars`)
      console.log(`   Throughput: ${(totalContent.length / totalTime * 1000 / 1024).toFixed(1)} KB/s`)
      
      // Performance validation
      if (firstByteTime < 2000) {
        console.log(`✅ First byte time is good (<2s)`)
      } else {
        console.log(`⚠️  First byte time is slow (>2s)`)
      }
      
      if (totalTime < 5000) {
        console.log(`✅ Total time is good (<5s)`)
      } else {
        console.log(`⚠️  Total time is slow (>5s)`)
      }
      
      if (chunkCount > 0) {
        console.log(`✅ Streaming is working (${chunkCount} chunks)`)
      } else {
        console.log(`❌ No streaming chunks received`)
      }
      
    } else {
      console.log(`❌ HTTP ${response.status}: ${await response.text()}`)
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
}

quickTest()
