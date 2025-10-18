/**
 * 🧪 Performance Fixes Test
 * Test the optimized AI chat performance improvements
 */

const fetch = require('node-fetch')
const { performance } = require('perf_hooks')

console.log('🧪 Testing AI Chat Performance Fixes...\n')

async function testPerformanceFixes() {
  const baseUrl = 'http://localhost:3000'
  const testMessages = [
    'hi',
    'my name is anish',
    'what is my name?',
    'help me with navigation',
    'show me my cart'
  ]
  
  const results = {
    original: [],
    optimized: [],
    improvements: []
  }

  console.log('📊 Performance Test Plan:')
  console.log('  • Test original API endpoint')
  console.log('  • Test optimized API endpoint')
  console.log('  • Compare response times')
  console.log('  • Check for empty responses')
  console.log('  • Verify streaming performance\n')

  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i]
    console.log(`\n🔍 Test ${i + 1}/${testMessages.length}: "${message}"`)
    
    // Test original API
    console.log('  📡 Testing original API...')
    const originalStart = performance.now()
    try {
      const originalResponse = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          messages: [],
          config: { navigationData: [] },
          currentUrl: 'http://localhost:3000',
          cartState: { items: [], totalItems: 0, totalPrice: 0 }
        })
      })
      
      if (!originalResponse.ok) {
        throw new Error(`HTTP ${originalResponse.status}`)
      }
      
      let originalContent = ''
      const reader = originalResponse.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        originalContent += chunk
      }
      
      const originalTime = performance.now() - originalStart
      results.original.push({
        message,
        time: originalTime,
        contentLength: originalContent.length,
        hasContent: originalContent.trim().length > 0
      })
      
      console.log(`    ⏱️  Original: ${originalTime.toFixed(2)}ms, Content: ${originalContent.length} chars`)
      
    } catch (error) {
      console.log(`    ❌ Original failed: ${error.message}`)
      results.original.push({
        message,
        time: -1,
        contentLength: 0,
        hasContent: false,
        error: error.message
      })
    }

    // Test optimized API (if available)
    console.log('  🚀 Testing optimized API...')
    const optimizedStart = performance.now()
    try {
      const optimizedResponse = await fetch(`${baseUrl}/api/ai-chat/route-optimized-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          messages: [],
          config: { navigationData: [] },
          currentUrl: 'http://localhost:3000',
          cartState: { items: [], totalItems: 0, totalPrice: 0 }
        })
      })
      
      if (!optimizedResponse.ok) {
        throw new Error(`HTTP ${optimizedResponse.status}`)
      }
      
      let optimizedContent = ''
      const reader = optimizedResponse.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        optimizedContent += chunk
      }
      
      const optimizedTime = performance.now() - optimizedStart
      results.optimized.push({
        message,
        time: optimizedTime,
        contentLength: optimizedContent.length,
        hasContent: optimizedContent.trim().length > 0
      })
      
      console.log(`    ⏱️  Optimized: ${optimizedTime.toFixed(2)}ms, Content: ${optimizedContent.length} chars`)
      
      // Calculate improvement
      if (results.original[i].time > 0) {
        const improvement = ((results.original[i].time - optimizedTime) / results.original[i].time) * 100
        results.improvements.push({
          message,
          improvement: improvement,
          timeSaved: results.original[i].time - optimizedTime
        })
        console.log(`    📈 Improvement: ${improvement.toFixed(1)}% faster`)
      }
      
    } catch (error) {
      console.log(`    ❌ Optimized failed: ${error.message}`)
      results.optimized.push({
        message,
        time: -1,
        contentLength: 0,
        hasContent: false,
        error: error.message
      })
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Generate summary report
  console.log('\n📊 Performance Test Results Summary:')
  console.log('=' .repeat(50))
  
  const originalAvgTime = results.original
    .filter(r => r.time > 0)
    .reduce((sum, r) => sum + r.time, 0) / results.original.filter(r => r.time > 0).length
  
  const optimizedAvgTime = results.optimized
    .filter(r => r.time > 0)
    .reduce((sum, r) => sum + r.time, 0) / results.optimized.filter(r => r.time > 0).length
  
  const originalEmptyResponses = results.original.filter(r => !r.hasContent).length
  const optimizedEmptyResponses = results.optimized.filter(r => !r.hasContent).length
  
  console.log(`📈 Average Response Time:`)
  console.log(`   Original:  ${originalAvgTime.toFixed(2)}ms`)
  console.log(`   Optimized: ${optimizedAvgTime.toFixed(2)}ms`)
  
  if (originalAvgTime > 0 && optimizedAvgTime > 0) {
    const overallImprovement = ((originalAvgTime - optimizedAvgTime) / originalAvgTime) * 100
    console.log(`   Improvement: ${overallImprovement.toFixed(1)}% faster`)
  }
  
  console.log(`\n📝 Empty Responses:`)
  console.log(`   Original:  ${originalEmptyResponses}/${results.original.length}`)
  console.log(`   Optimized: ${optimizedEmptyResponses}/${results.optimized.length}`)
  
  console.log(`\n🎯 Detailed Results:`)
  results.improvements.forEach(imp => {
    console.log(`   "${imp.message}": ${imp.improvement.toFixed(1)}% faster (${imp.timeSaved.toFixed(2)}ms saved)`)
  })
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:')
  if (originalEmptyResponses > 0) {
    console.log('   ⚠️  Fix empty responses in original API')
  }
  if (optimizedAvgTime < originalAvgTime) {
    console.log('   ✅ Optimized API shows performance improvements')
  }
  if (originalAvgTime > 10000) {
    console.log('   🐌 Original API is very slow (>10s) - optimization needed')
  }
  if (optimizedAvgTime < 2000) {
    console.log('   🚀 Optimized API is fast (<2s) - good performance')
  }
  
  console.log('\n✅ Performance test completed!')
  
  return results
}

// Run the test
testPerformanceFixes().catch(error => {
  console.error('❌ Performance test failed:', error.message)
  process.exit(1)
})


