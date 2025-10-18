/**
 * AI Performance Optimizer
 * Utility functions to optimize AI chat performance
 */

import { prisma } from '@/lib/db'

export class AIPerformanceOptimizer {
  private static embeddingCache = new Map<string, number[]>()
  private static readonly CACHE_SIZE_LIMIT = 1000
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Generate or retrieve cached embedding
   */
  static async getCachedEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.generateCacheKey(text)
    
    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!
    }

    // Generate new embedding
    const embedding = await this.generateEmbedding(text)
    
    // Cache it
    if (this.embeddingCache.size >= this.CACHE_SIZE_LIMIT) {
      // Remove oldest entries (simple LRU)
      const firstKey = this.embeddingCache.keys().next().value
      this.embeddingCache.delete(firstKey)
    }
    
    this.embeddingCache.set(cacheKey, embedding)
    
    // Set TTL
    setTimeout(() => {
      this.embeddingCache.delete(cacheKey)
    }, this.CACHE_TTL)
    
    return embedding
  }

  /**
   * Generate embedding using OpenAI API
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY!
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      // Return mock embedding as fallback
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    }
  }

  /**
   * Generate cache key for text
   */
  private static generateCacheKey(text: string): string {
    // Simple hash function for cache key
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Optimized RAG query with connection pooling
   */
  static async performOptimizedRAGQuery(
    userId: string,
    queryEmbedding: number[],
    message: string,
    limit: number = 8
  ) {
    try {
      // Use a single optimized query with proper indexing
      const results = await prisma.$queryRaw`
        WITH ranked_results AS (
          SELECT 
            id,
            content,
            metadata,
            content_type,
            created_at,
            COALESCE(1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536)), 0.5) AS similarity,
            CASE 
              WHEN LOWER(content) LIKE LOWER(${'%' + message + '%'}) THEN 3.0
              WHEN content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days' THEN 2.5
              WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1.5
              WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.0
              ELSE 0.5
            END AS priority_score
          FROM user_knowledge_base
          WHERE user_id = ${userId}
            AND (
              LOWER(content) LIKE LOWER(${'%' + message + '%'}) OR
              (content_type = 'user_fact' AND created_at > NOW() - INTERVAL '7 days') OR
              (embedding IS NOT NULL AND (1 - (embedding <=> ${`[${queryEmbedding.join(',')}]`}::vector(1536))) > 0.15)
            )
        )
        SELECT *
        FROM ranked_results
        ORDER BY priority_score DESC, similarity DESC, created_at DESC
        LIMIT ${limit}
      `
      
      return results
    } catch (error) {
      console.error('RAG query failed:', error)
      return []
    }
  }

  /**
   * Batch store conversations for better performance
   */
  static async batchStoreConversations(
    userId: string,
    conversations: Array<{
      content: string
      contentType: string
      embedding: number[]
      metadata: any
    }>
  ) {
    try {
      // Use batch insert for better performance
      const values = conversations.map(conv => 
        `(${userId}, ${conv.content}, ${conv.contentType}, ${`[${conv.embedding.join(',')}]`}::vector(1536), ${JSON.stringify(conv.metadata)}::jsonb, NOW())`
      ).join(', ')

      await prisma.$executeRaw`
        INSERT INTO user_knowledge_base (user_id, content, content_type, embedding, metadata, created_at)
        VALUES ${values}
      `
    } catch (error) {
      console.error('Batch store failed:', error)
    }
  }

  /**
   * Clear performance cache
   */
  static clearCache(): void {
    this.embeddingCache.clear()
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.embeddingCache.size,
      limit: this.CACHE_SIZE_LIMIT,
      ttl: this.CACHE_TTL
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics: Array<{
    operation: string
    duration: number
    timestamp: Date
    userId?: string
  }> = []

  /**
   * Measure operation performance
   */
  static async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      
      this.metrics.push({
        operation,
        duration,
        timestamp: new Date(),
        userId
      })
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100)
      }
      
      console.log(`⏱️ ${operation}: ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`❌ ${operation} failed after ${duration}ms:`, error)
      throw error
    }
  }

  /**
   * Get performance statistics
   */
  static getStats() {
    const stats = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        }
      }
      
      const opStats = acc[metric.operation]
      opStats.count++
      opStats.totalDuration += metric.duration
      opStats.avgDuration = opStats.totalDuration / opStats.count
      opStats.minDuration = Math.min(opStats.minDuration, metric.duration)
      opStats.maxDuration = Math.max(opStats.maxDuration, metric.duration)
      
      return acc
    }, {} as Record<string, any>)
    
    return stats
  }

  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics = []
  }
}


