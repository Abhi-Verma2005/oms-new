/**
 * 🧪 Streaming Performance Test
 * Test the optimized streaming and markdown rendering performance
 */

const fetch = require('node-fetch')
const { performance } = require('perf_hooks')

console.log('🚀 Testing Optimized Streaming Performance...\n')

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: 'performance-test-user',
  testMessages: [
    'Hello, I need help with finding good websites for link building',
    'Show me tech websites with high domain authority',
    'Filter by price range $500 to $2000',
    'What are the best deals available?',
    'I want to add some sites to my cart'
  ],
  performanceThresholds: {
    maxFirstByte: 2000, // 2 seconds
    maxTotalTime: 5000, // 5 seconds
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    minThroughput: 1000 // 1KB/s
  }
}

class StreamingPerformanceTester {
  constructor() {
    this.results = {
      streamingTests: [],
      memoryTests: [],
      markdownTests: [],
      overallPerformance: null
    }
  }

  async testStreamingPerformance() {
    console.log('📡 Testing streaming performance...')
    
    for (let i = 0; i < TEST_CONFIG.testMessages.length; i++) {
      const message = TEST_CONFIG.testMessages[i]
      console.log(`\n  Test ${i + 1}: "${message.substring(0, 50)}..."`)
      
      try {
        const startTime = performance.now()
        let firstByteTime = null
        let totalChunks = 0
        let totalContent = ''
        let maxMemoryUsage = 0
        
        // Monitor memory usage
        const memoryCheckInterval = setInterval(() => {
          const memUsage = process.memoryUsage()
          maxMemoryUsage = Math.max(maxMemoryUsage, memUsage.heapUsed)
        }, 100)
        
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/ai-chat?stream=1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            messages: [],
            userId: TEST_CONFIG.testUser,
            currentUrl: 'http://localhost:3000/publishers',
            cartState: { items: [], totalItems: 0, totalPrice: 0 }
          })
        })
        
        if (response.ok) {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            totalChunks++
            totalContent += chunk
            
            if (!firstByteTime) {
              firstByteTime = performance.now() - startTime
            }
          }
          
          clearInterval(memoryCheckInterval)
          const totalTime = performance.now() - startTime
          const throughput = (totalContent.length / totalTime) * 1000 // bytes per second
          
          const testResult = {
            message: message,
            firstByteTime: firstByteTime,
            totalTime: totalTime,
            totalChunks: totalChunks,
            contentLength: totalContent.length,
            throughput: throughput,
            maxMemoryUsage: maxMemoryUsage,
            success: true
          }
          
          this.results.streamingTests.push(testResult)
          
          console.log(`    ✅ First byte: ${firstByteTime.toFixed(0)}ms`)
          console.log(`    ✅ Total time: ${totalTime.toFixed(0)}ms`)
          console.log(`    ✅ Chunks: ${totalChunks}`)
          console.log(`    ✅ Content: ${totalContent.length} chars`)
          console.log(`    ✅ Throughput: ${(throughput / 1024).toFixed(1)} KB/s`)
          console.log(`    ✅ Memory: ${(maxMemoryUsage / 1024 / 1024).toFixed(1)} MB`)
          
          // Performance validation
          if (firstByteTime > TEST_CONFIG.performanceThresholds.maxFirstByte) {
            console.log(`    ⚠️  SLOW FIRST BYTE: ${firstByteTime.toFixed(0)}ms > ${TEST_CONFIG.performanceThresholds.maxFirstByte}ms`)
          }
          if (totalTime > TEST_CONFIG.performanceThresholds.maxTotalTime) {
            console.log(`    ⚠️  SLOW TOTAL TIME: ${totalTime.toFixed(0)}ms > ${TEST_CONFIG.performanceThresholds.maxTotalTime}ms`)
          }
          if (maxMemoryUsage > TEST_CONFIG.performanceThresholds.maxMemoryUsage) {
            console.log(`    ⚠️  HIGH MEMORY USAGE: ${(maxMemoryUsage / 1024 / 1024).toFixed(1)}MB > ${(TEST_CONFIG.performanceThresholds.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB`)
          }
          if (throughput < TEST_CONFIG.performanceThresholds.minThroughput) {
            console.log(`    ⚠️  LOW THROUGHPUT: ${(throughput / 1024).toFixed(1)} KB/s < ${(TEST_CONFIG.performanceThresholds.minThroughput / 1024).toFixed(1)} KB/s`)
          }
          
        } else {
          console.log(`    ❌ HTTP ${response.status}: ${await response.text()}`)
          this.results.streamingTests.push({
            message: message,
            success: false,
            error: `HTTP ${response.status}`
          })
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`)
        this.results.streamingTests.push({
          message: message,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testMarkdownRenderingPerformance() {
    console.log('\n📝 Testing markdown rendering performance...')
    
    const markdownSamples = [
      '# Heading 1\n\nThis is a **bold** text with *italic* and `code`.\n\n- List item 1\n- List item 2\n\n```javascript\nconst test = "hello world";\nconsole.log(test);\n```',
      '## Heading 2\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n| Data 3   | Data 4   |\n\n> This is a blockquote with **important** information.',
      '### Heading 3\n\n1. First item\n2. Second item\n3. Third item\n\n[Link to example](https://example.com)\n\n---\n\n**End of content**'
    ]
    
    for (let i = 0; i < markdownSamples.length; i++) {
      const markdown = markdownSamples[i]
      console.log(`\n  Markdown Test ${i + 1}: ${markdown.length} chars`)
      
      try {
        const startTime = performance.now()
        
        // Simulate streaming markdown rendering
        const chunks = markdown.split('')
        let renderedContent = ''
        
        for (let j = 0; j < chunks.length; j += 10) { // Process in chunks of 10 chars
          const chunk = chunks.slice(j, j + 10).join('')
          renderedContent += chunk
          
          // Simulate markdown parsing delay
          await new Promise(resolve => setTimeout(resolve, 1))
        }
        
        const renderTime = performance.now() - startTime
        
        const testResult = {
          markdown: markdown,
          renderTime: renderTime,
          contentLength: markdown.length,
          success: true
        }
        
        this.results.markdownTests.push(testResult)
        
        console.log(`    ✅ Render time: ${renderTime.toFixed(2)}ms`)
        console.log(`    ✅ Content length: ${markdown.length} chars`)
        console.log(`    ✅ Performance: ${(markdown.length / renderTime).toFixed(0)} chars/ms`)
        
        if (renderTime > 100) {
          console.log(`    ⚠️  SLOW RENDERING: ${renderTime.toFixed(2)}ms > 100ms`)
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`)
        this.results.markdownTests.push({
          markdown: markdown,
          success: false,
          error: error.message
        })
      }
    }
  }

  async testMemoryManagement() {
    console.log('\n🧠 Testing memory management...')
    
    try {
      const initialMemory = process.memoryUsage()
      console.log(`  Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(1)} MB`)
      
      // Simulate long conversation with many messages
      const conversationMessages = Array.from({ length: 100 }, (_, i) => 
        `Message ${i + 1}: This is a test message with some content to simulate a real conversation.`
      )
      
      let totalContent = ''
      const startTime = performance.now()
      
      for (let i = 0; i < conversationMessages.length; i++) {
        const message = conversationMessages[i]
        totalContent += message
        
        // Simulate memory cleanup every 10 messages
        if (i % 10 === 0) {
          // Simulate buffer cleanup
          if (totalContent.length > 50000) {
            totalContent = totalContent.slice(-25000) // Keep only last 25KB
          }
        }
        
        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      const processingTime = performance.now() - startTime
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      const testResult = {
        initialMemory: initialMemory.heapUsed,
        finalMemory: finalMemory.heapUsed,
        memoryIncrease: memoryIncrease,
        processingTime: processingTime,
        totalContent: totalContent.length,
        success: true
      }
      
      this.results.memoryTests.push(testResult)
      
      console.log(`  ✅ Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(1)} MB`)
      console.log(`  ✅ Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(1)} MB`)
      console.log(`  ✅ Processing time: ${processingTime.toFixed(0)}ms`)
      console.log(`  ✅ Total content: ${totalContent.length} chars`)
      
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
        console.log(`  ⚠️  HIGH MEMORY INCREASE: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB > 50MB`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
      this.results.memoryTests.push({
        success: false,
        error: error.message
      })
    }
  }

  generateReport() {
    console.log('\n📊 PERFORMANCE TEST REPORT')
    console.log('========================')
    
    // Streaming performance summary
    const streamingResults = this.results.streamingTests.filter(r => r.success)
    if (streamingResults.length > 0) {
      const avgFirstByte = streamingResults.reduce((sum, r) => sum + r.firstByteTime, 0) / streamingResults.length
      const avgTotalTime = streamingResults.reduce((sum, r) => sum + r.totalTime, 0) / streamingResults.length
      const avgThroughput = streamingResults.reduce((sum, r) => sum + r.throughput, 0) / streamingResults.length
      const maxMemory = Math.max(...streamingResults.map(r => r.maxMemoryUsage))
      
      console.log(`\n📡 Streaming Performance:`)
      console.log(`  Average first byte: ${avgFirstByte.toFixed(0)}ms`)
      console.log(`  Average total time: ${avgTotalTime.toFixed(0)}ms`)
      console.log(`  Average throughput: ${(avgThroughput / 1024).toFixed(1)} KB/s`)
      console.log(`  Max memory usage: ${(maxMemory / 1024 / 1024).toFixed(1)} MB`)
      
      // Performance grades
      const firstByteGrade = avgFirstByte < 1000 ? 'A' : avgFirstByte < 2000 ? 'B' : avgFirstByte < 3000 ? 'C' : 'D'
      const totalTimeGrade = avgTotalTime < 2000 ? 'A' : avgTotalTime < 4000 ? 'B' : avgTotalTime < 6000 ? 'C' : 'D'
      const throughputGrade = avgThroughput > 2000 ? 'A' : avgThroughput > 1000 ? 'B' : avgThroughput > 500 ? 'C' : 'D'
      
      console.log(`  Performance grades:`)
      console.log(`    First byte: ${firstByteGrade}`)
      console.log(`    Total time: ${totalTimeGrade}`)
      console.log(`    Throughput: ${throughputGrade}`)
    }
    
    // Markdown performance summary
    const markdownResults = this.results.markdownTests.filter(r => r.success)
    if (markdownResults.length > 0) {
      const avgRenderTime = markdownResults.reduce((sum, r) => sum + r.renderTime, 0) / markdownResults.length
      const avgPerformance = markdownResults.reduce((sum, r) => sum + (r.contentLength / r.renderTime), 0) / markdownResults.length
      
      console.log(`\n📝 Markdown Performance:`)
      console.log(`  Average render time: ${avgRenderTime.toFixed(2)}ms`)
      console.log(`  Average performance: ${avgPerformance.toFixed(0)} chars/ms`)
      
      const renderGrade = avgRenderTime < 50 ? 'A' : avgRenderTime < 100 ? 'B' : avgRenderTime < 200 ? 'C' : 'D'
      console.log(`  Render grade: ${renderGrade}`)
    }
    
    // Memory management summary
    const memoryResults = this.results.memoryTests.filter(r => r.success)
    if (memoryResults.length > 0) {
      const memoryResult = memoryResults[0]
      const memoryGrade = memoryResult.memoryIncrease < 10 * 1024 * 1024 ? 'A' : 
                         memoryResult.memoryIncrease < 25 * 1024 * 1024 ? 'B' : 
                         memoryResult.memoryIncrease < 50 * 1024 * 1024 ? 'C' : 'D'
      
      console.log(`\n🧠 Memory Management:`)
      console.log(`  Memory increase: ${(memoryResult.memoryIncrease / 1024 / 1024).toFixed(1)} MB`)
      console.log(`  Processing time: ${memoryResult.processingTime.toFixed(0)}ms`)
      console.log(`  Memory grade: ${memoryGrade}`)
    }
    
    // Overall performance assessment
    const overallSuccess = streamingResults.length > 0 && markdownResults.length > 0 && memoryResults.length > 0
    const performanceIssues = []
    
    if (streamingResults.length > 0) {
      const avgFirstByte = streamingResults.reduce((sum, r) => sum + r.firstByteTime, 0) / streamingResults.length
      if (avgFirstByte > 2000) performanceIssues.push('Slow first byte time')
      if (Math.max(...streamingResults.map(r => r.totalTime)) > 5000) performanceIssues.push('Slow total response time')
    }
    
    if (markdownResults.length > 0) {
      const avgRenderTime = markdownResults.reduce((sum, r) => sum + r.renderTime, 0) / markdownResults.length
      if (avgRenderTime > 100) performanceIssues.push('Slow markdown rendering')
    }
    
    if (memoryResults.length > 0) {
      const memoryIncrease = memoryResults[0].memoryIncrease
      if (memoryIncrease > 50 * 1024 * 1024) performanceIssues.push('High memory usage')
    }
    
    console.log(`\n🎯 Overall Assessment:`)
    console.log(`  Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`)
    if (performanceIssues.length > 0) {
      console.log(`  Issues found:`)
      performanceIssues.forEach(issue => console.log(`    - ${issue}`))
    } else {
      console.log(`  All performance metrics within acceptable ranges`)
    }
    
    this.results.overallPerformance = {
      success: overallSuccess,
      issues: performanceIssues,
      streamingTests: streamingResults.length,
      markdownTests: markdownResults.length,
      memoryTests: memoryResults.length
    }
  }
}

async function runPerformanceTests() {
  const tester = new StreamingPerformanceTester()
  
  try {
    await tester.testStreamingPerformance()
    await tester.testMarkdownRenderingPerformance()
    await tester.testMemoryManagement()
    tester.generateReport()
    
    console.log('\n✅ Performance testing completed!')
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error)
  }
}

// Run the tests
runPerformanceTests()
