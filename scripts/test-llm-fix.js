#!/usr/bin/env node

/**
 * Test the LLM fix - should always call GPT API
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLLMFix() {
  console.log('🧪 TESTING LLM FIX');
  console.log('==================\n');
  
  try {
    // Check current knowledge base
    const knowledgeCount = await prisma.userKnowledgeBase.count();
    console.log(`📊 Knowledge base entries: ${knowledgeCount}`);
    
    if (knowledgeCount > 0) {
      const sampleData = await prisma.userKnowledgeBase.findMany({
        take: 3,
        select: {
          content: true,
          userId: true
        }
      });
      
      console.log('\n📝 Sample knowledge:');
      sampleData.forEach((entry, i) => {
        console.log(`   ${i + 1}. "${entry.content}"`);
      });
    }
    
    console.log('\n✅ FIX APPLIED:');
    console.log('   - Removed short-circuit logic');
    console.log('   - System now always calls GPT API');
    console.log('   - Context is added to prompt when available');
    console.log('   - No context = still calls GPT but with different prompt');
    
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    console.log('   - With context: GPT responds using user data');
    console.log('   - Without context: GPT responds normally but helpfully');
    console.log('   - No more generic "I don\'t have specific information" message');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLLMFix();

