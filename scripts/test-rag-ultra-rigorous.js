#!/usr/bin/env node

/**
 * Ultra-Rigorous Per-User RAG Test
 * Complete logging of every step with detailed analysis
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Enhanced test users with more diverse knowledge
const testUsers = [
  {
    id: 'ultra-test-user-1',
    email: 'alice@ultra-test.com',
    name: 'Alice Johnson',
    knowledge: [
      'I am a software engineer specializing in React and Node.js',
      'I work at TechCorp as a Senior Developer',
      'I have a golden retriever named Max who is 3 years old',
      'I live in San Francisco, California',
      'I drive a blue Tesla Model Y',
      'I enjoy hiking in Yosemite National Park',
      'I have a Master\'s degree in Computer Science from Stanford',
      'I am allergic to peanuts and shellfish',
      'I speak English, Spanish, and French fluently',
      'I have been married to John for 5 years'
    ]
  },
  {
    id: 'ultra-test-user-2', 
    email: 'bob@ultra-test.com',
    name: 'Bob Smith',
    knowledge: [
      'I am a professional chef specializing in Italian and French cuisine',
      'I own a restaurant called Bella Vista in downtown Chicago',
      'I have three children: Emma (8), Jack (6), and Sofia (4)',
      'I drive a red Tesla Model 3 Performance',
      'I live in Chicago, Illinois with my family',
      'I have a Culinary Arts degree from Le Cordon Bleu',
      'I am passionate about sustainable cooking and farm-to-table dining',
      'I have been cooking professionally for 15 years',
      'I speak English and Italian',
      'I am divorced and have joint custody of my children'
    ]
  },
  {
    id: 'ultra-test-user-3',
    email: 'charlie@ultra-test.com', 
    name: 'Charlie Brown',
    knowledge: [
      'I am a marine biologist studying coral reef ecosystems',
      'I have a PhD in Marine Biology from Stanford University',
      'I live in Miami, Florida near the ocean',
      'I own a sailboat named Ocean Explorer that I use for research',
      'I am allergic to shellfish and have a severe reaction',
      'I have been studying coral reefs for 10 years',
      'I speak English and Spanish',
      'I am single and enjoy sailing in my free time',
      'I drive a white Toyota Prius for environmental reasons',
      'I have published 25 research papers on marine conservation'
    ]
  }
];

// Comprehensive test queries with expected outcomes
const testQueries = [
  {
    query: 'What do you know about my work and career?',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-2', 'ultra-test-user-3'],
    expectedContent: ['software engineer', 'chef', 'marine biologist'],
    category: 'work'
  },
  {
    query: 'Tell me about my pets',
    expectedUsers: ['ultra-test-user-1'],
    expectedContent: ['golden retriever', 'Max'],
    category: 'pets'
  },
  {
    query: 'What car do I drive?',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-2', 'ultra-test-user-3'],
    expectedContent: ['Tesla Model Y', 'Tesla Model 3', 'Toyota Prius'],
    category: 'transportation'
  },
  {
    query: 'Where do I live?',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-2', 'ultra-test-user-3'],
    expectedContent: ['San Francisco', 'Chicago', 'Miami'],
    category: 'location'
  },
  {
    query: 'What are my children\'s names?',
    expectedUsers: ['ultra-test-user-2'],
    expectedContent: ['Emma', 'Jack', 'Sofia'],
    category: 'family'
  },
  {
    query: 'What languages do I speak?',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-2', 'ultra-test-user-3'],
    expectedContent: ['Spanish', 'French', 'Italian'],
    category: 'languages'
  },
  {
    query: 'What am I allergic to?',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-3'],
    expectedContent: ['peanuts', 'shellfish'],
    category: 'health'
  },
  {
    query: 'Tell me about my education',
    expectedUsers: ['ultra-test-user-1', 'ultra-test-user-2', 'ultra-test-user-3'],
    expectedContent: ['Stanford', 'Le Cordon Bleu', 'PhD'],
    category: 'education'
  }
];

// Detailed logging configuration
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

let currentLogLevel = LOG_LEVELS.DEBUG;

function log(level, message, data = null) {
  if (level >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];
    console.log(`[${timestamp}] ${levelName}: ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

async function generateEmbedding(text) {
  log(LOG_LEVELS.DEBUG, `Generating embedding for: "${text.substring(0, 50)}..."`);
  
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
    const embedding = data.data[0].embedding;
    
    log(LOG_LEVELS.DEBUG, `Generated embedding with ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'Failed to generate embedding', { error: error.message });
    // Return mock embedding as fallback
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

async function setupTestUsers() {
  log(LOG_LEVELS.INFO, '🔧 Setting up ultra-rigorous test users and knowledge base...');
  
  for (const user of testUsers) {
    log(LOG_LEVELS.DEBUG, `Setting up user: ${user.name} (${user.id})`);
    
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

    log(LOG_LEVELS.DEBUG, `Cleared existing knowledge for ${user.name}`);

    // Add user-specific knowledge with detailed logging
    for (let i = 0; i < user.knowledge.length; i++) {
      const fact = user.knowledge[i];
      log(LOG_LEVELS.DEBUG, `Processing fact ${i + 1}/${user.knowledge.length}: "${fact}"`);
      
      const embedding = await generateEmbedding(fact);
      
      // Ensure embedding is valid before insertion
      if (!embedding || embedding.length !== 1536) {
        log(LOG_LEVELS.ERROR, `Invalid embedding for fact: ${fact}`);
        continue;
      }
      
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
          ${user.id},
          ${fact},
          'user_fact',
          ${`[${embedding.join(',')}]`}::vector(1536),
          ${JSON.stringify({
            source: 'ultra_test_setup',
            timestamp: new Date().toISOString(),
            factIndex: i + 1,
            totalFacts: user.knowledge.length
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
      
      log(LOG_LEVELS.DEBUG, `Stored fact ${i + 1} with embedding`);
    }
    
    log(LOG_LEVELS.INFO, `✅ Completed setup for ${user.name} with ${user.knowledge.length} facts`);
  }
  
  log(LOG_LEVELS.INFO, '✅ Ultra-rigorous test users and knowledge base setup complete');
}

async function testRAGRetrievalDetailed(userId, query) {
  log(LOG_LEVELS.INFO, `\n🔍 ULTRA-DETAILED RAG TEST for user ${userId}: "${query}"`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Generate query embedding
    log(LOG_LEVELS.DEBUG, 'Step 1: Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    const embeddingTime = Date.now() - startTime;
    log(LOG_LEVELS.DEBUG, `Query embedding generated in ${embeddingTime}ms`);
    
    // Step 2: Direct database query with detailed analysis
    log(LOG_LEVELS.DEBUG, 'Step 2: Performing detailed database retrieval...');
    const dbStartTime = Date.now();
    
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
    
    const dbTime = Date.now() - dbStartTime;
    log(LOG_LEVELS.DEBUG, `Database query completed in ${dbTime}ms`);
    
    // Step 3: Detailed analysis of results
    log(LOG_LEVELS.DEBUG, 'Step 3: Analyzing retrieval results...');
    
    const hasRelevantContext = searchResults.length > 0 && searchResults.some(r => r.confidence_score > 0.7);
    const avgSimilarity = searchResults.length > 0 
      ? searchResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / searchResults.length 
      : 0;
    const avgConfidence = searchResults.length > 0 
      ? searchResults.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / searchResults.length 
      : 0;
    
    log(LOG_LEVELS.INFO, `📊 RETRIEVAL ANALYSIS:`);
    log(LOG_LEVELS.INFO, `   - Total results: ${searchResults.length}`);
    log(LOG_LEVELS.INFO, `   - Has relevant context: ${hasRelevantContext}`);
    log(LOG_LEVELS.INFO, `   - Average similarity: ${avgSimilarity.toFixed(4)}`);
    log(LOG_LEVELS.INFO, `   - Average confidence: ${avgConfidence.toFixed(4)}`);
    log(LOG_LEVELS.INFO, `   - Database time: ${dbTime}ms`);
    
    // Step 4: Detailed result breakdown
    log(LOG_LEVELS.DEBUG, 'Step 4: Detailed result breakdown...');
    searchResults.forEach((result, idx) => {
      const similarity = typeof result.similarity === 'number' ? result.similarity.toFixed(4) : 'N/A';
      const confidence = typeof result.confidence_score === 'number' ? result.confidence_score.toFixed(4) : 'N/A';
      const priority = typeof result.priority_score === 'number' ? result.priority_score.toFixed(2) : 'N/A';
      
      log(LOG_LEVELS.DEBUG, `   Result ${idx + 1}:`);
      log(LOG_LEVELS.DEBUG, `     Content: "${result.content}"`);
      log(LOG_LEVELS.DEBUG, `     Similarity: ${similarity}`);
      log(LOG_LEVELS.DEBUG, `     Confidence: ${confidence}`);
      log(LOG_LEVELS.DEBUG, `     Priority: ${priority}`);
      log(LOG_LEVELS.DEBUG, `     Type: ${result.content_type}`);
    });
    
    // Step 5: API endpoint test
    log(LOG_LEVELS.DEBUG, 'Step 5: Testing API endpoint...');
    const apiStartTime = Date.now();
    
    try {
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
      
      const apiData = await response.json();
      const apiTime = Date.now() - apiStartTime;
      
      log(LOG_LEVELS.INFO, `📡 API RESPONSE ANALYSIS:`);
      log(LOG_LEVELS.INFO, `   - API time: ${apiTime}ms`);
      log(LOG_LEVELS.INFO, `   - Has relevant context: ${apiData.hasRelevantContext}`);
      log(LOG_LEVELS.INFO, `   - Confidence: ${apiData.confidence}`);
      log(LOG_LEVELS.INFO, `   - Context count: ${apiData.contextCount}`);
      log(LOG_LEVELS.INFO, `   - Sources: ${apiData.sources ? apiData.sources.join(', ') : 'None'}`);
      
      if (apiData.timings) {
        log(LOG_LEVELS.INFO, `   - Backend timings:`, apiData.timings);
      }
      
      // Compare DB results with API results
      const dbHasRelevant = hasRelevantContext;
      const apiHasRelevant = apiData.hasRelevantContext;
      const consistency = dbHasRelevant === apiHasRelevant;
      
      log(LOG_LEVELS.INFO, `🔄 CONSISTENCY CHECK:`);
      log(LOG_LEVELS.INFO, `   - DB has relevant context: ${dbHasRelevant}`);
      log(LOG_LEVELS.INFO, `   - API has relevant context: ${apiHasRelevant}`);
      log(LOG_LEVELS.INFO, `   - Consistent: ${consistency ? '✅' : '❌'}`);
      
      if (!consistency) {
        log(LOG_LEVELS.WARN, '⚠️  Inconsistency detected between DB and API results!');
      }
      
    } catch (apiError) {
      log(LOG_LEVELS.ERROR, 'API test failed', { error: apiError.message });
    }
    
    const totalTime = Date.now() - startTime;
    
    return {
      results: searchResults,
      retrievalTime: totalTime,
      userId,
      hasRelevantContext,
      confidence: hasRelevantContext ? 0.85 : 0.3,
      avgSimilarity,
      avgConfidence,
      dbTime,
      apiTime: Date.now() - apiStartTime
    };
    
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'RAG retrieval failed', { error: error.message });
    throw error;
  }
}

async function testKnowledgeIsolationUltraRigorous() {
  log(LOG_LEVELS.INFO, '\n🧪 ULTRA-RIGOROUS KNOWLEDGE BASE ISOLATION TEST');
  log(LOG_LEVELS.INFO, '================================================');
  
  const isolationResults = [];
  
  for (const testQuery of testQueries) {
    log(LOG_LEVELS.INFO, `\n📝 TESTING QUERY: "${testQuery.query}"`);
    log(LOG_LEVELS.INFO, `   Category: ${testQuery.category}`);
    log(LOG_LEVELS.INFO, `   Expected users: ${testQuery.expectedUsers.join(', ')}`);
    log(LOG_LEVELS.INFO, `   Expected content: ${testQuery.expectedContent.join(', ')}`);
    
    for (const user of testUsers) {
      const result = await testRAGRetrievalDetailed(user.id, testQuery.query);
      
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
        category: testQuery.category,
        userId: user.id,
        userName: user.name,
        shouldHaveResults,
        hasResults,
        hasRelevantContext,
        foundExpectedContent,
        resultCount: result.results.length,
        retrievalTime: result.retrievalTime,
        avgSimilarity: result.avgSimilarity,
        avgConfidence: result.avgConfidence,
        success
      };
      
      isolationResults.push(isolationTest);
      
      log(LOG_LEVELS.INFO, `  👤 ${user.name}: ${isolationTest.success ? '✅ PASS' : '❌ FAIL'}`);
      log(LOG_LEVELS.INFO, `     Expected results: ${shouldHaveResults}`);
      log(LOG_LEVELS.INFO, `     Got results: ${hasResults}`);
      log(LOG_LEVELS.INFO, `     Has relevant context: ${hasRelevantContext}`);
      log(LOG_LEVELS.INFO, `     Found expected content: ${foundExpectedContent}`);
      log(LOG_LEVELS.INFO, `     Avg similarity: ${result.avgSimilarity.toFixed(4)}`);
      log(LOG_LEVELS.INFO, `     Avg confidence: ${result.avgConfidence.toFixed(4)}`);
      log(LOG_LEVELS.INFO, `     Retrieval time: ${result.retrievalTime}ms`);
    }
  }
  
  return isolationResults;
}

async function testEmbeddingQualityUltraRigorous() {
  log(LOG_LEVELS.INFO, '\n🧮 ULTRA-RIGOROUS EMBEDDING QUALITY TEST');
  log(LOG_LEVELS.INFO, '==========================================');
  
  const qualityTests = [];
  
  // Test similar queries should retrieve similar results
  const similarQueries = [
    'What do I do for work?',
    'Tell me about my job',
    'What is my profession?',
    'What is my career?',
    'What do I do professionally?'
  ];
  
  for (const user of testUsers) {
    log(LOG_LEVELS.INFO, `\n👤 Testing embedding quality for ${user.name}:`);
    
    const results = [];
    
    for (const query of similarQueries) {
      log(LOG_LEVELS.DEBUG, `  Testing query: "${query}"`);
      const result = await testRAGRetrievalDetailed(user.id, query);
      results.push({
        query,
        resultCount: result.results.length,
        topSimilarity: result.results[0]?.similarity || 0,
        hasRelevantContext: result.hasRelevantContext,
        avgSimilarity: result.avgSimilarity,
        avgConfidence: result.avgConfidence
      });
      
      log(LOG_LEVELS.DEBUG, `    Results: ${result.results.length}, Similarity: ${result.avgSimilarity.toFixed(4)}, Context: ${result.hasRelevantContext}`);
    }
    
    // Check consistency across similar queries
    const avgResults = results.reduce((sum, r) => sum + r.resultCount, 0) / results.length;
    const avgSimilarity = results.reduce((sum, r) => sum + r.avgSimilarity, 0) / results.length;
    const consistency = results.every(r => Math.abs(r.resultCount - avgResults) <= 1);
    const contextConsistency = results.every(r => r.hasRelevantContext === results[0].hasRelevantContext);
    
    qualityTests.push({
      userId: user.id,
      userName: user.name,
      avgResults: avgResults.toFixed(2),
      avgSimilarity: avgSimilarity.toFixed(4),
      consistency,
      contextConsistency,
      results
    });
    
    log(LOG_LEVELS.INFO, `  📊 Quality Analysis:`);
    log(LOG_LEVELS.INFO, `     Avg results: ${avgResults.toFixed(2)}`);
    log(LOG_LEVELS.INFO, `     Avg similarity: ${avgSimilarity.toFixed(4)}`);
    log(LOG_LEVELS.INFO, `     Result consistency: ${consistency ? '✅' : '❌'}`);
    log(LOG_LEVELS.INFO, `     Context consistency: ${contextConsistency ? '✅' : '❌'}`);
  }
  
  return qualityTests;
}

async function testPerformanceUltraRigorous() {
  log(LOG_LEVELS.INFO, '\n⚡ ULTRA-RIGOROUS PERFORMANCE TEST');
  log(LOG_LEVELS.INFO, '==================================');
  
  const performanceTests = [];
  
  for (const user of testUsers) {
    log(LOG_LEVELS.INFO, `\n👤 Performance testing for ${user.name}:`);
    
    const queries = [
      'What do you know about me?',
      'Tell me about my work',
      'What are my hobbies?',
      'Where do I live?',
      'What do I drive?',
      'What languages do I speak?',
      'What am I allergic to?',
      'Tell me about my education'
    ];
    
    const times = [];
    const similarities = [];
    const confidences = [];
    
    for (const query of queries) {
      log(LOG_LEVELS.DEBUG, `  Testing: "${query}"`);
      const start = Date.now();
      const result = await testRAGRetrievalDetailed(user.id, query);
      const duration = Date.now() - start;
      
      times.push(duration);
      similarities.push(result.avgSimilarity);
      confidences.push(result.avgConfidence);
      
      log(LOG_LEVELS.DEBUG, `    Time: ${duration}ms, Similarity: ${result.avgSimilarity.toFixed(4)}, Confidence: ${result.avgConfidence.toFixed(4)}`);
    }
    
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    
    performanceTests.push({
      userId: user.id,
      userName: user.name,
      avgTime: avgTime.toFixed(2),
      maxTime,
      minTime,
      avgSimilarity: avgSimilarity.toFixed(4),
      avgConfidence: avgConfidence.toFixed(4),
      times,
      similarities,
      confidences
    });
    
    log(LOG_LEVELS.INFO, `  📊 Performance Analysis:`);
    log(LOG_LEVELS.INFO, `     Avg time: ${avgTime.toFixed(2)}ms`);
    log(LOG_LEVELS.INFO, `     Min time: ${minTime}ms`);
    log(LOG_LEVELS.INFO, `     Max time: ${maxTime}ms`);
    log(LOG_LEVELS.INFO, `     Avg similarity: ${avgSimilarity.toFixed(4)}`);
    log(LOG_LEVELS.INFO, `     Avg confidence: ${avgConfidence.toFixed(4)}`);
  }
  
  return performanceTests;
}

async function runUltraRigorousTest() {
  log(LOG_LEVELS.INFO, '🚀 Starting Ultra-Rigorous Per-User RAG Test');
  log(LOG_LEVELS.INFO, '=============================================\n');
  
  try {
    // Setup
    await setupTestUsers();
    
    // Test 1: Knowledge Isolation
    const isolationResults = await testKnowledgeIsolationUltraRigorous();
    
    // Test 2: Embedding Quality
    const qualityResults = await testEmbeddingQualityUltraRigorous();
    
    // Test 3: Performance
    const performanceResults = await testPerformanceUltraRigorous();
    
    // Generate comprehensive report
    log(LOG_LEVELS.INFO, '\n📊 ULTRA-RIGOROUS COMPREHENSIVE TEST REPORT');
    log(LOG_LEVELS.INFO, '============================================');
    
    // Isolation test summary
    const isolationPassed = isolationResults.filter(r => r.success).length;
    const isolationTotal = isolationResults.length;
    const isolationRate = (isolationPassed / isolationTotal * 100).toFixed(1);
    
    log(LOG_LEVELS.INFO, `\n🔒 Knowledge Isolation: ${isolationPassed}/${isolationTotal} (${isolationRate}%)`);
    
    // Quality test summary
    const qualityPassed = qualityResults.filter(r => r.consistency && r.contextConsistency).length;
    const qualityTotal = qualityResults.length;
    const qualityRate = (qualityPassed / qualityTotal * 100).toFixed(1);
    
    log(LOG_LEVELS.INFO, `🧮 Embedding Quality: ${qualityPassed}/${qualityTotal} (${qualityRate}%)`);
    
    // Performance summary
    const allTimes = performanceResults.flatMap(r => r.times);
    const avgPerformance = allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length;
    const maxPerformance = Math.max(...allTimes);
    
    log(LOG_LEVELS.INFO, `⚡ Performance: avg ${avgPerformance.toFixed(2)}ms, max ${maxPerformance}ms`);
    
    // Overall assessment
    const overallSuccess = isolationRate >= 80 && qualityRate >= 80 && avgPerformance <= 5000;
    
    log(LOG_LEVELS.INFO, `\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    log(LOG_LEVELS.INFO, `   Isolation: ${isolationRate}% (target: ≥80%)`);
    log(LOG_LEVELS.INFO, `   Quality: ${qualityRate}% (target: ≥80%)`);
    log(LOG_LEVELS.INFO, `   Performance: ${avgPerformance.toFixed(2)}ms (target: ≤5000ms)`);
    
    // Detailed failure analysis
    if (!overallSuccess) {
      log(LOG_LEVELS.WARN, '\n🔍 DETAILED FAILURE ANALYSIS:');
      
      if (isolationRate < 80) {
        log(LOG_LEVELS.WARN, '❌ Knowledge isolation issues:');
        isolationResults.filter(r => !r.success).forEach(r => {
          log(LOG_LEVELS.WARN, `   - ${r.userName}: "${r.query}" (expected: ${r.shouldHaveResults}, got: ${r.hasResults}, context: ${r.hasRelevantContext})`);
        });
      }
      
      if (qualityRate < 80) {
        log(LOG_LEVELS.WARN, '❌ Embedding quality issues:');
        qualityResults.filter(r => !r.consistency || !r.contextConsistency).forEach(r => {
          log(LOG_LEVELS.WARN, `   - ${r.userName}: inconsistent results across similar queries`);
        });
      }
      
      if (avgPerformance > 5000) {
        log(LOG_LEVELS.WARN, '❌ Performance issues:');
        performanceResults.forEach(r => {
          if (r.avgTime > 5000) {
            log(LOG_LEVELS.WARN, `   - ${r.userName}: avg ${r.avgTime}ms (too slow)`);
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
    log(LOG_LEVELS.ERROR, '❌ Ultra-rigorous test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  runUltraRigorousTest()
    .then(result => {
      log(LOG_LEVELS.INFO, '\n✅ Ultra-rigorous test completed successfully');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      log(LOG_LEVELS.ERROR, '❌ Ultra-rigorous test failed:', error);
      process.exit(1);
    });
}

module.exports = { runUltraRigorousTest };

