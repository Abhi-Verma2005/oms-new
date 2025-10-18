#!/usr/bin/env node

/**
 * Clear ALL vector data and embeddings from database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllVectorData() {
  console.log('🧹 CLEARING ALL VECTOR DATA AND EMBEDDINGS');
  console.log('==========================================\n');
  
  try {
    // Clear all knowledge base entries (contains embeddings)
    console.log('🗑️  Clearing user_knowledge_base...');
    const deletedKnowledge = await prisma.userKnowledgeBase.deleteMany({});
    console.log(`✅ Deleted ${deletedKnowledge.count} knowledge base entries`);

    // Clear all semantic cache entries (contains embeddings)
    console.log('🗑️  Clearing semantic_cache...');
    const deletedCache = await prisma.semanticCache.deleteMany({});
    console.log(`✅ Deleted ${deletedCache.count} semantic cache entries`);

    // Clear all performance metrics
    console.log('🗑️  Clearing RAG performance metrics...');
    const deletedMetrics = await prisma.rAGPerformanceMetrics.deleteMany({});
    console.log(`✅ Deleted ${deletedMetrics.count} performance metrics`);

    // Clear any other embedding-related tables
    console.log('🗑️  Clearing user_interaction_embeddings...');
    try {
      const deletedInteractions = await prisma.user_interaction_embeddings.deleteMany({});
      console.log(`✅ Deleted ${deletedInteractions.count} interaction embeddings`);
    } catch (error) {
      console.log('⚠️  user_interaction_embeddings table not found or empty');
    }

    console.log('🗑️  Clearing content_embeddings...');
    try {
      const deletedContent = await prisma.content_embeddings.deleteMany({});
      console.log(`✅ Deleted ${deletedContent.count} content embeddings`);
    } catch (error) {
      console.log('⚠️  content_embeddings table not found or empty');
    }

    console.log('🗑️  Clearing product_embeddings...');
    try {
      const deletedProducts = await prisma.product_embeddings.deleteMany({});
      console.log(`✅ Deleted ${deletedProducts.count} product embeddings`);
    } catch (error) {
      console.log('⚠️  product_embeddings table not found or empty');
    }

    console.log('🗑️  Clearing user_context_profiles...');
    try {
      const deletedProfiles = await prisma.user_context_profiles.deleteMany({});
      console.log(`✅ Deleted ${deletedProfiles.count} user context profiles`);
    } catch (error) {
      console.log('⚠️  user_context_profiles table not found or empty');
    }

    // Verify everything is cleared
    console.log('\n📊 Verifying all vector data is cleared...');
    
    const remainingKnowledge = await prisma.userKnowledgeBase.count();
    const remainingCache = await prisma.semanticCache.count();
    const remainingMetrics = await prisma.rAGPerformanceMetrics.count();
    
    console.log(`   user_knowledge_base: ${remainingKnowledge} entries`);
    console.log(`   semantic_cache: ${remainingCache} entries`);
    console.log(`   rag_performance_metrics: ${remainingMetrics} entries`);

    if (remainingKnowledge === 0 && remainingCache === 0 && remainingMetrics === 0) {
      console.log('\n🎉 SUCCESS: All vector data and embeddings cleared!');
      console.log('✅ Database is now clean of all vector/embedding data');
    } else {
      console.log('\n⚠️  WARNING: Some vector data may still remain');
    }

  } catch (error) {
    console.error('❌ Error clearing vector data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllVectorData();
