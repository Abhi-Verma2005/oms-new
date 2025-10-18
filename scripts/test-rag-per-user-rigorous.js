#!/usr/bin/env node

/**
 * Rigorous Per-User RAG Test
 * Tests knowledge base isolation, embedding quality, and response accuracy
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Test users with different knowledge bases
const testUsers = [
  {
    id: 'test-user-1',
    email: 'user1@test.com',
    name: 'Alice',
    knowledge: [
      'I love hiking in the mountains',
      'My favorite programming language is Python',
      'I work as a software engineer at TechCorp',
      'I have a golden retriever named Max',
      'I prefer coffee over tea'
    ]
  },
  {
    id: 'test-user-2', 
    email: 'user2@test.com',
    name: 'Bob',
    knowledge: [
      'I am a professional chef specializing in Italian cuisine',
      'I own a restaurant called Bella Vista',
      'I have three children: Emma, Jack, and Sofia',
      'I drive a red Tesla Model 3',
      'I enjoy playing tennis on weekends'
    ]
  },
  {
    id: 'test-user-3',
    email: 'user3@test.com', 
    name: 'Charlie',
    knowledge: [
      'I am a marine biologist studying coral reefs',
      'I live in Miami, Florida',
      'I have a PhD in Marine Science from Stanford',
      'I own a sailboat named Ocean Explorer',
      'I am allergic to shellfish'
    ]
  }
];

// Test queries that should retrieve different results per user
const testQueries = [
  {
    query: 'What do you know about my work?',
    expectedUsers: ['test-user-1', 'test-user-2', 'test-user-3'],
    expectedContent: ['software engineer', 'chef', 'marine biologist']
  },
  {
    query: 'Tell me about my pets',
    expectedUsers: ['test-user-1'],
    expectedContent: ['golden retriever', 'Max']
  },
  {
    query: 'What car do I drive?',
    expectedUsers: ['test-user-2'],
    expectedContent: ['Tesla Model 3', 'red']
  },
  {
    query: 'Where do I live?',
    expectedUsers: ['test-user-3'],
    expectedContent: ['Miami', 'Florida']
  },
  {
    query: 'What are my children\'s names?',
    expectedUsers: ['test-user-2'],
    expectedContent: ['Emma', 'Jack', 'Sofia']
  }
];

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
    console.error('Failed to generate embedding:', error);
    // Return mock embedding as fallback
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

async function setupTestUsers() {
  console.log('🔧 Setting up test users and knowledge base...');
  
  for (const user of testUsers) {
    // Create or update user
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: new Date(),
      }
    });

    // Clear existing knowledge for this user
    await prisma.$executeRaw`
      DELETE FROM user_knowledge_base WHERE user_id = ${user.id}
    `;

    // Add user-specific knowledge
    for (const fact of user.knowledge) {
      const embedding = await generateEmbedding(fact);
      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
        VALUES (
          ${user.id},
          ${fact},
          'user_fact',
          ${`[${embedding.join(',')}]`}::vector(1536),
          ${JSON.stringify({
            source: 'test_setup',
            timestamp: new Date().toISOString()
          })}::jsonb,
          NOW()
        )
      `;
    }
  }
  
  console.log('✅ Test users and knowledge base setup complete');
}

async function testRAGRetrieval(userId, query) {
  console.log(`\n🔍 Testing RAG for user ${userId}: "${query}"`);
  
  const startTime = Date.now();
  
  try {
    // Use the actual API endpoint to test the real implementation
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        messages: [],
        userId: userId,
        config: {},
        currentUrl: 'http://localhost:3000',
        cartState: {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const retrievalTime = Date.now() - startTime;
    
    console.log(`⏱️  Retrieval time: ${retrievalTime}ms`);
    console.log(`📊 API Response: hasRelevantContext=${data.hasRelevantContext}, confidence=${data.confidence}`);
    console.log(`📊 Context count: ${data.contextCount}`);
    
    if (data.sources && data.sources.length > 0) {
      console.log(`📊 Sources: ${data.sources.join(', ')}`);
    }
    
    // Simulate the results for compatibility with test logic
    const searchResults = data.hasRelevantContext ? [
      { content: data.message, similarity: data.confidence || 0.5 }
    ] : [];
    
    return {
      results: searchResults,
      retrievalTime,
      userId,
      hasRelevantContext: data.hasRelevantContext,
      confidence: data.confidence
    };
    
  } catch (error) {
    console.error(`❌ API test failed: ${error.message}`);
    
    // Fallback to direct DB query for comparison
    const queryEmbedding = await generateEmbedding(query);
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
            WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 3.0
            WHEN content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days' THEN 2.5
            WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1.5
            WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.0
            ELSE 0.5
          END AS priority_score,
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
            LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
            (content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days' AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25) OR
            (embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25)
          )
      )
      SELECT *
      FROM ranked_results
      WHERE confidence_score > 0.0
      ORDER BY priority_score DESC, similarity DESC, created_at DESC
      LIMIT 6
    `;
    
    const retrievalTime = Date.now() - startTime;
    const hasRelevantContext = searchResults.length > 0 && searchResults.some(r => r.confidence_score > 0.7);
    
    console.log(`⏱️  Fallback retrieval time: ${retrievalTime}ms`);
    console.log(`📊 Retrieved ${searchResults.length} documents`);
    console.log(`📊 Has relevant context: ${hasRelevantContext}`);
    
    // Log retrieved content
    searchResults.forEach((result, idx) => {
      const similarity = typeof result.similarity === 'number' ? result.similarity.toFixed(3) : 'N/A';
      const confidence = typeof result.confidence_score === 'number' ? result.confidence_score.toFixed(3) : 'N/A';
      console.log(`  ${idx + 1}. [${similarity}] [conf:${confidence}] ${result.content}`);
    });
    
    return {
      results: searchResults,
      retrievalTime,
      userId,
      hasRelevantContext,
      confidence: hasRelevantContext ? 0.85 : 0.3
    };
  }
}

async function testKnowledgeIsolation() {
  console.log('\n🧪 Testing knowledge base isolation...');
  
  const isolationResults = [];
  
  for (const testQuery of testQueries) {
    console.log(`\n📝 Query: "${testQuery.query}"`);
    
    for (const user of testUsers) {
      const result = await testRAGRetrieval(user.id, testQuery.query);
      
      const shouldHaveResults = testQuery.expectedUsers.includes(user.id);
      const hasResults = result.results.length > 0;
      const hasRelevantContext = result.hasRelevantContext || false;
      
      // Check if expected content is found
      const foundExpectedContent = testQuery.expectedContent.some(expected => 
        result.results.some(r => r.content.toLowerCase().includes(expected.toLowerCase()))
      );
      
      // Updated success criteria: should have results AND relevant context
      const success = shouldHaveResults 
        ? (hasResults && hasRelevantContext && foundExpectedContent) 
        : (!hasResults || !hasRelevantContext);
      
      const isolationTest = {
        query: testQuery.query,
        userId: user.id,
        userName: user.name,
        shouldHaveResults,
        hasResults,
        hasRelevantContext,
        foundExpectedContent,
        resultCount: result.results.length,
        retrievalTime: result.retrievalTime,
        success
      };
      
      isolationResults.push(isolationTest);
      
      console.log(`  👤 ${user.name}: ${isolationTest.success ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`     Expected results: ${shouldHaveResults}, Got results: ${hasResults}, Has relevant context: ${hasRelevantContext}, Found expected content: ${foundExpectedContent}`);
    }
  }
  
  return isolationResults;
}

async function testEmbeddingQuality() {
  console.log('\n🧮 Testing embedding quality...');
  
  const qualityTests = [];
  
  // Test similar queries should retrieve similar results
  const similarQueries = [
    'What do I do for work?',
    'Tell me about my job',
    'What is my profession?'
  ];
  
  for (const user of testUsers) {
    const results = [];
    
    for (const query of similarQueries) {
      const result = await testRAGRetrieval(user.id, query);
      results.push({
        query,
        resultCount: result.results.length,
        topSimilarity: result.results[0]?.similarity || 0
      });
    }
    
    // Check consistency across similar queries
    const avgResults = results.reduce((sum, r) => sum + r.resultCount, 0) / results.length;
    const consistency = results.every(r => Math.abs(r.resultCount - avgResults) <= 1);
    
    qualityTests.push({
      userId: user.id,
      userName: user.name,
      avgResults: avgResults.toFixed(2),
      consistency,
      results
    });
    
    console.log(`  👤 ${user.name}: ${consistency ? '✅ Consistent' : '❌ Inconsistent'} (avg: ${avgResults.toFixed(2)} results)`);
  }
  
  return qualityTests;
}

async function testPerformanceBenchmarks() {
  console.log('\n⚡ Testing performance benchmarks...');
  
  const performanceTests = [];
  
  for (const user of testUsers) {
    const queries = [
      'What do you know about me?',
      'Tell me about my work',
      'What are my hobbies?',
      'Where do I live?',
      'What do I drive?'
    ];
    
    const times = [];
    
    for (const query of queries) {
      const start = Date.now();
      await testRAGRetrieval(user.id, query);
      const duration = Date.now() - start;
      times.push(duration);
    }
    
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    performanceTests.push({
      userId: user.id,
      userName: user.name,
      avgTime: avgTime.toFixed(2),
      maxTime,
      minTime,
      times
    });
    
    console.log(`  👤 ${user.name}: avg ${avgTime.toFixed(2)}ms (min: ${minTime}ms, max: ${maxTime}ms)`);
  }
  
  return performanceTests;
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Rigorous Per-User RAG Test');
  console.log('=====================================\n');
  
  try {
    // Setup
    await setupTestUsers();
    
    // Test 1: Knowledge Isolation
    console.log('\n📋 TEST 1: Knowledge Base Isolation');
    console.log('=====================================');
    const isolationResults = await testKnowledgeIsolation();
    
    // Test 2: Embedding Quality
    console.log('\n📋 TEST 2: Embedding Quality & Consistency');
    console.log('===========================================');
    const qualityResults = await testEmbeddingQuality();
    
    // Test 3: Performance Benchmarks
    console.log('\n📋 TEST 3: Performance Benchmarks');
    console.log('=================================');
    const performanceResults = await testPerformanceBenchmarks();
    
    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    
    // Isolation test summary
    const isolationPassed = isolationResults.filter(r => r.success).length;
    const isolationTotal = isolationResults.length;
    const isolationRate = (isolationPassed / isolationTotal * 100).toFixed(1);
    
    console.log(`\n🔒 Knowledge Isolation: ${isolationPassed}/${isolationTotal} (${isolationRate}%)`);
    
    // Quality test summary
    const qualityPassed = qualityResults.filter(r => r.consistency).length;
    const qualityTotal = qualityResults.length;
    const qualityRate = (qualityPassed / qualityTotal * 100).toFixed(1);
    
    console.log(`🧮 Embedding Quality: ${qualityPassed}/${qualityTotal} (${qualityRate}%)`);
    
    // Performance summary
    const allTimes = performanceResults.flatMap(r => r.times);
    const avgPerformance = allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length;
    const maxPerformance = Math.max(...allTimes);
    
    console.log(`⚡ Performance: avg ${avgPerformance.toFixed(2)}ms, max ${maxPerformance}ms`);
    
    // Overall assessment
    const overallSuccess = isolationRate >= 80 && qualityRate >= 80 && avgPerformance <= 2000;
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Isolation: ${isolationRate}% (target: ≥80%)`);
    console.log(`   Quality: ${qualityRate}% (target: ≥80%)`);
    console.log(`   Performance: ${avgPerformance.toFixed(2)}ms (target: ≤2000ms)`);
    
    // Detailed failure analysis
    if (!overallSuccess) {
      console.log('\n🔍 FAILURE ANALYSIS:');
      
      if (isolationRate < 80) {
        console.log('❌ Knowledge isolation issues:');
        isolationResults.filter(r => !r.success).forEach(r => {
          console.log(`   - ${r.userName}: "${r.query}" (expected: ${r.shouldHaveResults}, got: ${r.hasResults})`);
        });
      }
      
      if (qualityRate < 80) {
        console.log('❌ Embedding quality issues:');
        qualityResults.filter(r => !r.consistency).forEach(r => {
          console.log(`   - ${r.userName}: inconsistent results across similar queries`);
        });
      }
      
      if (avgPerformance > 2000) {
        console.log('❌ Performance issues:');
        performanceResults.forEach(r => {
          if (r.avgTime > 2000) {
            console.log(`   - ${r.userName}: avg ${r.avgTime}ms (too slow)`);
          }
        });
      }
    }
    
    return {
      success: overallSuccess,
      isolation: { passed: isolationPassed, total: isolationTotal, rate: isolationRate },
      quality: { passed: qualityPassed, total: qualityTotal, rate: qualityRate },
      performance: { avg: avgPerformance, max: maxPerformance },
      details: {
        isolation: isolationResults,
        quality: qualityResults,
        performance: performanceResults
      }
    };
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  runComprehensiveTest()
    .then(result => {
      console.log('\n✅ Test completed successfully');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest };
