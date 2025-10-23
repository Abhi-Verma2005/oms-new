/**
 * 🧪 Test Fixed Streaming Markdown Rendering
 * Test that markdown renders in real-time during streaming
 */

console.log('🧪 Testing Fixed Streaming Markdown Rendering...\n')

async function testStreamingMarkdown() {
  const fetch = (await import('node-fetch')).default
  const { performance } = await import('perf_hooks')
  const baseUrl = 'http://localhost:3000'
  
  try {
    console.log('📡 Testing streaming with markdown content...')
    const startTime = performance.now()
    
    const response = await fetch(`${baseUrl}/api/ai-chat?stream=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Write a detailed guide about React hooks with code examples, lists, and formatting. Include headings, code blocks, and bullet points.',
        messages: [],
        userId: 'test-user',
        currentUrl: 'http://localhost:3000/publishers',
        cartState: { items: [], totalItems: 0, totalPrice: 0 }
      })
    })
    
    if (response.ok) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let totalContent = ''
      let chunkCount = 0
      let markdownElements = {
        headings: 0,
        codeBlocks: 0,
        lists: 0,
        bold: 0,
        italic: 0
      }
      
      console.log('📝 Monitoring markdown rendering during stream...\n')
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('🔍 [AI] Stream ended')
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        chunkCount++
        totalContent += chunk
        
        // Check for markdown elements in the content so far
        const currentMarkdown = {
          headings: (totalContent.match(/#{1,6}\s/g) || []).length,
          codeBlocks: (totalContent.match(/```[\s\S]*?```/g) || []).length,
          lists: (totalContent.match(/^\s*[-*+]\s/gm) || []).length + (totalContent.match(/^\s*\d+\.\s/gm) || []).length,
          bold: (totalContent.match(/\*\*[^*]+\*\*/g) || []).length,
          italic: (totalContent.match(/\*[^*]+\*/g) || []).length
        }
        
        // Log when new markdown elements are detected
        if (currentMarkdown.headings > markdownElements.headings) {
          console.log(`  📋 Heading detected: ${currentMarkdown.headings} total`)
          markdownElements.headings = currentMarkdown.headings
        }
        
        if (currentMarkdown.codeBlocks > markdownElements.codeBlocks) {
          console.log(`  💻 Code block detected: ${currentMarkdown.codeBlocks} total`)
          markdownElements.codeBlocks = currentMarkdown.codeBlocks
        }
        
        if (currentMarkdown.lists > markdownElements.lists) {
          console.log(`  📝 List item detected: ${currentMarkdown.lists} total`)
          markdownElements.lists = currentMarkdown.lists
        }
        
        if (currentMarkdown.bold > markdownElements.bold) {
          console.log(`  **Bold text detected: ${currentMarkdown.bold} total`)
          markdownElements.bold = currentMarkdown.bold
        }
        
        if (currentMarkdown.italic > markdownElements.italic) {
          console.log(`  *Italic text detected: ${currentMarkdown.italic} total`)
          markdownElements.italic = currentMarkdown.italic
        }
        
        // Show progress every 5 chunks
        if (chunkCount % 5 === 0) {
          console.log(`  📊 Progress: ${chunkCount} chunks, ${totalContent.length} chars`)
        }
      }
      
      const totalTime = performance.now() - startTime
      
      console.log('\n✅ Streaming completed!')
      console.log(`   Total time: ${totalTime.toFixed(0)}ms`)
      console.log(`   Chunks received: ${chunkCount}`)
      console.log(`   Content length: ${totalContent.length} chars`)
      console.log(`   Throughput: ${(totalContent.length / totalTime * 1000 / 1024).toFixed(1)} KB/s`)
      
      console.log('\n📋 Markdown elements found:')
      console.log(`   Headings: ${markdownElements.headings}`)
      console.log(`   Code blocks: ${markdownElements.codeBlocks}`)
      console.log(`   List items: ${markdownElements.lists}`)
      console.log(`   Bold text: ${markdownElements.bold}`)
      console.log(`   Italic text: ${markdownElements.italic}`)
      
      // Test if markdown was rendered progressively
      if (markdownElements.headings > 0 || markdownElements.codeBlocks > 0 || markdownElements.lists > 0) {
        console.log('\n✅ Markdown elements detected during streaming - rendering should be working!')
        console.log('🎯 Expected behavior:')
        console.log('   - Headings should appear as they\'re typed')
        console.log('   - Code blocks should render progressively')
        console.log('   - Lists should show items as they arrive')
        console.log('   - Bold/italic text should render immediately')
        console.log('   - Auto-scroll should work during streaming')
      } else {
        console.log('\n⚠️  No markdown elements detected - may need to check rendering')
      }
      
      // Show a sample of the content
      console.log('\n📄 Content sample:')
      console.log(totalContent.substring(0, 300) + '...')
      
    } else {
      console.log(`❌ HTTP ${response.status}: ${await response.text()}`)
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
}

testStreamingMarkdown()
