#!/usr/bin/env node

/**
 * Test current RAG system status
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCurrentRAG() {
  console.log('🔍 TESTING CURRENT RAG SYSTEM');
  console.log('=============================\n');
  
  try {
    // Check if we have any users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          name: true
        }
      });
      
      console.log('\n📋 Sample users:');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name || 'No name'} (${user.email}) - ID: ${user.id}`);
      });
    }
    
    // Check knowledge base status
    const knowledgeCount = await prisma.userKnowledgeBase.count();
    console.log(`\n🧠 Knowledge base entries: ${knowledgeCount}`);
    
    if (knowledgeCount === 0) {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      console.log('   The RAG system has no user knowledge base data!');
      console.log('   This is why you\'re getting the generic message.');
      console.log('\n💡 SOLUTION:');
      console.log('   We need to add some user data to test the system.');
      
      // Add a simple test fact for the first user
      if (userCount > 0) {
        const firstUser = await prisma.user.findFirst({
          select: { id: true, email: true, name: true }
        });
        
        console.log(`\n🔧 Adding test data for user: ${firstUser?.name || firstUser?.email}`);
        
        // Add a simple fact
        await prisma.userKnowledgeBase.create({
          data: {
            userId: firstUser.id,
            content: "My favorite food is pizza",
            contentType: "user_fact",
            metadata: {
              source: "user_input",
              timestamp: new Date().toISOString()
            }
          }
        });
        
        console.log('✅ Added test fact: "My favorite food is pizza"');
        
        // Verify it was added
        const newCount = await prisma.userKnowledgeBase.count();
        console.log(`✅ Knowledge base now has ${newCount} entries`);
      }
    } else {
      console.log('\n✅ Knowledge base has data - RAG should work');
      
      // Show some sample data
      const sampleData = await prisma.userKnowledgeBase.findMany({
        take: 3,
        select: {
          content: true,
          userId: true,
          createdAt: true
        }
      });
      
      console.log('\n📝 Sample knowledge base entries:');
      sampleData.forEach((entry, i) => {
        console.log(`   ${i + 1}. "${entry.content}" (user: ${entry.userId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentRAG();

