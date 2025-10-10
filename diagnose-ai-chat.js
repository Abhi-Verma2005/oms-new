const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function diagnoseAIChat() {
  try {
    console.log('🔍 AI Chat System Diagnostics')
    console.log('================================')
    
    // Test 1: Database Connection
    console.log('\n1. Testing Database Connection...')
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection: OK')
    } catch (error) {
      console.log('❌ Database connection: FAILED -', error.message)
      return
    }
    
    // Test 2: Check OpenAI API Key
    console.log('\n2. Checking OpenAI Configuration...')
    if (process.env.OPEN_AI_KEY) {
      console.log('✅ OpenAI API Key: Configured')
      console.log(`   Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`)
    } else {
      console.log('❌ OpenAI API Key: NOT CONFIGURED')
      return
    }
    
    // Test 3: Test OpenAI API Directly
    console.log('\n3. Testing OpenAI API Directly...')
    try {
      const startTime = Date.now()
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'user', content: 'Hello, this is a test message.' }
          ],
          max_tokens: 50
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ OpenAI API: OK (${duration}ms)`)
        console.log(`   Response: "${data.choices[0].message.content}"`)
      } else {
        const errorText = await response.text()
        console.log(`❌ OpenAI API: FAILED (${response.status}) - ${errorText}`)
      }
    } catch (error) {
      console.log('❌ OpenAI API: ERROR -', error.message)
    }
    
    // Test 4: Check User Interactions Table
    console.log('\n4. Checking User Interactions...')
    try {
      const userCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM user_interactions
      `
      console.log(`✅ User interactions table: OK (${userCount[0].count} records)`)
      
      const recentInteractions = await prisma.$queryRaw`
        SELECT id, "userId", "interactionType", content, response, timestamp
        FROM user_interactions 
        ORDER BY timestamp DESC 
        LIMIT 3
      `
      
      if (recentInteractions.length > 0) {
        console.log('   Recent interactions:')
        recentInteractions.forEach((interaction, i) => {
          console.log(`   ${i + 1}. ${interaction.userId}: "${interaction.content.substring(0, 50)}..." (${interaction.timestamp})`)
        })
      }
    } catch (error) {
      console.log('❌ User interactions: ERROR -', error.message)
    }
    
    // Test 5: Check AI Chatbot Config
    console.log('\n5. Checking AI Chatbot Configuration...')
    try {
      const config = await prisma.aIChatbotConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      })
      
      if (config) {
        console.log('✅ AI Chatbot config: OK')
        console.log(`   System prompt length: ${config.systemPrompt?.length || 0} characters`)
        console.log(`   Last updated: ${config.updatedAt}`)
      } else {
        console.log('⚠️ AI Chatbot config: No active config found')
      }
      
      const navItems = await prisma.aIChatbotNavigation.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
      
      console.log(`   Navigation items: ${navItems.length}`)
    } catch (error) {
      console.log('❌ AI Chatbot config: ERROR -', error.message)
    }
    
    // Test 6: Check User Context System
    console.log('\n6. Checking User Context System...')
    try {
      const userContextCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "userAIInsights"
      `
      console.log(`✅ User AI Insights: OK (${userContextCount[0].count} records)`)
      
      const userProfiles = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM user_profiles
      `
      console.log(`✅ User Profiles: OK (${userProfiles[0].count} records)`)
    } catch (error) {
      console.log('❌ User Context System: ERROR -', error.message)
    }
    
    // Test 7: Performance Test - Simulate AI Chat Request
    console.log('\n7. Performance Test - Simulating AI Chat Request...')
    try {
      const testMessage = 'Hello, this is a performance test message.'
      const startTime = Date.now()
      
      // Simulate the request processing time
      const systemPrompt = `You are a helpful AI assistant. Keep responses concise.`
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testMessage }
      ]
      
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPEN_AI_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.7,
          max_tokens: 100
        })
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (openAIResponse.ok) {
        const data = await openAIResponse.json()
        console.log(`✅ Performance test: OK (${duration}ms)`)
        console.log(`   Response: "${data.choices[0].message.content}"`)
        
        if (duration > 3000) {
          console.log('⚠️ WARNING: Response time is slow (>3 seconds)')
        } else if (duration > 1000) {
          console.log('⚠️ WARNING: Response time is moderate (>1 second)')
        } else {
          console.log('✅ Response time is good (<1 second)')
        }
      } else {
        console.log(`❌ Performance test: FAILED (${openAIResponse.status})`)
      }
    } catch (error) {
      console.log('❌ Performance test: ERROR -', error.message)
    }
    
    // Test 8: Check for Common Issues
    console.log('\n8. Checking for Common Issues...')
    
    // Check if there are any very long system prompts
    try {
      const longPrompts = await prisma.$queryRaw`
        SELECT id, LENGTH("systemPrompt") as prompt_length
        FROM "aIChatbotConfig" 
        WHERE LENGTH("systemPrompt") > 5000
        ORDER BY LENGTH("systemPrompt") DESC
      `
      
      if (longPrompts.length > 0) {
        console.log('⚠️ WARNING: Found very long system prompts:')
        longPrompts.forEach(prompt => {
          console.log(`   Config ${prompt.id}: ${prompt.prompt_length} characters`)
        })
        console.log('   This can cause slow response times.')
      } else {
        console.log('✅ System prompt lengths: OK')
      }
    } catch (error) {
      console.log('❌ System prompt check: ERROR -', error.message)
    }
    
    // Check for database performance issues
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM user_interactions 
        WHERE timestamp < NOW() - INTERVAL '1 hour'
      `
      
      if (slowQueries[0].count > 1000) {
        console.log(`⚠️ WARNING: Large number of old interactions (${slowQueries[0].count})`)
        console.log('   Consider archiving old data for better performance.')
      } else {
        console.log('✅ Database performance: OK')
      }
    } catch (error) {
      console.log('❌ Database performance check: ERROR -', error.message)
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE')
    console.log('================================')
    console.log('If you see any ❌ or ⚠️ warnings above, those are the issues causing slow responses.')
    console.log('The optimized route should resolve most performance problems.')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

diagnoseAIChat()
