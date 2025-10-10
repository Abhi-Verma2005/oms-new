const OpenAI = require('openai')
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Initialize OpenAI client (only if API key is available)
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

/**
 * Generate embedding for text content using OpenAI
 */
async function generateEmbedding(text, model = 'text-embedding-3-small') {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }
  
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
    throw new Error(`Failed to generate embedding: ${error.message}`)
  }
}

/**
 * Get content hash for caching
 */
function getContentHash(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Store embedding in database with caching
 */
async function storeEmbedding(
  userId,
  content,
  contentType,
  options = {}
) {
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
async function findSimilarConversations(
  userId,
  queryText,
  options = {}
) {
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
    `

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
async function getConversationContext(
  userId,
  currentMessage,
  options = {}
) {
  const {
    maxContextLength = 4000,
    includeRecentMessages = true,
    includeSimilarMessages = true,
    sessionId
  } = options

  try {
    let recentMessages = []
    let similarMessages = []

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
function generateContextSummary(recentMessages, similarMessages) {
  const contexts = []

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
async function cleanupOldEmbeddings(userId, daysToKeep = 90) {
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

module.exports = {
  generateEmbedding,
  storeEmbedding,
  findSimilarConversations,
  getConversationContext,
  generateContextSummary,
  cleanupOldEmbeddings,
  getContentHash,
}
