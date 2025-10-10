const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

/**
 * Store a complete conversation turn (user message + AI response)
 */
async function storeConversationMemory(
  userId,
  userMessage,
  aiResponse,
  options = {}
) {
  try {
    const {
      sessionId,
      context = {},
      importance = 1.0,
      extractedInsights,
      sentiment,
      intent,
      topics = []
    } = options

    // Store in user_interactions table using raw query
    const interactionId = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO user_interactions (
        id, user_id, interaction_type, content, response, context, sentiment, intent, topics, session_id, timestamp
      ) VALUES (
        ${interactionId},
        ${userId},
        'CHAT_MESSAGE',
        ${userMessage},
        ${aiResponse},
        ${JSON.stringify({
          ...context,
          importance,
          extractedInsights,
          sessionId
        })}::jsonb,
        ${sentiment || null},
        ${intent || null},
        ${topics},
        ${sessionId || null},
        NOW()
      )
    `

    console.log(`✅ Stored conversation memory for user ${userId}`)
    return interactionId
  } catch (error) {
    console.error('Error storing conversation memory:', error)
    throw error
  }
}

/**
 * Find relevant conversation memories for a given query
 */
async function findRelevantMemories(
  userId,
  query,
  options = {}
) {
  const {
    limit = 10,
    threshold = 0.7,
    includeRecent = true,
    includeSimilar = true,
    sessionId,
    contentType
  } = options

  try {
    const results = []

    // Get recent conversations
    if (includeRecent) {
      const recentMemories = await getRecentMemories(userId, sessionId, limit)
      results.push(...recentMemories.map(memory => ({
        memory,
        similarity: 1.0, // Recent messages get full similarity
        relevanceScore: calculateRelevanceScore(memory, query, 'recent')
      })))
    }

    // Get similar conversations (simplified for testing without OpenAI)
    if (includeSimilar) {
      const similarMemories = await getSimilarMemories(userId, query, limit / 2)
      results.push(...similarMemories.map(memory => ({
        memory,
        similarity: 0.8, // Mock similarity score
        relevanceScore: calculateRelevanceScore(memory, query, 'similar')
      })))
    }

    // Sort by relevance score and remove duplicates
    const uniqueResults = removeDuplicateMemories(results)
    return uniqueResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  } catch (error) {
    console.error('Error finding relevant memories:', error)
    throw error
  }
}

/**
 * Get recent conversation memories
 */
async function getRecentMemories(userId, sessionId, limit = 10) {
  try {
    let whereClause = `user_id = '${userId}' AND interaction_type = 'CHAT_MESSAGE'`
    if (sessionId) {
      whereClause += ` AND session_id = '${sessionId}'`
    }
    
    const recentInteractions = await prisma.$queryRaw`
      SELECT id, user_id, content, response, context, sentiment, intent, topics, session_id, timestamp
      FROM user_interactions 
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `

    return recentInteractions.map(interaction => {
      return {
        id: interaction.id,
        userId: interaction.user_id,
        sessionId: interaction.session_id,
        userMessage: interaction.content,
        aiResponse: interaction.response,
        context: interaction.context || {},
        timestamp: interaction.timestamp,
        importance: interaction.context?.importance || 1.0,
        extractedInsights: interaction.context?.extractedInsights,
        sentiment: interaction.sentiment,
        intent: interaction.intent,
        topics: interaction.topics || []
      }
    })
  } catch (error) {
    console.error('Error getting recent memories:', error)
    return []
  }
}

/**
 * Get similar memories (simplified version for testing)
 */
async function getSimilarMemories(userId, query, limit) {
  try {
    // Simple keyword-based similarity for testing
    const queryWords = query.toLowerCase().split(' ')
    
    const interactions = await prisma.$queryRaw`
      SELECT id, user_id, content, response, context, sentiment, intent, topics, session_id, timestamp
      FROM user_interactions 
      WHERE user_id = '${userId}' AND interaction_type = 'CHAT_MESSAGE'
      ORDER BY timestamp DESC
      LIMIT ${limit * 3}
    `

    // Filter by keyword similarity
    const similarInteractions = interactions.filter(interaction => {
      const userMessage = interaction.content.toLowerCase()
      const aiResponse = (interaction.response || '').toLowerCase()
      
      return queryWords.some(word => 
        userMessage.includes(word) || aiResponse.includes(word)
      )
    })

    return similarInteractions.slice(0, limit).map(interaction => {
      return {
        id: interaction.id,
        userId: interaction.user_id,
        sessionId: interaction.session_id,
        userMessage: interaction.content,
        aiResponse: interaction.response,
        context: interaction.context || {},
        timestamp: interaction.timestamp,
        importance: interaction.context?.importance || 1.0,
        extractedInsights: interaction.context?.extractedInsights,
        sentiment: interaction.sentiment,
        intent: interaction.intent,
        topics: interaction.topics || []
      }
    })
  } catch (error) {
    console.error('Error getting similar memories:', error)
    return []
  }
}

/**
 * Calculate relevance score for a memory
 */
function calculateRelevanceScore(memory, query, type) {
  let score = 0

  // Base score by type
  if (type === 'recent') {
    score = 0.8 // Recent messages are highly relevant
  } else {
    score = 0.6 // Similar messages are moderately relevant
  }

  // Boost score based on importance
  score += memory.importance * 0.2

  // Boost score if topics match
  if (memory.topics && memory.topics.length > 0) {
    const queryWords = query.toLowerCase().split(' ')
    const matchingTopics = memory.topics.filter(topic => 
      queryWords.some(word => topic.toLowerCase().includes(word))
    )
    score += (matchingTopics.length / memory.topics.length) * 0.1
  }

  return Math.min(score, 1.0) // Cap at 1.0
}

/**
 * Remove duplicate memories based on content similarity
 */
function removeDuplicateMemories(results) {
  const seen = new Set()
  const unique = []

  for (const result of results) {
    const key = `${result.memory.userId}-${result.memory.userMessage}-${result.memory.aiResponse}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(result)
    }
  }

  return unique
}

/**
 * Generate context for AI chat using conversation memory
 */
async function generateMemoryContext(
  userId,
  currentMessage,
  options = {}
) {
  const {
    maxContextLength = 4000,
    includeUserProfile = true,
    includeRecentHistory = true,
    includeSimilarConversations = true,
    sessionId
  } = options

  try {
    // Get relevant memories
    const relevantMemories = await findRelevantMemories(
      userId,
      currentMessage,
      {
        limit: 15,
        threshold: 0.6,
        includeRecent: includeRecentHistory,
        includeSimilar: includeSimilarConversations,
        sessionId
      }
    )

    // Get user profile context if requested
    let userProfileContext = ''
    if (includeUserProfile) {
      userProfileContext = await getUserProfileContext(userId)
    }

    // Build memory context
    const memoryContext = buildMemoryContext(relevantMemories, userProfileContext)
    
    // Generate context summary
    const contextSummary = generateContextSummary(relevantMemories, currentMessage)

    return {
      memoryContext,
      relevantMemories,
      contextSummary
    }
  } catch (error) {
    console.error('Error generating memory context:', error)
    throw error
  }
}

/**
 * Build memory context string
 */
function buildMemoryContext(memories, userProfileContext) {
  const contexts = []

  // Add user profile context
  if (userProfileContext) {
    contexts.push(`User Profile Context:\n${userProfileContext}\n`)
  }

  // Add relevant conversation memories
  if (memories.length > 0) {
    contexts.push('Relevant Conversation History:')
    
    memories.slice(0, 8).forEach((result, index) => {
      const memory = result.memory
      contexts.push(`
${index + 1}. User: ${memory.userMessage}
   AI: ${memory.aiResponse}
   Context: ${memory.context.pageContext || 'General chat'}
   Relevance: ${(result.relevanceScore * 100).toFixed(0)}%${memory.topics?.length ? `, Topics: ${memory.topics.join(', ')}` : ''}`)
    })
  }

  return contexts.join('\n')
}

/**
 * Generate context summary for logging/debugging
 */
function generateContextSummary(memories, currentMessage) {
  const summary = {
    totalMemories: memories.length,
    recentMemories: memories.filter(m => m.similarity === 1.0).length,
    similarMemories: memories.filter(m => m.similarity < 1.0).length,
    avgRelevanceScore: memories.reduce((sum, m) => sum + m.relevanceScore, 0) / memories.length || 0,
    currentMessageLength: currentMessage.length
  }

  return JSON.stringify(summary, null, 2)
}

/**
 * Get user profile context
 */
async function getUserProfileContext(userId) {
  try {
    const userProfile = await prisma.$queryRaw`
      SELECT company_name, industry, role, experience_level, goals, preferences
      FROM user_profiles 
      WHERE user_id = '${userId}'
      LIMIT 1
    `

    if (!userProfile || userProfile.length === 0) return ''

    const profile = userProfile[0]
    const profileParts = []
    
    if (profile.company_name) {
      profileParts.push(`Company: ${profile.company_name}`)
    }
    if (profile.industry) {
      profileParts.push(`Industry: ${profile.industry}`)
    }
    if (profile.role) {
      profileParts.push(`Role: ${profile.role}`)
    }
    if (profile.experience_level) {
      profileParts.push(`Experience: ${profile.experience_level}`)
    }
    if (profile.goals) {
      profileParts.push(`Goals: ${profile.goals}`)
    }

    return profileParts.join(', ')
  } catch (error) {
    console.error('Error getting user profile context:', error)
    return ''
  }
}

/**
 * Get memory statistics for a user
 */
async function getMemoryStats(userId) {
  try {
    const [totalMemories, recentMemories] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM user_interactions 
        WHERE user_id = '${userId}' AND interaction_type = 'CHAT_MESSAGE'
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM user_interactions 
        WHERE user_id = '${userId}' 
          AND interaction_type = 'CHAT_MESSAGE'
          AND timestamp >= NOW() - INTERVAL '7 days'
      `
    ])

    return {
      totalMemories: totalMemories[0].count,
      recentMemories: recentMemories[0].count,
      avgImportance: 1.0
    }
  } catch (error) {
    console.error('Error getting memory stats:', error)
    throw error
  }
}

module.exports = {
  storeConversationMemory,
  findRelevantMemories,
  generateMemoryContext,
  getMemoryStats,
  getRecentMemories,
  getUserProfileContext
}
