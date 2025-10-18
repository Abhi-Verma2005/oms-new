#!/usr/bin/env node

/**
 * 🔬 RIGOROUS RAG ACCURACY & PERFORMANCE TEST
 * Tests both response content accuracy and performance metrics
 */

const http = require('http')
const https = require('https')

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUsers: [
    'test-user-1',
    'test-user-2', 
    'test-user-3',
    'test-user-quick'
  ],
  testCases: [
    {
      id: 'personal_facts',
      query: 'What is my name and age?',
      expectedContent: ['Test User One', '25 years old'],
      expectedSources: ['user_fact', 'personal'],
      category: 'User Facts'
    },
    {
      id: 'conversation_context',
      query: 'What did we discuss about websites?',
      expectedContent: ['websites', 'recommendations', 'TechCrunch', 'Product Hunt'],
      expectedSources: ['conversation'],
      category: 'Conversation Memory'
    },
    {
      id: 'pricing_info',
      query: 'What are the pricing options?',
      expectedContent: ['$99', 'month', 'packages', 'premium'],
      expectedSources: ['conversation'],
      category: 'Pricing Information'
    },
    {
      id: 'website_recommendations',
      query: 'Show me high-traffic websites',
      expectedContent: ['NewsHub', 'TechDaily', 'BusinessInsider', 'visitors'],
      expectedSources: ['conversation'],
      category: 'Website Recommendations'
    },
    {
      id: 'repeat_personal_facts',
      query: 'What is my name and age?',
      expectedContent: ['Test User One', '25 years old'],
      expectedSources: ['user_fact', 'personal'],
      category: 'User Facts (Repeat)',
      isRepeat: true
    },
    {
      id: 'complex_query',
      query: 'I need a website for my restaurant business with good SEO',
      expectedContent: ['restaurant', 'SEO', 'business'],
      expectedSources: ['conversation', 'user_fact'],
      category: 'Complex Business Query'
    },
    {
      id: 'similar_websites',
      query: 'Find me sites similar to the ones I bought before',
      expectedContent: ['similar', 'sites', 'purchased', 'recommendations'],
      expectedSources: ['conversation'],
      category: 'Similarity Search'
    }
  ],
  performanceThresholds: {
    excellent: 1000,  // < 1 second
    good: 3000,       // < 3 seconds
    acceptable: 6000, // < 6 seconds
    slow: 10000       // > 10 seconds
  }
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
    
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

function analyzeResponseAccuracy(response, testCase) {
  const responseText = response.body.toLowerCase()
  const analysis = {
    score: 0,
    maxScore: testCase.expectedContent.length,
    foundContent: [],
    missingContent: [],
    accuracyPercentage: 0,
    quality: 'poor'
  }
  
  // Check for expected content
  for (const expected of testCase.expectedContent) {
    const expectedLower = expected.toLowerCase()
    if (responseText.includes(expectedLower)) {
      analysis.foundContent.push(expected)
      analysis.score++
    } else {
      analysis.missingContent.push(expected)
    }
  }
  
  analysis.accuracyPercentage = (analysis.score / analysis.maxScore) * 100
  
  // Determine quality
  if (analysis.accuracyPercentage >= 90) {
    analysis.quality = 'excellent'
  } else if (analysis.accuracyPercentage >= 75) {
    analysis.quality = 'good'
  } else if (analysis.accuracyPercentage >= 50) {
    analysis.quality = 'fair'
  } else {
    analysis.quality = 'poor'
  }
  
  return analysis
}

function analyzePerformance(timing) {
  const analysis = {
    totalTime: timing.total,
    firstByteTime: timing.firstByte,
    streamingTime: timing.total - timing.firstByte,
    performance: 'slow',
    grade: 'F'
  }
  
  // Analyze total time
  if (timing.total < TEST_CONFIG.performanceThresholds.excellent) {
    analysis.performance = 'excellent'
    analysis.grade = 'A+'
  } else if (timing.total < TEST_CONFIG.performanceThresholds.good) {
    analysis.performance = 'good'
    analysis.grade = 'A'
  } else if (timing.total < TEST_CONFIG.performanceThresholds.acceptable) {
    analysis.performance = 'acceptable'
    analysis.grade = 'B'
  } else if (timing.total < TEST_CONFIG.performanceThresholds.slow) {
    analysis.performance = 'slow'
    analysis.grade = 'C'
  } else {
    analysis.performance = 'very_slow'
    analysis.grade = 'F'
  }
  
  return analysis
}

async function testRAGAccuracy(userId, testCase) {
  console.log(`\n🧪 Testing: ${testCase.category}`)
  console.log(`   Query: "${testCase.query}"`)
  console.log(`   User: ${userId}`)
  
  const testData = {
    message: testCase.query,
    messages: [],
    userId: userId,
    currentUrl: 'http://localhost:3000/publishers',
    cartState: { items: [], totalItems: 0, totalPrice: 0 }
  }
  
  try {
    const startTime = Date.now()
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      body: JSON.stringify(testData),
    })
    
    const endTime = Date.now()
    const timing = {
      total: endTime - startTime,
      firstByte: response.timing.firstByte,
      firstChunk: response.timing.firstChunk,
    }
    
    if (response.statusCode !== 200) {
      console.log(`   ❌ FAILED: HTTP ${response.statusCode}`)
      return {
        testCase,
        userId,
        success: false,
        error: `HTTP ${response.statusCode}: ${response.body}`,
        timing,
      }
    }
    
    // Analyze accuracy
    const accuracyAnalysis = analyzeResponseAccuracy(response, testCase)
    
    // Analyze performance
    const performanceAnalysis = analyzePerformance(timing)
    
    // Results
    const result = {
      testCase,
      userId,
      success: true,
      response: response.body,
      timing,
      accuracy: accuracyAnalysis,
      performance: performanceAnalysis,
      responseLength: response.body.length,
    }
    
    // Display results
    console.log(`   📊 Response Time: ${timing.total}ms (${performanceAnalysis.grade})`)
    console.log(`   📝 Accuracy: ${accuracyAnalysis.accuracyPercentage.toFixed(1)}% (${accuracyAnalysis.quality})`)
    console.log(`   📄 Response Length: ${response.body.length} characters`)
    
    if (accuracyAnalysis.foundContent.length > 0) {
      console.log(`   ✅ Found: ${accuracyAnalysis.foundContent.join(', ')}`)
    }
    
    if (accuracyAnalysis.missingContent.length > 0) {
      console.log(`   ❌ Missing: ${accuracyAnalysis.missingContent.join(', ')}`)
    }
    
    const preview = response.body.substring(0, 100)
    console.log(`   📖 Preview: "${preview}${response.body.length > 100 ? '...' : ''}"`)
    
    return result
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return {
      testCase,
      userId,
      success: false,
      error: error.message,
    }
  }
}

async function runRigorousRAGTest() {
  console.log('🔬 RIGOROUS RAG ACCURACY & PERFORMANCE TEST')
  console.log('='.repeat(80))
  console.log(`Testing ${TEST_CONFIG.testUsers.length} users with ${TEST_CONFIG.testCases.length} test cases each`)
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`)
  
  const allResults = []
  const startTime = Date.now()
  
  try {
    for (const userId of TEST_CONFIG.testUsers) {
      console.log(`\n👤 Testing User: ${userId}`)
      console.log('-'.repeat(50))
      
      for (const testCase of TEST_CONFIG.testCases) {
        const result = await testRAGAccuracy(userId, testCase)
        allResults.push(result)
        
        // Wait between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const totalTime = Date.now() - startTime
    
    // Generate comprehensive report
    generateComprehensiveReport(allResults, totalTime)
    
    // Save results
    const fs = require('fs')
    const path = require('path')
    const reportPath = path.join(__dirname, 'rag-accuracy-test-results.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: TEST_CONFIG,
      results: allResults,
      executionTime: totalTime,
    }, null, 2))
    
    console.log(`\n💾 Results saved to: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

function generateComprehensiveReport(results, totalTime) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 COMPREHENSIVE RAG ACCURACY & PERFORMANCE REPORT')
  console.log('='.repeat(80))
  
  const successfulTests = results.filter(r => r.success)
  const failedTests = results.filter(r => !r.success)
  
  // Overall Statistics
  console.log('\n🎯 OVERALL STATISTICS:')
  console.log(`   Total Tests: ${results.length}`)
  console.log(`   Successful: ${successfulTests.length}`)
  console.log(`   Failed: ${failedTests.length}`)
  console.log(`   Success Rate: ${((successfulTests.length / results.length) * 100).toFixed(1)}%`)
  console.log(`   Total Execution Time: ${(totalTime / 1000).toFixed(1)} seconds`)
  
  if (successfulTests.length === 0) {
    console.log('\n❌ NO SUCCESSFUL TESTS - SYSTEM NOT WORKING')
    return
  }
  
  // Performance Analysis
  console.log('\n⏱️  PERFORMANCE ANALYSIS:')
  const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.timing.total, 0) / successfulTests.length
  const avgFirstByte = successfulTests.reduce((sum, r) => sum + r.timing.firstByte, 0) / successfulTests.length
  const fastestResponse = Math.min(...successfulTests.map(r => r.timing.total))
  const slowestResponse = Math.max(...successfulTests.map(r => r.timing.total))
  
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`)
  console.log(`   Average First Byte: ${avgFirstByte.toFixed(0)}ms`)
  console.log(`   Fastest Response: ${fastestResponse}ms`)
  console.log(`   Slowest Response: ${slowestResponse}ms`)
  
  // Performance Grade Distribution
  const performanceGrades = {}
  successfulTests.forEach(r => {
    const grade = r.performance.grade
    performanceGrades[grade] = (performanceGrades[grade] || 0) + 1
  })
  
  console.log('\n📊 Performance Grade Distribution:')
  Object.entries(performanceGrades)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([grade, count]) => {
      const percentage = ((count / successfulTests.length) * 100).toFixed(1)
      console.log(`   Grade ${grade}: ${count} tests (${percentage}%)`)
    })
  
  // Accuracy Analysis
  console.log('\n🎯 ACCURACY ANALYSIS:')
  const avgAccuracy = successfulTests.reduce((sum, r) => sum + r.accuracy.accuracyPercentage, 0) / successfulTests.length
  const highAccuracyTests = successfulTests.filter(r => r.accuracy.accuracyPercentage >= 90).length
  const mediumAccuracyTests = successfulTests.filter(r => r.accuracy.accuracyPercentage >= 75 && r.accuracy.accuracyPercentage < 90).length
  const lowAccuracyTests = successfulTests.filter(r => r.accuracy.accuracyPercentage < 75).length
  
  console.log(`   Average Accuracy: ${avgAccuracy.toFixed(1)}%`)
  console.log(`   High Accuracy (≥90%): ${highAccuracyTests} tests`)
  console.log(`   Medium Accuracy (75-89%): ${mediumAccuracyTests} tests`)
  console.log(`   Low Accuracy (<75%): ${lowAccuracyTests} tests`)
  
  // Test Case Analysis
  console.log('\n📋 TEST CASE ANALYSIS:')
  const testCaseStats = {}
  
  TEST_CONFIG.testCases.forEach(testCase => {
    const caseResults = successfulTests.filter(r => r.testCase.id === testCase.id)
    if (caseResults.length > 0) {
      const avgTime = caseResults.reduce((sum, r) => sum + r.timing.total, 0) / caseResults.length
      const avgAccuracy = caseResults.reduce((sum, r) => sum + r.accuracy.accuracyPercentage, 0) / caseResults.length
      
      console.log(`   ${testCase.category}:`)
      console.log(`     Avg Time: ${avgTime.toFixed(0)}ms`)
      console.log(`     Avg Accuracy: ${avgAccuracy.toFixed(1)}%`)
      console.log(`     Tests: ${caseResults.length}`)
    }
  })
  
  // Cache Effectiveness (for repeat tests)
  console.log('\n💾 CACHE EFFECTIVENESS:')
  const repeatTests = successfulTests.filter(r => r.testCase.isRepeat)
  const originalTests = successfulTests.filter(r => !r.testCase.isRepeat)
  
  if (repeatTests.length > 0 && originalTests.length > 0) {
    const avgOriginalTime = originalTests.reduce((sum, r) => sum + r.timing.total, 0) / originalTests.length
    const avgRepeatTime = repeatTests.reduce((sum, r) => sum + r.timing.total, 0) / repeatTests.length
    const cacheImprovement = ((avgOriginalTime - avgRepeatTime) / avgOriginalTime) * 100
    
    console.log(`   Original Queries: ${avgOriginalTime.toFixed(0)}ms average`)
    console.log(`   Cached Queries: ${avgRepeatTime.toFixed(0)}ms average`)
    console.log(`   Cache Improvement: ${cacheImprovement.toFixed(1)}%`)
  }
  
  // Final Assessment
  console.log('\n🏆 FINAL ASSESSMENT:')
  
  let overallGrade = 'F'
  let assessment = 'POOR'
  
  if (avgResponseTime < 2000 && avgAccuracy >= 90 && successfulTests.length / results.length >= 0.95) {
    overallGrade = 'A+'
    assessment = 'EXCELLENT'
  } else if (avgResponseTime < 3000 && avgAccuracy >= 80 && successfulTests.length / results.length >= 0.90) {
    overallGrade = 'A'
    assessment = 'VERY GOOD'
  } else if (avgResponseTime < 5000 && avgAccuracy >= 70 && successfulTests.length / results.length >= 0.85) {
    overallGrade = 'B'
    assessment = 'GOOD'
  } else if (avgResponseTime < 8000 && avgAccuracy >= 60 && successfulTests.length / results.length >= 0.80) {
    overallGrade = 'C'
    assessment = 'ACCEPTABLE'
  } else if (avgResponseTime < 15000 && avgAccuracy >= 50 && successfulTests.length / results.length >= 0.70) {
    overallGrade = 'D'
    assessment = 'NEEDS IMPROVEMENT'
  } else {
    overallGrade = 'F'
    assessment = 'POOR'
  }
  
  console.log(`   Overall Grade: ${overallGrade}`)
  console.log(`   Assessment: ${assessment}`)
  console.log(`   Performance: ${avgResponseTime < 3000 ? '✅ FAST' : avgResponseTime < 6000 ? '⚠️  ACCEPTABLE' : '❌ SLOW'}`)
  console.log(`   Accuracy: ${avgAccuracy >= 80 ? '✅ HIGH' : avgAccuracy >= 60 ? '⚠️  MEDIUM' : '❌ LOW'}`)
  console.log(`   Reliability: ${(successfulTests.length / results.length) >= 0.95 ? '✅ EXCELLENT' : (successfulTests.length / results.length) >= 0.90 ? '✅ GOOD' : '⚠️  NEEDS WORK'}`)
  
  console.log('\n' + '='.repeat(80))
}

// Run the test
if (require.main === module) {
  runRigorousRAGTest().catch(console.error)
}

module.exports = { runRigorousRAGTest }


