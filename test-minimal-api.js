const fetch = require('node-fetch')

async function testMinimalAPI() {
  console.log('🧪 Testing minimal AI API...')
  
  try {
    // Get a real user ID from the database
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const user = await prisma.user.findFirst({
      select: { id: true, email: true }
    })
    
    if (!user) {
      console.error('❌ No users found in database')
      return
    }
    
    console.log(`👤 Testing with user: ${user.email} (${user.id})`)
    
    const testData = {
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you help me search for documents about AI?'
        }
      ],
      userId: user.id
    }
    
    console.log('📤 Sending request to /api/chat-minimal...')
    
    const response = await fetch('http://localhost:3000/api/chat-minimal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      return
    }
    
    console.log('✅ API Response received!')
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    // Read the streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    
    console.log('📡 Reading streaming response...')
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      fullResponse += chunk
      console.log('📦 Chunk:', chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''))
    }
    
    console.log('✅ Full response received!')
    console.log('📝 Response length:', fullResponse.length)
    
    // Check if conversation was updated in database
    const updatedConversation = await prisma.$queryRaw`
      SELECT messages, updated_at FROM conversations WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (updatedConversation.length > 0) {
      const messages = updatedConversation[0].messages
      console.log('✅ Conversation updated in database!')
      console.log('📊 Messages count:', messages.length)
      console.log('🕒 Last updated:', updatedConversation[0].updated_at)
    } else {
      console.log('❌ Conversation not found in database')
    }
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testMinimalAPI()
