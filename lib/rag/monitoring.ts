import { prisma } from '@/lib/db'

interface RAGMetrics {
  operation: string
  duration: number
  success: boolean
  userId?: string
  metadata?: any
  timestamp?: Date
}

/**
 * 📊 Production-Grade RAG Performance Monitoring
 * Tracks all RAG operations for optimization and debugging
 */
export class RAGMonitoring {
  private static metrics: RAGMetrics[] = []
  
  /**
   * Track operation performance with automatic logging
   */
  static async track<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now()
    let success = true
    
    try {
      const result = await fn()
      
      // Log success metrics
      this.logMetrics({
        operation,
        duration: Date.now() - startTime,
        success: true,
        metadata
      })
      
      return result
    } catch (error) {
      success = false
      
      // Log error metrics
      this.logMetrics({
        operation,
        duration: Date.now() - startTime,
        success: false,
        metadata: {
          ...metadata,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      throw error
    }
  }
  
  /**
   * Log metrics to database and console
   */
  private static logMetrics(metrics: RAGMetrics): void {
    const timestamp = new Date()
    
    // Add to in-memory cache
    this.metrics.push({
      ...metrics,
      timestamp
    })
    
    // Log slow operations
    if (metrics.duration > 1000) {
      console.warn(`[Slow Operation] ${metrics.operation} took ${metrics.duration}ms`)
    }
    
    // Store in database (non-blocking)
    setImmediate(async () => {
      try {
        await prisma.rag_performance_metrics.create({
          data: {
            operation: metrics.operation,
            duration_ms: metrics.duration,
            success: metrics.success,
            query_length: metrics.metadata?.queryLength,
            context_length: metrics.metadata?.contextLength,
            docs_retrieved: metrics.metadata?.docsRetrieved,
            docs_final: metrics.metadata?.docsFinal,
            metadata: metrics.metadata || {}
          }
        })
      } catch (error) {
        console.error('Failed to log metrics:', error)
      }
    })
    
    // Clean up old metrics periodically
    if (this.metrics.length > 1000) {
      this.cleanup(3600000) // Keep last hour
    }
  }
  
  /**
   * Get performance statistics for an operation
   */
  static getStats(operation?: string): {
    count: number
    successRate: number
    avgDuration: number
    minDuration: number
    maxDuration: number
    p50: number
    p95: number
    p99: number
  } | null {
    const filtered = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics
    
    if (filtered.length === 0) return null
    
    const durations = filtered.map(m => m.duration)
    const successCount = filtered.filter(m => m.success).length
    
    return {
      count: filtered.length,
      successRate: (successCount / filtered.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99)
    }
  }
  
  /**
   * Get database performance stats
   */
  static async getDatabaseStats(): Promise<{
    totalMetrics: number
    recentOperations: any[]
    avgPerformance: any
  }> {
    try {
      const [totalMetrics, recentOperations, avgPerformance] = await Promise.all([
        prisma.rag_performance_metrics.count(),
        
        prisma.rag_performance_metrics.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: {
            operation: true,
            duration_ms: true,
            success: true,
            timestamp: true
          }
        }),
        
        prisma.rag_performance_metrics.groupBy({
          by: ['operation'],
          _avg: { duration_ms: true },
          _count: { operation: true },
          orderBy: { _avg: { duration_ms: 'desc' } }
        })
      ])
      
      return {
        totalMetrics,
        recentOperations,
        avgPerformance
      }
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return {
        totalMetrics: 0,
        recentOperations: [],
        avgPerformance: []
      }
    }
  }
  
  /**
   * Health check for RAG system
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    metrics: any
  }> {
    const issues: string[] = []
    const metrics = this.getStats()
    
    // Check performance thresholds
    if (metrics) {
      if (metrics.avgDuration > 2000) {
        issues.push(`Average response time too high: ${metrics.avgDuration}ms`)
      }
      
      if (metrics.successRate < 95) {
        issues.push(`Success rate too low: ${metrics.successRate}%`)
      }
      
      if (metrics.p95 > 5000) {
        issues.push(`95th percentile too high: ${metrics.p95}ms`)
      }
    }
    
    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      issues.push('Database connectivity issue')
    }
    
    // Check OpenAI API (optional)
    if (process.env.OPENAI_API_KEY) {
      try {
        // Simple connectivity check
        await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        })
      } catch (error) {
        issues.push('OpenAI API connectivity issue')
      }
    }
    
    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'degraded' : 'unhealthy'
    
    return {
      status,
      issues,
      metrics
    }
  }
  
  /**
   * Calculate percentile
   */
  private static percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index] || 0
  }
  
  /**
   * Clean up old metrics
   */
  static cleanup(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs
    this.metrics = this.metrics.filter(m => {
      const timestamp = m.timestamp?.getTime() || 0
      return timestamp > cutoff
    })
  }
  
  /**
   * Export metrics for analysis
   */
  static exportMetrics(): RAGMetrics[] {
    return [...this.metrics]
  }
  
  /**
   * Reset metrics (for testing)
   */
  static reset(): void {
    this.metrics = []
  }
}
