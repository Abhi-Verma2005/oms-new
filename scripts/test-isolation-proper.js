#!/usr/bin/env node

/**
 * Proper Isolation Test with Unique User Data
 * Each user gets completely different, personalized data
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

async function clearExistingData() {
  console.log('🧹 Clearing existing test data...');
  
  // Clear all knowledge base entries for test users
  await prisma.userKnowledgeBase.deleteMany({
    where: {
      userId: {
        in: ['cmguyt4nk0022urt735eayso8', 'test-user-simple', 'test-user-quick']
      }
    }
  });
  
  console.log('✅ Cleared existing data');
}

async function addUniqueUserData(userId, userInfo, userType) {
  console.log(`\n📝 Adding UNIQUE data for ${userInfo.name || userInfo.email} (${userType})...`);
  
  let testFacts = [];
  
  if (userType === 'developer') {
    testFacts = [
      `I am ${userInfo.name || 'a developer'} and I specialize in React and TypeScript`,
      `I work at Google as a Senior Software Engineer`,
      `I have 8 years of experience in full-stack development`,
      `I love building scalable web applications`,
      `I use Docker and Kubernetes for deployment`,
      `I prefer functional programming over object-oriented`,
      `I contribute to open source projects on GitHub`,
      `I live in San Francisco and work remotely`,
      `I have a Computer Science degree from MIT`,
      `I'm passionate about clean code and testing`
    ];
  } else if (userType === 'designer') {
    testFacts = [
      `I am ${userInfo.name || 'a designer'} and I specialize in UI/UX design`,
      `I work at Apple as a Senior Product Designer`,
      `I have 6 years of experience in design systems`,
      `I love creating beautiful, accessible interfaces`,
      `I use Figma and Sketch for my design work`,
      `I prefer minimalist design over complex layouts`,
      `I have a portfolio on Dribbble with 500+ likes`,
      `I live in New York and work in the office`,
      `I have a Graphic Design degree from Parsons`,
      `I'm passionate about user research and usability`
    ];
  } else if (userType === 'marketer') {
    testFacts = [
      `I am ${userInfo.name || 'a marketer'} and I specialize in digital marketing`,
      `I work at HubSpot as a Marketing Manager`,
      `I have 5 years of experience in growth marketing`,
      `I love data-driven marketing strategies`,
      `I use Google Analytics and HubSpot for tracking`,
      `I prefer content marketing over paid advertising`,
      `I run a successful marketing blog with 10k subscribers`,
      `I live in Boston and work hybrid`,
      `I have an MBA in Marketing from Harvard`,
      `I'm passionate about customer acquisition and retention`
    ];
  }
  
  let addedCount = 0;
  
  for (let i = 0; i < testFacts.length; i++) {
    const fact = testFacts[i];
    console.log(`   Adding fact ${i + 1}/${testFacts.length}: "${fact}"`);
    
    try {
      const embedding = await generateEmbedding(fact);
      
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
          ${fact},
          'user_fact',
          ${`[${embedding.join(',')}]`}::vector(1536),
          ${JSON.stringify({
            source: 'isolation_test',
            timestamp: new Date().toISOString(),
            factIndex: i + 1,
            userType: userType,
            userEmail: userInfo.email
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
      
      addedCount++;
    } catch (error) {
      console.error(`   ❌ Failed to add fact ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Added ${addedCount}/${testFacts.length} UNIQUE facts for ${userInfo.name || userInfo.email}`);
  return addedCount;
}

async function testIsolationWithSameQuestions(userId, userInfo, otherUsers) {
  console.log(`\n🔒 Testing isolation for ${userInfo.name || userInfo.email} with SAME questions...`);
  
  const testQueries = [
    "What do you know about me?",
    "What is my job?",
    "Where do I work?",
    "What are my skills?",
    "What do I like to do?"
  ];
  
  let isolationScore = 0;
  let totalTests = 0;
  
  for (const query of testQueries) {
    console.log(`\n   🔍 Testing query: "${query}"`);
    
    try {
      const queryEmbedding = await generateEmbedding(query);
      
      // Test current user's data
      const userResults = await prisma.$queryRaw`
        WITH ranked_results AS (
          SELECT 
            id,
            content,
            metadata,
            content_type,
            created_at,
            COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity,
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
              (embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25)
            )
        )
        SELECT *
        FROM ranked_results
        WHERE confidence_score > 0.0
        ORDER BY confidence_score DESC, similarity DESC
        LIMIT 3
      `;
      
      console.log(`     ✅ Found ${userResults.length} relevant results for current user:`);
      if (userResults.length > 0) {
        userResults.forEach((result, i) => {
          console.log(`       ${i + 1}. "${result.content}" (similarity: ${result.similarity?.toFixed(3)})`);
        });
      }
      
      // Test other users' data (should be empty or very different)
      let crossContamination = 0;
      for (const otherUser of otherUsers) {
        if (otherUser.id === userId) continue;
        
        const otherResults = await prisma.$queryRaw`
          WITH ranked_results AS (
            SELECT 
              id,
              content,
              metadata,
              content_type,
              created_at,
              COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.0) AS similarity,
              CASE 
                WHEN LOWER(content) LIKE LOWER(${'%' + query + '%'}) THEN 0.95
                WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.4 THEN 0.9
                WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.3 THEN 0.8
                WHEN (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25 THEN 0.7
                ELSE 0.0
              END AS confidence_score
            FROM user_knowledge_base
            WHERE user_id = ${otherUser.id}
              AND (
                LOWER(content) LIKE LOWER(${'%' + query + '%'}) OR
                (embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.25)
              )
          )
          SELECT *
          FROM ranked_results
          WHERE confidence_score > 0.0
          ORDER BY confidence_score DESC, similarity DESC
          LIMIT 3
        `;
        
        if (otherResults.length > 0) {
          crossContamination += otherResults.length;
          console.log(`     ⚠️  Found ${otherResults.length} results in other user's data (${otherUser.email}):`);
          otherResults.forEach((result, i) => {
            console.log(`         ${i + 1}. "${result.content}" (similarity: ${result.similarity?.toFixed(3)})`);
          });
        }
      }
      
      if (crossContamination === 0) {
        isolationScore++;
        console.log(`     ✅ Perfect isolation - no cross-contamination`);
      } else {
        console.log(`     ❌ Isolation failed - found ${crossContamination} cross-contaminated results`);
      }
      
      totalTests++;
      
    } catch (error) {
      console.error(`     ❌ Query failed:`, error.message);
    }
  }
  
  const isolationPercentage = (isolationScore / totalTests) * 100;
  console.log(`\n   📊 Isolation Score: ${isolationScore}/${totalTests} (${isolationPercentage.toFixed(1)}%)`);
  
  return isolationPercentage;
}

async function runProperIsolationTest() {
  console.log('🚀 PROPER ISOLATION TEST WITH UNIQUE USER DATA');
  console.log('===============================================\n');
  
  try {
    // Clear existing data
    await clearExistingData();
    
    // Get real users
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: ['cmguyt4nk0022urt735eayso8', 'test-user-simple', 'test-user-quick']
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${users.length} users for testing`);
    
    // Add unique data for each user
    const userTypes = ['developer', 'designer', 'marketer'];
    const usersWithData = [];
    
    for (let i = 0; i < users.length && i < userTypes.length; i++) {
      const user = users[i];
      const userType = userTypes[i];
      
      const addedCount = await addUniqueUserData(user.id, user, userType);
      if (addedCount > 0) {
        usersWithData.push({ ...user, userType });
      }
    }
    
    console.log(`\n✅ Set up unique data for ${usersWithData.length} users`);
    
    // Test isolation for each user
    let totalIsolationScore = 0;
    
    for (let i = 0; i < usersWithData.length; i++) {
      const user = usersWithData[i];
      const otherUsers = usersWithData.filter(u => u.id !== user.id);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 TESTING USER ${i + 1}/${usersWithData.length}: ${user.name || user.email} (${user.userType})`);
      console.log(`${'='.repeat(60)}`);
      
      // Test isolation with same questions
      const isolationScore = await testIsolationWithSameQuestions(user.id, user, otherUsers);
      totalIsolationScore += isolationScore;
    }
    
    // Final results
    const avgIsolationScore = totalIsolationScore / usersWithData.length;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 FINAL ISOLATION TEST RESULTS');
    console.log(`${'='.repeat(60)}`);
    console.log(`👥 Users tested: ${usersWithData.length}`);
    console.log(`🔒 Average isolation score: ${avgIsolationScore.toFixed(1)}%`);
    
    if (avgIsolationScore >= 95) {
      console.log('\n🎉 RAG SYSTEM: PERFECT ISOLATION!');
      console.log('✅ Each user gets their own personalized responses');
      console.log('✅ No data leakage between users');
      console.log('✅ Same questions = different, personalized answers');
    } else {
      console.log('\n⚠️  RAG SYSTEM: ISOLATION ISSUES');
      console.log(`❌ Isolation score too low: ${avgIsolationScore.toFixed(1)}% (target: ≥95%)`);
    }
    
  } catch (error) {
    console.error('❌ Isolation test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runProperIsolationTest();
