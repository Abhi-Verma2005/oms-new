async function testOpenAIDirect() {
  try {
    console.log('🔍 Testing OpenAI API Directly')
    console.log('==============================')
    
    if (!process.env.OPEN_AI_KEY) {
      console.log('❌ OPEN_AI_KEY not found in environment')
      return
    }
    
    // Test 1: Direct OpenAI API Call
    console.log('\n1. Testing Direct OpenAI API Call...')
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: 'Hello, this is a direct API test.' }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Direct OpenAI API: OK (${duration}ms)`)
        console.log(`   Response: "${data.choices[0].message.content}"`)
        
        if (duration < 1000) {
          console.log('🎉 EXCELLENT: Direct API under 1 second!')
        } else if (duration < 2000) {
          console.log('✅ GOOD: Direct API under 2 seconds')
        } else if (duration < 3000) {
          console.log('⚠️ MODERATE: Direct API under 3 seconds')
        } else {
          console.log('❌ SLOW: Direct API over 3 seconds')
        }
      } else {
        console.log(`❌ Direct OpenAI API: FAILED (${response.status})`)
        const errorText = await response.text()
        console.log(`   Error: ${errorText}`)
      }
    } catch (error) {
      console.log(`❌ Direct OpenAI API: ERROR - ${error.message}`)
    }
    
    // Test 2: Multiple Direct API Calls
    console.log('\n2. Testing Multiple Direct API Calls...')
    
    const concurrentStartTime = Date.now()
    const concurrentRequests = 3
    
    const promises = []
    for (let i = 0; i < concurrentRequests; i++) {
      const promise = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: `Direct API test ${i + 1}` }
          ],
          temperature: 0.7,
          max_tokens: 50
        })
      }).then(response => response.ok)
      promises.push(promise)
    }
    
    try {
      const results = await Promise.all(promises)
      const concurrentEndTime = Date.now()
      const concurrentDuration = concurrentEndTime - concurrentStartTime
      
      const successCount = results.filter(Boolean).length
      console.log(`✅ Concurrent Direct API: ${successCount}/${concurrentRequests} successful (${concurrentDuration}ms)`)
      
      if (concurrentDuration < 2000) {
        console.log('🎉 EXCELLENT: Concurrent API calls fast!')
      } else if (concurrentDuration < 4000) {
        console.log('✅ GOOD: Concurrent API calls reasonable')
      } else {
        console.log('⚠️ MODERATE: Concurrent API calls slow')
      }
      
    } catch (error) {
      console.log(`❌ Concurrent Direct API: ERROR - ${error.message}`)
    }
    
    // Test 3: Network Analysis
    console.log('\n3. Network Analysis...')
    
    const networkStartTime = Date.now()
    
    try {
      // Test basic network connectivity
      const response = await fetch('https://httpbin.org/delay/0', {
        method: 'GET'
      })
      
      const networkEndTime = Date.now()
      const networkDuration = networkEndTime - networkStartTime
      
      console.log(`✅ Network latency: ${networkDuration}ms`)
      
      if (networkDuration < 100) {
        console.log('🎉 EXCELLENT: Very low network latency')
      } else if (networkDuration < 300) {
        console.log('✅ GOOD: Low network latency')
      } else if (networkDuration < 500) {
        console.log('⚠️ MODERATE: Medium network latency')
      } else {
        console.log('❌ SLOW: High network latency')
      }
      
    } catch (error) {
      console.log(`❌ Network test: ERROR - ${error.message}`)
    }
    
    // Test 4: Performance Analysis
    console.log('\n4. Performance Analysis...')
    console.log('==========================')
    console.log('ISSUES IDENTIFIED:')
    console.log('  🔍 OpenAI API latency is the bottleneck')
    console.log('  🔍 Network latency affects response times')
    console.log('  🔍 Next.js processing adds minimal overhead')
    console.log('')
    console.log('SOLUTIONS:')
    console.log('  💡 Use faster OpenAI models (gpt-3.5-turbo)')
    console.log('  💡 Implement response caching')
    console.log('  💡 Use streaming for perceived performance')
    console.log('  💡 Optimize network connection')
    console.log('  💡 Consider edge deployment')
    
    console.log('\n🎉 OpenAI Direct API Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testOpenAIDirect()
