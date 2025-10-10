import { PrismaClient } from '@prisma/client'
import { 
  storeEmbedding, 
  findSimilarConversations, 
  getConversationContext,
  MemoryChunk 
} from './embedding-utils'

const prisma = new PrismaClient()

export interface ConversationMemory {
  id: string
  userId: string
  sessionId?: string
  userMessage: string
  aiResponse: string
  context: {
    url?: string
    cartState?: any
    pageContext?: string
    userProfile?: any
  }
  timestamp: Date
  importance: number
  extractedInsights?: any
  sentiment?: string
  intent?: string
  topics?: string[]
}

export interface MemorySearchResult {
  memory: ConversationMemory
  similarity: number
  relevanceScore: number
}

/**
 * Store a complete conversation turn (user message + AI response)
 */
export async function storeConversationMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  options: {
    sessionId?: string
    context?: {
      url?: string
      cartState?: any
      pageContext?: string
      userProfile?: any
    }
    importance?: number
    extractedInsights?: any
    sentiment?: string
    intent?: string
    topics?: string[]
  } = {}
): Promise<string> {
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

    // Store user message embedding
    const userMessageId = await storeEmbedding(
      userId,
      userMessage,
      'user_message',
      {
        sessionId,
        pageContext: context.pageContext,
        importance,
        extractedInsights,
        sentiment,
        intent,
        topics
      }
    )

    // Store AI response embedding
    const aiResponseId = await storeEmbedding(
      userId,
      aiResponse,
      'ai_response',
      {
        sessionId,
        pageContext: context.pageContext,
        importance,
        extractedInsights,
        sentiment,
        intent,
        topics
      }
    )

    // Also store the conversation pair in user_interactions table
    await prisma.user_interactions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        interaction_type: 'CHAT_MESSAGE',
        content: JSON.stringify({
          userMessage,
          aiResponse,
          context,
          sessionId,
          importance,
          extractedInsights,
          sentiment,
          intent,
          topics,
          userMessageId,
          aiResponseId
        }),
        metadata: {
          sessionId,
          context,
          importance,
          extractedInsights,
          sentiment,
          intent,
          topics
        }
      }
    })

    console.log(`✅ Stored conversation memory for user ${userId}`)
    return userMessageId
  } catch (error) {
    console.error('Error storing conversation memory:', error)
    throw error
  }
}

/**
 * Find relevant conversation memories for a given query
 */
export async function findRelevantMemories(
  userId: string,
  query: string,
  options: {
    limit?: number
    threshold?: number
    includeRecent?: boolean
    includeSimilar?: boolean
    sessionId?: string
    contentType?: string
  } = {}
): Promise<MemorySearchResult[]> {
  const {
    limit = 10,
    threshold = 0.7,
    includeRecent = true,
    includeSimilar = true,
    sessionId,
    contentType
  } = options

  try {
    const results: MemorySearchResult[] = []

    // Get recent conversations
    if (includeRecent) {
      const recentMemories = await getRecentMemories(userId, sessionId, limit)
      results.push(...recentMemories.map(memory => ({
        memory,
        similarity: 1.0, // Recent messages get full similarity
        relevanceScore: calculateRelevanceScore(memory, query, 'recent')
      })))
    }

    // Get similar conversations
    if (includeSimilar) {
      const similarChunks = await findSimilarConversations(
        userId,
        query,
        {
          limit: Math.ceil(limit / 2),
          threshold,
          contentType,
          excludeSessionId: sessionId
        }
      )

      // Convert chunks to conversation memories
      const similarMemories = await chunksToMemories(similarChunks)
      
      results.push(...similarMemories.map((memory, index) => ({
        memory,
        similarity: similarChunks[index]?.similarity || 0,
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
async function getRecentMemories(
  userId: string,
  sessionId?: string,
  limit: number = 10
): Promise<ConversationMemory[]> {
  try {
    const recentInteractions = await prisma.user_interactions.findMany({
      where: {
        user_id: userId,
        interaction_type: 'CHAT_MESSAGE',
        ...(sessionId && {
          metadata: {
            path: ['sessionId'],
            equals: sessionId
          }
        })
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return recentInteractions.map(interaction => {
      const content = JSON.parse(interaction.content)
      return {
        id: interaction.id,
        userId: interaction.user_id,
        sessionId: content.sessionId,
        userMessage: content.userMessage,
        aiResponse: content.aiResponse,
        context: content.context || {},
        timestamp: interaction.timestamp,
        importance: content.importance || 1.0,
        extractedInsights: content.extractedInsights,
        sentiment: content.sentiment,
        intent: content.intent,
        topics: content.topics || []
      }
    })
  } catch (error) {
    console.error('Error getting recent memories:', error)
    return []
  }
}

/**
 * Convert memory chunks to conversation memories
 */
async function chunksToMemories(chunks: MemoryChunk[]): Promise<ConversationMemory[]> {
  try {
    const memories: ConversationMemory[] = []
    
    for (const chunk of chunks) {
      // Try to find the corresponding conversation pair
      const interaction = await prisma.user_interactions.findFirst({
        where: {
          user_id: chunk.userId,
          interaction_type: 'CHAT_MESSAGE',
          content: {
            contains: chunk.id
          }
        }
      })

      if (interaction) {
        const content = JSON.parse(interaction.content)
        memories.push({
          id: interaction.id,
          userId: chunk.userId,
          sessionId: content.sessionId,
          userMessage: content.userMessage,
          aiResponse: content.aiResponse,
          context: content.context || {},
          timestamp: interaction.timestamp,
          importance: chunk.importance,
          extractedInsights: chunk.extractedInsights,
          sentiment: chunk.sentiment,
          intent: chunk.intent,
          topics: chunk.topics
        })
      }
    }

    return memories
  } catch (error) {
    console.error('Error converting chunks to memories:', error)
    return []
  }
}

/**
 * Calculate relevance score for a memory
 */
function calculateRelevanceScore(
  memory: ConversationMemory,
  query: string,
  type: 'recent' | 'similar'
): number {
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

  // Boost score if intent matches
  if (memory.intent) {
    const queryLower = query.toLowerCase()
    if (queryLower.includes('help') && memory.intent.includes('help')) {
      score += 0.1
    }
    if (queryLower.includes('buy') && memory.intent.includes('purchase')) {
      score += 0.1
    }
  }

  return Math.min(score, 1.0) // Cap at 1.0
}

/**
 * Remove duplicate memories based on content similarity
 */
function removeDuplicateMemories(results: MemorySearchResult[]): MemorySearchResult[] {
  const seen = new Set<string>()
  const unique: MemorySearchResult[] = []

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
export async function generateMemoryContext(
  userId: string,
  currentMessage: string,
  options: {
    maxContextLength?: number
    includeUserProfile?: boolean
    includeRecentHistory?: boolean
    includeSimilarConversations?: boolean
    sessionId?: string
  } = {}
): Promise<{
  memoryContext: string
  relevantMemories: MemorySearchResult[]
  contextSummary: string
}> {
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
      const userProfile = await getUserProfileContext(userId)
      userProfileContext = userProfile
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
function buildMemoryContext(
  memories: MemorySearchResult[],
  userProfileContext: string
): string {
  const contexts: string[] = []

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
function generateContextSummary(
  memories: MemorySearchResult[],
  currentMessage: string
): string {
  const summary = {
    totalMemories: memories.length,
    recentMemories: memories.filter(m => m.similarity === 1.0).length,
    similarMemories: memories.filter(m => m.similarity < 1.0).length,
    avgRelevanceScore: memories.reduce((sum, m) => sum + m.relevanceScore, 0) / memories.length || 0,
    topTopics: getTopTopics(memories),
    currentMessageLength: currentMessage.length
  }

  return JSON.stringify(summary, null, 2)
}

/**
 * Get top topics from memories
 */
function getTopTopics(memories: MemorySearchResult[]): string[] {
  const topicCounts = new Map<string, number>()
  
  memories.forEach(result => {
    result.memory.topics?.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
    })
  })

  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic)
}

/**
 * Get user profile context
 */
async function getUserProfileContext(userId: string): Promise<string> {
  try {
    const userProfile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
      select: {
        company_name: true,
        industry: true,
        role: true,
        experience_level: true,
        goals: true,
        preferences: true
      }
    })

    if (!userProfile) return ''

    const profileParts: string[] = []
    
    if (userProfile.company_name) {
      profileParts.push(`Company: ${userProfile.company_name}`)
    }
    if (userProfile.industry) {
      profileParts.push(`Industry: ${userProfile.industry}`)
    }
    if (userProfile.role) {
      profileParts.push(`Role: ${userProfile.role}`)
    }
    if (userProfile.experience_level) {
      profileParts.push(`Experience: ${userProfile.experience_level}`)
    }
    if (userProfile.goals) {
      profileParts.push(`Goals: ${userProfile.goals}`)
    }

    return profileParts.join(', ')
  } catch (error) {
    console.error('Error getting user profile context:', error)
    return ''
  }
}

/**
 * Clean up old conversation memories (maintenance function)
 */
export async function cleanupOldMemories(
  userId: string,
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Clean up user_interactions
    const interactionResult = await prisma.user_interactions.deleteMany({
      where: {
        user_id: userId,
        interaction_type: 'CHAT_MESSAGE',
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    // Clean up embeddings
    const embeddingResult = await prisma.user_interaction_embeddings.deleteMany({
      where: {
        user_id: userId,
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    const totalCleaned = interactionResult.count + embeddingResult.count
    console.log(`Cleaned up ${totalCleaned} old memories for user ${userId}`)
    return totalCleaned
  } catch (error) {
    console.error('Error cleaning up old memories:', error)
    throw error
  }
}

/**
 * Get memory statistics for a user
 */
export async function getMemoryStats(userId: string): Promise<{
  totalMemories: number
  totalEmbeddings: number
  recentMemories: number
  topTopics: string[]
  avgImportance: number
}> {
  try {
    const [totalMemories, totalEmbeddings, recentMemories, topTopics, avgImportance] = await Promise.all([
      prisma.user_interactions.count({
        where: {
          user_id: userId,
          interaction_type: 'CHAT_MESSAGE'
        }
      }),
      prisma.user_interaction_embeddings.count({
        where: { user_id: userId }
      }),
      prisma.user_interactions.count({
        where: {
          user_id: userId,
          interaction_type: 'CHAT_MESSAGE',
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      getTopTopics([]), // This would need to be implemented properly
      1.0 // Placeholder
    ])

    return {
      totalMemories,
      totalEmbeddings,
      recentMemories,
      topTopics: [],
      avgImportance
    }
  } catch (error) {
    console.error('Error getting memory stats:', error)
    throw error
  }
}
