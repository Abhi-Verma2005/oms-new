import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface EmbeddingResult {
  embedding: number[]
  model: string
  usage?: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface MemoryChunk {
  id: string
  userId: string
  content: string
  contentType: string
  embedding?: number[]
  sessionId?: string
  pageContext?: string
  timestamp: Date
  importance: number
  extractedInsights?: any
  sentiment?: string
  intent?: string
  topics?: string[]
}

/**
 * Generate embedding for text content using OpenAI
 */
export async function generateEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    })

    return {
      embedding: response.data[0].embedding,
      model: response.model,
      usage: response.usage,
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get content hash for caching
 */
export function getContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Store embedding in database with caching
 */
export async function storeEmbedding(
  userId: string,
  content: string,
  contentType: string,
  options: {
    sessionId?: string
    pageContext?: string
    importance?: number
    extractedInsights?: any
    sentiment?: string
    intent?: string
    topics?: string[]
    forceRegenerate?: boolean
  } = {}
): Promise<string> {
  const {
    sessionId,
    pageContext,
    importance = 1.0,
    extractedInsights,
    sentiment,
    intent,
    topics = [],
    forceRegenerate = false
  } = options

  try {
    // Generate unique ID
    const id = crypto.randomUUID()
    
    // Check if we already have an embedding for this content (unless force regenerate)
    if (!forceRegenerate) {
      const existing = await prisma.user_interaction_embeddings.findFirst({
        where: {
          user_id: userId,
          content: content,
          contentType: contentType,
        },
        select: { id: true, embedding: true }
      })
      
      if (existing && existing.embedding) {
        console.log(`Using existing embedding for content: ${content.substring(0, 50)}...`)
        return existing.id
      }
    }

    // Generate new embedding
    console.log(`Generating embedding for: ${content.substring(0, 50)}...`)
    const embeddingResult = await generateEmbedding(content)
    
    // Store in database
    const record = await prisma.user_interaction_embeddings.create({
      data: {
        id,
        user_id: userId,
        content,
        contentType,
        embedding: embeddingResult.embedding,
        session_id: sessionId,
        page_context: pageContext,
        importance,
        extracted_insights: extractedInsights,
        sentiment,
        intent,
        topics,
      },
    })

    console.log(`✅ Stored embedding for user ${userId}, record ID: ${id}`)
    return record.id
  } catch (error) {
    console.error('Error storing embedding:', error)
    throw error
  }
}

/**
 * Find similar conversations using vector similarity search
 */
export async function findSimilarConversations(
  userId: string,
  queryText: string,
  options: {
    limit?: number
    threshold?: number
    contentType?: string
    excludeSessionId?: string
  } = {}
): Promise<MemoryChunk[]> {
  const {
    limit = 5,
    threshold = 0.7,
    contentType,
    excludeSessionId
  } = options

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText)
    
    // Build similarity search query
    let whereClause = `user_id = '${userId}' AND embedding IS NOT NULL`
    
    if (contentType) {
      whereClause += ` AND "contentType" = '${contentType}'`
    }
    
    if (excludeSessionId) {
      whereClause += ` AND (session_id IS NULL OR session_id != '${excludeSessionId}')`
    }

    // Perform vector similarity search
    const similarRecords = await prisma.$queryRaw`
      SELECT 
        id,
        user_id,
        content,
        "contentType",
        session_id,
        page_context,
        timestamp,
        importance,
        extracted_insights,
        sentiment,
        intent,
        topics,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding.embedding)}::vector(1536)) as similarity
      FROM user_interaction_embeddings 
      WHERE ${whereClause}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding.embedding)}::vector(1536)
      LIMIT ${limit * 2}
    ` as any[]

    // Filter by similarity threshold and format results
    const results = similarRecords
      .filter(record => record.similarity >= threshold)
      .slice(0, limit)
      .map(record => ({
        id: record.id,
        userId: record.user_id,
        content: record.content,
        contentType: record.contentType,
        sessionId: record.session_id,
        pageContext: record.page_context,
        timestamp: record.timestamp,
        importance: record.importance,
        extractedInsights: record.extracted_insights,
        sentiment: record.sentiment,
        intent: record.intent,
        topics: record.topics || [],
        similarity: record.similarity,
      }))

    console.log(`Found ${results.length} similar conversations for user ${userId}`)
    return results
  } catch (error) {
    console.error('Error finding similar conversations:', error)
    throw error
  }
}

/**
 * Get conversation context for AI chat
 */
export async function getConversationContext(
  userId: string,
  currentMessage: string,
  options: {
    maxContextLength?: number
    includeRecentMessages?: boolean
    includeSimilarMessages?: boolean
    sessionId?: string
  } = {}
): Promise<{
  recentMessages: MemoryChunk[]
  similarMessages: MemoryChunk[]
  contextSummary: string
}> {
  const {
    maxContextLength = 4000,
    includeRecentMessages = true,
    includeSimilarMessages = true,
    sessionId
  } = options

  try {
    let recentMessages: MemoryChunk[] = []
    let similarMessages: MemoryChunk[] = []

    // Get recent messages if requested
    if (includeRecentMessages) {
      const recent = await prisma.user_interaction_embeddings.findMany({
        where: {
          user_id: userId,
          ...(sessionId && { session_id: sessionId }),
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          user_id: true,
          content: true,
          contentType: true,
          session_id: true,
          page_context: true,
          timestamp: true,
          importance: true,
          extracted_insights: true,
          sentiment: true,
          intent: true,
          topics: true,
        }
      })

      recentMessages = recent.map(record => ({
        id: record.id,
        userId: record.user_id,
        content: record.content,
        contentType: record.contentType,
        sessionId: record.session_id,
        pageContext: record.page_context,
        timestamp: record.timestamp,
        importance: record.importance,
        extractedInsights: record.extracted_insights,
        sentiment: record.sentiment,
        intent: record.intent,
        topics: record.topics || [],
      }))
    }

    // Get similar messages if requested
    if (includeSimilarMessages) {
      similarMessages = await findSimilarConversations(
        userId,
        currentMessage,
        {
          limit: 5,
          threshold: 0.75,
          excludeSessionId: sessionId,
        }
      )
    }

    // Generate context summary
    const contextSummary = generateContextSummary(recentMessages, similarMessages)

    return {
      recentMessages,
      similarMessages,
      contextSummary,
    }
  } catch (error) {
    console.error('Error getting conversation context:', error)
    throw error
  }
}

/**
 * Generate a summary of the conversation context
 */
function generateContextSummary(
  recentMessages: MemoryChunk[],
  similarMessages: MemoryChunk[]
): string {
  const contexts: string[] = []

  if (recentMessages.length > 0) {
    contexts.push(`Recent conversation history (${recentMessages.length} messages):`)
    recentMessages.slice(0, 3).forEach(msg => {
      contexts.push(`- ${msg.contentType}: ${msg.content}`)
    })
  }

  if (similarMessages.length > 0) {
    contexts.push(`\nSimilar past conversations (${similarMessages.length} messages):`)
    similarMessages.slice(0, 3).forEach(msg => {
      contexts.push(`- ${msg.contentType}: ${msg.content} (similarity: ${msg.similarity?.toFixed(2)})`)
    })
  }

  return contexts.join('\n')
}

/**
 * Clean up old embeddings (optional maintenance function)
 */
export async function cleanupOldEmbeddings(
  userId: string,
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.user_interaction_embeddings.deleteMany({
      where: {
        user_id: userId,
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    console.log(`Cleaned up ${result.count} old embeddings for user ${userId}`)
    return result.count
  } catch (error) {
    console.error('Error cleaning up old embeddings:', error)
    throw error
  }
}
