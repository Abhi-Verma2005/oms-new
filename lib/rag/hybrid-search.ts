import { prisma } from '@/lib/db'
import { generateEmbedding } from '@/lib/embedding-utils'
import { RAGMonitoring } from './monitoring'

export interface HybridSearchResult {
  id: string
  content: string
  score: number
  metadata: any
  match_type: 'semantic' | 'keyword' | 'both'
  similarity?: number
  rank?: number
}

export interface HybridSearchConfig {
  semanticWeight: number // 0-1, default 0.7
  keywordWeight: number  // 0-1, default 0.3
  topK: number           // default 25 (before reranking)
  minSimilarity: number  // default 0.5
  filters?: {
    contentTypes?: string[]
    dateRange?: { start: Date; end: Date }
    topics?: string[]
  }
}

/**
 * 🚀 Blazing Fast Hybrid Search Implementation
 * Combines semantic similarity + keyword matching for optimal results
 */
export async function hybridSearch(
  userId: string,
  query: string,
  config: HybridSearchConfig = {
    semanticWeight: 0.7,
    keywordWeight: 0.3,
    topK: 25,
    minSimilarity: 0.5
  }
): Promise<HybridSearchResult[]> {
  
  return await RAGMonitoring.track('hybrid_search', async () => {
    // 1. Generate query embedding (cached)
    const queryEmbedding = await generateEmbedding(query)
    
    // 2. Build dynamic filters
    const filters = buildFilters(config.filters)
    
    // 3. Execute hybrid search in single optimized query
    const results = await prisma.$queryRaw<HybridSearchResult[]>`
      WITH semantic_search AS (
        SELECT 
          id,
          content,
          metadata,
          topics,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector(1536)) as similarity,
          'semantic' as match_type
        FROM user_knowledge_base
        WHERE 
          user_id = ${userId}
          AND embedding IS NOT NULL
          ${filters.whereClause}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector(1536)
        LIMIT ${config.topK}
      ),
      keyword_search AS (
        SELECT 
          id,
          content,
          metadata,
          topics,
          ts_rank(sparse_embedding, plainto_tsquery('english', ${query})) as rank,
          'keyword' as match_type
        FROM user_knowledge_base
        WHERE 
          user_id = ${userId}
          AND sparse_embedding @@ plainto_tsquery('english', ${query})
          ${filters.whereClause}
        ORDER BY rank DESC
        LIMIT ${config.topK}
      ),
      combined AS (
        SELECT 
          COALESCE(s.id, k.id) as id,
          COALESCE(s.content, k.content) as content,
          COALESCE(s.metadata, k.metadata) as metadata,
          COALESCE(s.topics, k.topics) as topics,
          COALESCE(s.similarity, 0) * ${config.semanticWeight} + 
          COALESCE(k.rank, 0) * ${config.keywordWeight} as score,
          COALESCE(s.similarity, 0) as similarity,
          COALESCE(k.rank, 0) as rank,
          CASE 
            WHEN s.id IS NOT NULL AND k.id IS NOT NULL THEN 'both'
            WHEN s.id IS NOT NULL THEN 'semantic'
            ELSE 'keyword'
          END as match_type
        FROM semantic_search s
        FULL OUTER JOIN keyword_search k ON s.id = k.id
      )
      SELECT * FROM combined
      WHERE score > ${config.minSimilarity}
      ORDER BY score DESC
      LIMIT ${config.topK}
    `
    
    // 4. Update access metrics asynchronously (non-blocking)
    if (results.length > 0) {
      setImmediate(() => {
        updateAccessMetrics(results.map(r => r.id))
          .catch(err => console.warn('Failed to update access metrics:', err))
      })
    }
    
    return results
  }, {
    queryLength: query.length,
    topK: config.topK,
    userId
  })
}

/**
 * Build dynamic WHERE clause for filtering
 */
function buildFilters(filters?: HybridSearchConfig['filters']): {
  whereClause: string
  params: any[]
} {
  if (!filters) {
    return { whereClause: '', params: [] }
  }
  
  const conditions: string[] = []
  const params: any[] = []
  
  if (filters.contentTypes?.length) {
    conditions.push(`content_type = ANY($${params.length + 1})`)
    params.push(filters.contentTypes)
  }
  
  if (filters.dateRange) {
    conditions.push(`created_at BETWEEN $${params.length + 1} AND $${params.length + 2}`)
    params.push(filters.dateRange.start, filters.dateRange.end)
  }
  
  if (filters.topics?.length) {
    conditions.push(`topics && $${params.length + 1}`)
    params.push(filters.topics)
  }
  
  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  
  return { whereClause, params }
}

/**
 * Update access metrics in background
 */
async function updateAccessMetrics(ids: string[]): Promise<void> {
  await prisma.$executeRaw`
    SELECT update_access_metrics(${ids}::uuid[])
  `
}

/**
 * Get recent interactions for context
 */
export async function getRecentInteractions(
  userId: string,
  limit: number = 10
): Promise<HybridSearchResult[]> {
  
  return await RAGMonitoring.track('recent_interactions', async () => {
    const results = await prisma.$queryRaw<HybridSearchResult[]>`
      SELECT 
        id,
        content,
        metadata,
        topics,
        1.0 as similarity,
        1.0 as score,
        'recent' as match_type
      FROM user_knowledge_base
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    
    return results
  }, { userId, limit })
}

/**
 * Get user-specific context
 */
export async function getUserContext(userId: string): Promise<{
  preferences: any
  recentTopics: string[]
  conversationHistory: string[]
}> {
  
  return await RAGMonitoring.track('user_context', async () => {
    const [userProfile, recentTopics, recentChats] = await Promise.all([
      // Get user profile
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          companyName: true,
          industry: true,
          role: true,
          primaryGoals: true,
          communicationStyle: true
        }
      }),
      
      // Get recent topics
      prisma.$queryRaw<{ topics: string[] }[]>`
        SELECT DISTINCT unnest(topics) as topics
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY topics
        LIMIT 10
      `,
      
      // Get recent conversation history
      prisma.$queryRaw<{ content: string }[]>`
        SELECT content
        FROM user_knowledge_base
        WHERE user_id = ${userId}
          AND content_type = 'conversation'
        ORDER BY created_at DESC
        LIMIT 5
      `
    ])
    
    return {
      preferences: userProfile || {},
      recentTopics: recentTopics.map(t => t.topics).filter(Boolean),
      conversationHistory: recentChats.map(c => c.content)
    }
  }, { userId })
}
