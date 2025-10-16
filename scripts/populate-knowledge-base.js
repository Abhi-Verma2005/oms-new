#!/usr/bin/env node

/**
 * 📚 Populate Knowledge Base
 * Adds initial knowledge base entries for testing RAG integration
 */

const { PrismaClient } = require('@prisma/client')

console.log('📚 Populating Knowledge Base...\n')

const prisma = new PrismaClient()

async function populateKnowledgeBase() {
  try {
    console.log('✅ Connected to database via Prisma')

    // Create or find a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    console.log(`📝 Adding knowledge base entries for user: ${testUser.email}`)

    // Define knowledge base entries
    const knowledgeEntries = [
      {
        content: 'SEO strategies include keyword research, on-page optimization, and link building. Focus on high-quality content and technical SEO.',
        contentType: 'conversation',
        topics: ['SEO', 'marketing', 'content'],
        metadata: { source: 'knowledge-base', category: 'marketing', importance: 'high' }
      },
      {
        content: 'Website performance can be improved through image optimization, code minification, CDN usage, and caching strategies.',
        contentType: 'conversation',
        topics: ['performance', 'optimization', 'technical'],
        metadata: { source: 'knowledge-base', category: 'technical', importance: 'high' }
      },
      {
        content: 'Our pricing plans include Basic ($9/month), Pro ($29/month), and Enterprise ($99/month) with different feature sets.',
        contentType: 'document',
        topics: ['pricing', 'plans', 'features'],
        metadata: { source: 'knowledge-base', category: 'business', importance: 'medium' }
      },
      {
        content: 'Customer support is available 24/7 via email, chat, and phone. Our response time is typically under 2 hours.',
        contentType: 'document',
        topics: ['support', 'customer-service', 'help'],
        metadata: { source: 'knowledge-base', category: 'support', importance: 'high' }
      },
      {
        content: 'API documentation covers authentication, endpoints, rate limits, and error handling. Use Bearer tokens for authentication.',
        contentType: 'document',
        topics: ['API', 'documentation', 'technical'],
        metadata: { source: 'knowledge-base', category: 'technical', importance: 'high' }
      },
      {
        content: 'Link building involves creating high-quality content that naturally attracts backlinks from authoritative websites.',
        contentType: 'conversation',
        topics: ['link-building', 'SEO', 'content'],
        metadata: { source: 'knowledge-base', category: 'marketing', importance: 'medium' }
      },
      {
        content: 'E-commerce best practices include mobile optimization, secure payment processing, clear product descriptions, and fast checkout.',
        contentType: 'document',
        topics: ['ecommerce', 'best-practices', 'optimization'],
        metadata: { source: 'knowledge-base', category: 'business', importance: 'high' }
      },
      {
        content: 'Content marketing focuses on creating valuable content to attract and retain customers. Include blogs, videos, and social media.',
        contentType: 'conversation',
        topics: ['content-marketing', 'strategy', 'engagement'],
        metadata: { source: 'knowledge-base', category: 'marketing', importance: 'medium' }
      },
      {
        content: 'Analytics and tracking help measure website performance. Use tools like Google Analytics, heatmaps, and conversion tracking.',
        contentType: 'document',
        topics: ['analytics', 'tracking', 'measurement'],
        metadata: { source: 'knowledge-base', category: 'technical', importance: 'high' }
      },
      {
        content: 'User experience (UX) design focuses on making websites intuitive and user-friendly. Consider navigation, accessibility, and usability.',
        contentType: 'document',
        topics: ['UX', 'design', 'usability'],
        metadata: { source: 'knowledge-base', category: 'design', importance: 'high' }
      }
    ]

    let addedCount = 0
    let skippedCount = 0

    // Add knowledge base entries
    for (const entry of knowledgeEntries) {
      try {
        // Check if entry already exists
        const existingEntry = await prisma.$queryRaw`
          SELECT id FROM user_knowledge_base 
          WHERE user_id = ${testUser.id} AND content = ${entry.content}
        `
        
        if (existingEntry.length > 0) {
          console.log(`  ⏭️  Skipped existing entry: "${entry.content.substring(0, 50)}..."`)
          skippedCount++
          continue
        }

        // Create mock embedding
        const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
        
        // Insert new entry
        await prisma.$executeRaw`
          INSERT INTO user_knowledge_base (user_id, content, content_type, topics, metadata, embedding)
          VALUES (${testUser.id}, ${entry.content}, ${entry.contentType}, ${entry.topics}, ${JSON.stringify(entry.metadata)}::jsonb, ${`[${mockEmbedding.join(',')}]`}::vector(1536))
        `
        
        console.log(`  ✅ Added: "${entry.content.substring(0, 50)}..."`)
        addedCount++
        
      } catch (error) {
        console.log(`  ❌ Failed to add entry: ${error.message}`)
      }
    }

    // Add some conversation history as knowledge
    const conversationEntries = [
      {
        content: 'User asked about improving website SEO. Recommended focusing on keyword research, on-page optimization, and technical SEO.',
        contentType: 'conversation',
        topics: ['SEO', 'conversation', 'help'],
        metadata: { source: 'conversation-history', category: 'support', importance: 'medium' }
      },
      {
        content: 'User inquired about pricing plans. Explained Basic ($9/month), Pro ($29/month), and Enterprise ($99/month) options.',
        contentType: 'conversation',
        topics: ['pricing', 'conversation', 'help'],
        metadata: { source: 'conversation-history', category: 'support', importance: 'medium' }
      },
      {
        content: 'User needed help with website performance. Suggested image optimization, CDN usage, and caching strategies.',
        contentType: 'conversation',
        topics: ['performance', 'conversation', 'help'],
        metadata: { source: 'conversation-history', category: 'support', importance: 'medium' }
      }
    ]

    for (const entry of conversationEntries) {
      try {
        const existingEntry = await prisma.$queryRaw`
          SELECT id FROM user_knowledge_base 
          WHERE user_id = ${testUser.id} AND content = ${entry.content}
        `
        
        if (existingEntry.length > 0) {
          skippedCount++
          continue
        }

        const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
        
        await prisma.$executeRaw`
          INSERT INTO user_knowledge_base (user_id, content, content_type, topics, metadata, embedding)
          VALUES (${testUser.id}, ${entry.content}, ${entry.contentType}, ${entry.topics}, ${JSON.stringify(entry.metadata)}::jsonb, ${`[${mockEmbedding.join(',')}]`}::vector(1536))
        `
        
        console.log(`  ✅ Added conversation: "${entry.content.substring(0, 50)}..."`)
        addedCount++
        
      } catch (error) {
        console.log(`  ❌ Failed to add conversation: ${error.message}`)
      }
    }

    // Summary
    console.log('\n📊 Knowledge Base Population Summary:')
    console.log(`  ✅ Added: ${addedCount} entries`)
    console.log(`  ⏭️  Skipped: ${skippedCount} existing entries`)
    console.log(`  📝 Total entries: ${addedCount + skippedCount}`)

    // Verify entries
    const totalEntries = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM user_knowledge_base WHERE user_id = ${testUser.id}
    `
    
    console.log(`  📊 Verified entries in database: ${totalEntries[0].count}`)

    // Show sample queries that should work well
    console.log('\n🔍 Sample queries to test RAG integration:')
    console.log('  • "How can I improve my website SEO?"')
    console.log('  • "What are your pricing plans?"')
    console.log('  • "How do I optimize website performance?"')
    console.log('  • "What customer support options do you have?"')
    console.log('  • "How do I use your API?"')
    console.log('  • "What are e-commerce best practices?"')

  } catch (error) {
    console.error('❌ Error populating knowledge base:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

populateKnowledgeBase()
