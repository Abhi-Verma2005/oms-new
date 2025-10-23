#!/usr/bin/env node

/**
 * Clear all test data and prepare for real user testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestData() {
  console.log('🧹 Clearing all test data...');
  
  try {
    // Clear test users and their data
    console.log('🗑️  Removing test users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: {
          startsWith: 'ultra-test-user'
        }
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} test users`);

    // Clear any remaining test knowledge base entries
    console.log('🗑️  Removing test knowledge base entries...');
    const deletedKnowledge = await prisma.userKnowledgeBase.deleteMany({
      where: {
        userId: {
          startsWith: 'ultra-test-user'
        }
      }
    });
    console.log(`✅ Deleted ${deletedKnowledge.count} test knowledge entries`);

    // Clear test semantic cache entries
    console.log('🗑️  Removing test cache entries...');
    const deletedCache = await prisma.semanticCache.deleteMany({
      where: {
        userId: {
          startsWith: 'ultra-test-user'
        }
      }
    });
    console.log(`✅ Deleted ${deletedCache.count} test cache entries`);

    // Clear test performance metrics
    console.log('🗑️  Removing test performance metrics...');
    const deletedMetrics = await prisma.rAGPerformanceMetrics.deleteMany({
      where: {
        userId: {
          startsWith: 'ultra-test-user'
        }
      }
    });
    console.log(`✅ Deleted ${deletedMetrics.count} test metrics`);

    console.log('\n✅ All test data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();

