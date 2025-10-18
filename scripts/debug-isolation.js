#!/usr/bin/env node

/**
 * Debug Isolation Issue
 * Check if the problem is in our test or the actual RAG system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugIsolation() {
  console.log('🔍 DEBUGGING ISOLATION ISSUE');
  console.log('============================\n');
  
  try {
    // Check what data exists for each user
    console.log('📊 Checking existing data per user...');
    
    const users = ['cmguyt4nk0022urt735eayso8', 'test-user-simple', 'test-user-quick'];
    
    for (const userId of users) {
      const userData = await prisma.userKnowledgeBase.findMany({
        where: { userId },
        select: {
          id: true,
          content: true,
          userId: true,
          createdAt: true
        }
      });
      
      console.log(`\n👤 User ${userId}:`);
      console.log(`   Found ${userData.length} entries`);
      userData.forEach((entry, i) => {
        console.log(`   ${i + 1}. "${entry.content}"`);
      });
    }
    
    // Test a simple query to see if user filtering works
    console.log('\n🔍 Testing simple user filtering...');
    
    const testQuery = "What do you know about me?";
    const userId = 'cmguyt4nk0022urt735eayso8';
    
    // Direct query with user filter
    const directResults = await prisma.userKnowledgeBase.findMany({
      where: {
        userId: userId,
        content: {
          contains: 'marketing'
        }
      },
      select: {
        id: true,
        content: true,
        userId: true
      }
    });
    
    console.log(`\n✅ Direct query for user ${userId} (marketing content):`);
    console.log(`   Found ${directResults.length} results`);
    directResults.forEach((result, i) => {
      console.log(`   ${i + 1}. "${result.content}" (user: ${result.userId})`);
    });
    
    // Test if we can get other users' data (this should be empty)
    const otherUsersResults = await prisma.userKnowledgeBase.findMany({
      where: {
        userId: {
          not: userId
        },
        content: {
          contains: 'marketing'
        }
      },
      select: {
        id: true,
        content: true,
        userId: true
      }
    });
    
    console.log(`\n❌ Query for OTHER users (marketing content):`);
    console.log(`   Found ${otherUsersResults.length} results`);
    otherUsersResults.forEach((result, i) => {
      console.log(`   ${i + 1}. "${result.content}" (user: ${result.userId})`);
    });
    
    if (otherUsersResults.length > 0) {
      console.log('\n🚨 SECURITY ISSUE: Other users data is accessible!');
    } else {
      console.log('\n✅ SECURITY OK: Other users data is properly isolated');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugIsolation();
