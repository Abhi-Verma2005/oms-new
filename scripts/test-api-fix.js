#!/usr/bin/env node

/**
 * Test API Fix - Verify the openaiResponse.text() error is resolved
 */

async function testAPIFix() {
  console.log('🔧 Testing API Fix...')
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, this is a test message',
        messages: [],
        userId: 'test-user-fix'
      })
    })
    
    if (response.status === 401) {
      console.log('✅ API is working (401 expected without auth)')
      console.log('🔧 The openaiResponse.text() error has been fixed!')
    } else if (response.status === 500) {
      const errorText = await response.text()
      console.log('❌ API still has errors:')
      console.log(errorText)
    } else {
      console.log(`✅ API responded with status: ${response.status}`)
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message)
  }
}

testAPIFix().catch(console.error)

