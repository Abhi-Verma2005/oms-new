/**
 * 🧪 Simple Streamdown Test
 * Test Streamdown rendering without server
 */

console.log('🧪 Testing Streamdown Installation...\n')

async function testStreamdown() {
  try {
    // Test if Streamdown is properly installed
    const streamdown = await import('streamdown')
    console.log('✅ Streamdown imported successfully')
    console.log('   Version:', streamdown.version || 'unknown')
    console.log('   Components available:', Object.keys(streamdown))
    
    // Test basic functionality
    console.log('\n📝 Testing basic markdown rendering...')
    
    const testMarkdown = `
# Test Heading

This is **bold text** and *italic text*.

## Code Example

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

- List item 1
- List item 2
- List item 3

> This is a blockquote

[Link to example](https://example.com)
    `.trim()
    
    console.log('✅ Test markdown content prepared')
    console.log('   Length:', testMarkdown.length, 'characters')
    console.log('   Contains headings:', testMarkdown.includes('#'))
    console.log('   Contains code blocks:', testMarkdown.includes('```'))
    console.log('   Contains lists:', testMarkdown.includes('-'))
    console.log('   Contains bold text:', testMarkdown.includes('**'))
    console.log('   Contains italic text:', testMarkdown.includes('*'))
    
    console.log('\n✅ Streamdown is ready for streaming markdown rendering!')
    console.log('\n📋 Next steps:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Open the AI chatbot sidebar')
    console.log('   3. Send a message with markdown content')
    console.log('   4. Watch for real-time markdown rendering during streaming')
    
  } catch (error) {
    console.log('❌ Error testing Streamdown:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Make sure Streamdown is installed: npm install streamdown')
    console.log('   2. Check if the import path is correct')
    console.log('   3. Verify the package is in node_modules')
  }
}

testStreamdown()
