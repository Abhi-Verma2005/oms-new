#!/usr/bin/env node

/**
 * 🔍 Debug RAG API Issues
 * Debug the 500 errors in non-streaming requests
 */

console.log('🔍 Debugging RAG API Issues...\n')

async function debugRAGAPI() {
  try {
    console.log('🔍 Testing simple non-streaming request...')
    
    const response = await fetch('http://localhost:3000/api/ai-chat-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        userId: 'debug-test-user',
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        clientConfig: {},
        cartState: null,
        currentUrl: '/test'
      })
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response ok: ${response.ok}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response: ${errorText}`)
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText)
        console.log(`📊 Error data:`, errorData)
      } catch (e) {
        console.log(`📊 Raw error text: ${errorText}`)
      }
    } else {
      const responseData = await response.json()
      console.log(`✅ Success response:`, responseData)
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message)
  }
}

debugRAGAPI()
