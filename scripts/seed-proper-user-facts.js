#!/usr/bin/env node

/**
 * 🌱 SEED PROPER USER FACTS
 * Creates correct user_fact entries for testing
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProperUserFacts() {
  console.log('🌱 Seeding proper user facts...')
  
  try {
    // Clear existing incorrect user facts
    console.log('🧹 Cleaning existing user facts...')
    await prisma.userKnowledgeBase.deleteMany({
      where: {
        contentType: 'user_fact'
      }
    })
    
    // Seed proper user facts
    const userFacts = [
      {
        userId: 'test-user-1',
        content: 'Name: Test User One',
        topics: ['personal_info', 'name']
      },
      {
        userId: 'test-user-1',
        content: 'Age: 25 years old',
        topics: ['personal_info', 'age']
      },
      {
        userId: 'test-user-2',
        content: 'Name: Test User Two',
        topics: ['personal_info', 'name']
      },
      {
        userId: 'test-user-2',
        content: 'Age: 30 years old',
        topics: ['personal_info', 'age']
      },
      {
        userId: 'test-user-3',
        content: 'Name: Test User Three',
        topics: ['personal_info', 'name']
      },
      {
        userId: 'test-user-3',
        content: 'Age: 35 years old',
        topics: ['personal_info', 'age']
      },
      {
        userId: 'test-user-quick',
        content: 'Name: Test User One',
        topics: ['personal_info', 'name']
      },
      {
        userId: 'test-user-quick',
        content: 'Age: 25 years old',
        topics: ['personal_info', 'age']
      }
    ]
    
    console.log('📝 Creating proper user facts...')
    
    for (const fact of userFacts) {
      await prisma.userKnowledgeBase.create({
        data: {
          userId: fact.userId,
          content: fact.content,
          contentType: 'user_fact',
          metadata: {
            source: 'seeded_test_data',
            created: new Date().toISOString()
          },
          topics: fact.topics
        }
      })
      console.log(`✅ Created: ${fact.userId} - ${fact.content}`)
    }
    
    // Add conversation context for better testing
    console.log('💬 Adding conversation context...')
    
    const conversationContext = [
      {
        userId: 'test-user-1',
        content: 'We discussed high-traffic websites including TechCrunch, Product Hunt, and other technology platforms for business recommendations.',
        topics: ['conversation', 'websites', 'recommendations']
      },
      {
        userId: 'test-user-2',
        content: 'We discussed high-traffic websites including TechCrunch, Product Hunt, and other technology platforms for business recommendations.',
        topics: ['conversation', 'websites', 'recommendations']
      },
      {
        userId: 'test-user-3',
        content: 'We discussed high-traffic websites including TechCrunch, Product Hunt, and other technology platforms for business recommendations.',
        topics: ['conversation', 'websites', 'recommendations']
      },
      {
        userId: 'test-user-quick',
        content: 'We discussed high-traffic websites including TechCrunch, Product Hunt, and other technology platforms for business recommendations.',
        topics: ['conversation', 'websites', 'recommendations']
      }
    ]
    
    for (const context of conversationContext) {
      await prisma.userKnowledgeBase.create({
        data: {
          userId: context.userId,
          content: context.content,
          contentType: 'conversation',
          metadata: {
            source: 'seeded_conversation',
            created: new Date().toISOString()
          },
          topics: context.topics
        }
      })
      console.log(`✅ Added conversation context for ${context.userId}`)
    }
    
    console.log('\n🎉 User facts seeded successfully!')
    console.log('\n📊 Verification:')
    
    // Verify the data
    const userFactCount = await prisma.userKnowledgeBase.count({
      where: { contentType: 'user_fact' }
    })
    
    const conversationCount = await prisma.userKnowledgeBase.count({
      where: { contentType: 'conversation' }
    })
    
    console.log(`   User Facts: ${userFactCount}`)
    console.log(`   Conversations: ${conversationCount}`)
    
  } catch (error) {
    console.error('❌ Error seeding user facts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedProperUserFacts().catch(console.error)
}

module.exports = { seedProperUserFacts }


