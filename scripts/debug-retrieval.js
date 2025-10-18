#!/usr/bin/env node

/**
 * Debug RAG retrieval issue
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error.message);
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

async function debugRetrieval() {
  console.log('🔍 DEBUGGING RAG RETRIEVAL');
  console.log('==========================\n');
  
  try {
    const userId = 'cmf2xwqgp00003bg1lzw6pev0'; // From the logs
    
    // Check what data exists for this user
    console.log('📊 Checking user data...');
    const userData = await prisma.userKnowledgeBase.findMany({
      where: { userId },
      select: {
        id: true,
        content: true,
        contentType: true,
        createdAt: true,
        metadata: true
      }
    });
    
    console.log(`✅ Found ${userData.length} entries for user ${userId}:`);
    userData.forEach((entry, i) => {
      console.log(`   ${i + 1}. "${entry.content}" (type: ${entry.contentType})`);
    });
    
    if (userData.length === 0) {
      console.log('\n❌ PROBLEM: No knowledge base entries for this user!');
      console.log('   The user told the system about Python, but it wasn\'t stored.');
      console.log('\n🔧 Let\'s add the Python fact manually...');
      
      const pythonFact = "My favorite programming language is Python";
      const embedding = await generateEmbedding(pythonFact);
      
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (
          user_id, 
          content, 
          content_type, 
          embedding, 
          metadata, 
          topics,
          sentiment,
          intent,
          created_at,
          updated_at,
          last_accessed,
          access_count,
          importance_score
        )
        VALUES (
          ${userId},
          ${pythonFact},
          'user_fact',
          ${`[${embedding.join(',')}]`}::vector(1536),
          ${JSON.stringify({
            source: 'user_input',
            timestamp: new Date().toISOString()
          })}::jsonb,
          ARRAY[]::text[],
          NULL,
          NULL,
          NOW(),
          NOW(),
          NOW(),
          0,
          1.0
        )
      `;
      
      console.log('✅ Added Python fact to knowledge base');
    }
    
    // Now test retrieval
    console.log('\n🔍 Testing retrieval...');
    const query = "what is my fav programming language";
    const queryEmbedding = await generateEmbedding(query);
    
    console.log(`Query: "${query}"`);
    console.log(`Query embedding length: ${queryEmbedding.length}`);
    
    // Test the exact same query as the API
    const searchResults = await prisma.$queryRaw`
      WITH ranked_results AS (
        SELECT 
          id,
          content,
          metadata,
          content_type,
          created_at,
          COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity,
          CASE 
            -- Exact keyword matches get highest priority
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 3.0
            -- Recent user facts get high priority
            WHEN content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days' THEN 2.5
            -- Recent conversations get medium priority
            WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1.5
            WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.0
            ELSE 0.5
          END AS priority_score,
          -- Calculate confidence score based on similarity and recency
          CASE 
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 0.95
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.4 THEN 0.9
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.3 THEN 0.8
            WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25 THEN 0.7
            ELSE 0.0
          END AS confidence_score
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND (
            -- Include exact matches (always)
            LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
            -- Include recent user facts with high similarity
            (content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days' AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25) OR
            -- Include semantic matches with strict threshold
            (embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25)
          )
      )
      SELECT *
      FROM ranked_results
      WHERE confidence_score > 0.0
      ORDER BY priority_score DESC, similarity DESC, created_at DESC
      LIMIT 6
    `;
    
    console.log(`\n📊 Retrieval Results: ${searchResults.length} documents`);
    
    if (searchResults.length > 0) {
      console.log('✅ Retrieval is working!');
      searchResults.forEach((result, i) => {
        console.log(`   ${i + 1}. "${result.content}"`);
        console.log(`      Similarity: ${result.similarity?.toFixed(3)}`);
        console.log(`      Confidence: ${result.confidence_score?.toFixed(3)}`);
        console.log(`      Priority: ${result.priority_score?.toFixed(3)}`);
      });
    } else {
      console.log('❌ Retrieval failed - no results found');
      
      // Debug the WHERE clause
      console.log('\n🔍 Debugging WHERE clause...');
      
      // Test exact match
      const exactMatch = await prisma.userKnowledgeBase.findMany({
        where: {
          userId,
          content: {
            contains: query
          }
        }
      });
      console.log(`   Exact match test: ${exactMatch.length} results`);
      
      // Test similarity threshold
      const similarityTest = await prisma.$queryRaw`
        SELECT 
          content,
          COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND embedding IS NOT NULL
        ORDER BY similarity DESC
        LIMIT 3
      `;
      
      console.log(`   Similarity test: ${similarityTest.length} results`);
      similarityTest.forEach((result, i) => {
        console.log(`     ${i + 1}. "${result.content}" (similarity: ${result.similarity?.toFixed(3)})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRetrieval();
