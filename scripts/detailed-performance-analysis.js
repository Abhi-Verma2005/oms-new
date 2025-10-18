#!/usr/bin/env node

/**
 * 🔍 DETAILED RAG PERFORMANCE ANALYSIS
 * Analyzes each component of the RAG pipeline to identify bottlenecks
 */

const http = require('http')
const https = require('https')

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUser: 'test-user-quick',
  testQueries: [
    'What is my name?',
    'What is my name?', // Repeat to test caching
    'Show me website recommendations',
    'Show me website recommendations', // Repeat to test caching
  ],
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const isHttps = url.startsWith('https://')
    const requestModule = isHttps ? https : http
    
    const req = requestModule.request(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 30000,
    }, (res) => {
      let data = ''
      const responseStartTime = Date.now()
      
      res.on('data', (chunk) => {
        data += chunk
        if (!responseStartTime.firstChunk) {
          responseStartTime.firstChunk = Date.now()
        }
      })
      
      res.on('end', () => {
        const endTime = Date.now()
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          timing: {
            total: endTime - startTime,
            firstByte: responseStartTime - startTime,
            firstChunk: responseStartTime.firstChunk - startTime,
          },
        })
      })
    })
    
    req.on('error', (error) => {
      const endTime = Date.now()
      reject({
        error,
        timing: {
          total: endTime - startTime,
        },
      })
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject({
        error: new Error('Request timeout'),
        timing: {
          total: 30000,
        },
      })
    })
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

async function analyzePerformance() {
  console.log('🔍 Detailed RAG Performance Analysis')
  console.log('='.repeat(60))
  
  const results = []
  
  for (let i = 0; i < TEST_CONFIG.testQueries.length; i++) {
    const query = TEST_CONFIG.testQueries[i]
    const isRepeat = i > 0 && TEST_CONFIG.testQueries[i-1] === query
    
    console.log(`\n📝 Test ${i + 1}: "${query}"`)
    if (isRepeat) {
      console.log('   (Repeat query - testing cache effectiveness)')
    }
    
    const testData = {
      message: query,
      messages: [],
      userId: TEST_CONFIG.testUser,
      currentUrl: 'http://localhost:3000/publishers',
      cartState: { items: [], totalItems: 0, totalPrice: 0 }
    }
    
    try {
      const startTime = Date.now()
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`, {
        method: 'POST',
        body: JSON.stringify(testData),
      })
      
      const result = {
        query,
        isRepeat,
        statusCode: response.statusCode,
        timing: response.timing,
        responseLength: response.body.length,
        success: response.statusCode === 200,
      }
      
      results.push(result)
      
      console.log(`   Status: ${response.statusCode}`)
      console.log(`   Total Time: ${response.timing.total}ms`)
      console.log(`   First Byte: ${response.timing.firstByte}ms`)
      console.log(`   First Chunk: ${response.timing.firstChunk}ms`)
      console.log(`   Response Length: ${response.body.length} chars`)
      
      if (response.statusCode === 200) {
        const preview = response.body.substring(0, 100)
        console.log(`   Preview: "${preview}..."`)
        
        // Performance analysis
        if (response.timing.total < 1000) {
          console.log(`   ✅ EXCELLENT (<1s)`)
        } else if (response.timing.total < 3000) {
          console.log(`   ✅ GOOD (<3s)`)
        } else if (response.timing.total < 6000) {
          console.log(`   ⚠️  ACCEPTABLE (<6s)`)
        } else {
          console.log(`   ❌ SLOW (>6s)`)
        }
        
        // Cache effectiveness analysis
        if (isRepeat && results.length >= 2) {
          const previousResult = results[results.length - 2]
          const improvement = ((previousResult.timing.total - response.timing.total) / previousResult.timing.total) * 100
          console.log(`   📈 Cache Improvement: ${improvement.toFixed(1)}%`)
        }
        
      } else {
        console.log(`   ❌ FAILED: ${response.body}`)
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message || error}`)
      results.push({
        query,
        isRepeat,
        success: false,
        error: error.message || error,
      })
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Generate analysis report
  console.log('\n' + '='.repeat(60))
  console.log('📊 PERFORMANCE ANALYSIS REPORT')
  console.log('='.repeat(60))
  
  const successfulTests = results.filter(r => r.success)
  const failedTests = results.filter(r => !r.success)
  
  console.log(`\n🎯 Overall Statistics:`)
  console.log(`   Total Tests: ${results.length}`)
  console.log(`   Successful: ${successfulTests.length}`)
  console.log(`   Failed: ${failedTests.length}`)
  console.log(`   Success Rate: ${((successfulTests.length / results.length) * 100).toFixed(1)}%`)
  
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.timing.total, 0) / successfulTests.length
    const avgFirstByte = successfulTests.reduce((sum, r) => sum + r.timing.firstByte, 0) / successfulTests.length
    
    console.log(`\n⏱️  Performance Metrics:`)
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`)
    console.log(`   Average First Byte: ${avgFirstByte.toFixed(0)}ms`)
    console.log(`   Fastest Response: ${Math.min(...successfulTests.map(r => r.timing.total))}ms`)
    console.log(`   Slowest Response: ${Math.max(...successfulTests.map(r => r.timing.total))}ms`)
  }
  
  // Cache effectiveness analysis
  console.log(`\n💾 Cache Effectiveness:`)
  const cacheTests = results.filter(r => r.isRepeat && r.success)
  if (cacheTests.length > 0) {
    for (let i = 0; i < cacheTests.length; i++) {
      const cacheTest = cacheTests[i]
      const originalTest = results.find(r => !r.isRepeat && r.query === cacheTest.query && r.success)
      
      if (originalTest) {
        const improvement = ((originalTest.timing.total - cacheTest.timing.total) / originalTest.timing.total) * 100
        console.log(`   "${cacheTest.query}": ${improvement.toFixed(1)}% improvement`)
      }
    }
  } else {
    console.log(`   No cache effectiveness data available`)
  }
  
  // Bottleneck identification
  console.log(`\n🔍 Bottleneck Analysis:`)
  if (successfulTests.length > 0) {
    const avgFirstByte = successfulTests.reduce((sum, r) => sum + r.timing.firstByte, 0) / successfulTests.length
    const avgTotal = successfulTests.reduce((sum, r) => sum + r.timing.total, 0) / successfulTests.length
    
    console.log(`   Time to First Byte: ${avgFirstByte.toFixed(0)}ms`)
    console.log(`   Total Response Time: ${avgTotal.toFixed(0)}ms`)
    console.log(`   Streaming Time: ${(avgTotal - avgFirstByte).toFixed(0)}ms`)
    
    if (avgFirstByte > 5000) {
      console.log(`   ⚠️  HIGH LATENCY: Time to first byte is very high (>5s)`)
      console.log(`      Likely issues: Database queries, embedding generation, or OpenAI API calls`)
    } else if (avgFirstByte > 2000) {
      console.log(`   ⚠️  MODERATE LATENCY: Time to first byte is high (>2s)`)
      console.log(`      Possible issues: Database queries or embedding generation`)
    } else {
      console.log(`   ✅ GOOD: Time to first byte is acceptable (<2s)`)
    }
    
    if ((avgTotal - avgFirstByte) > 3000) {
      console.log(`   ⚠️  SLOW STREAMING: Streaming portion is very slow (>3s)`)
      console.log(`      Likely issues: OpenAI token generation or response processing`)
    } else if ((avgTotal - avgFirstByte) > 1000) {
      console.log(`   ⚠️  MODERATE STREAMING: Streaming portion is slow (>1s)`)
      console.log(`      Possible issues: OpenAI token generation`)
    } else {
      console.log(`   ✅ GOOD: Streaming performance is acceptable (<1s)`)
    }
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`)
  if (successfulTests.length > 0) {
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.timing.total, 0) / successfulTests.length
    
    if (avgResponseTime > 6000) {
      console.log(`   🚨 CRITICAL: Response times are too high (>6s)`)
      console.log(`      - Check database query performance`)
      console.log(`      - Verify embedding caching is working`)
      console.log(`      - Consider reducing OpenAI maxTokens`)
      console.log(`      - Check for network latency issues`)
    } else if (avgResponseTime > 3000) {
      console.log(`   ⚠️  HIGH: Response times are high (>3s)`)
      console.log(`      - Optimize database queries`)
      console.log(`      - Enable semantic caching`)
      console.log(`      - Consider async knowledge storage`)
    } else {
      console.log(`   ✅ GOOD: Response times are acceptable (<3s)`)
      console.log(`      - System is performing well`)
      console.log(`      - Consider monitoring for consistency`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  
  return results
}

// Run the analysis
if (require.main === module) {
  analyzePerformance().catch(console.error)
}

module.exports = { analyzePerformance }


