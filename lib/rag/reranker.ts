import { RAGMonitoring } from './monitoring'

export interface RerankResult {
  id: string
  content: string
  score: number
  originalRank: number
  newRank: number
  metadata: any
}

/**
 * 🎯 High-Precision Reranking for RAG
 * Uses Cohere's rerank model for 30-48% better accuracy
 */
export class Reranker {
  
  /**
   * Rerank retrieved documents using Cohere API
   * Reduces from 25 candidates to top 5 with high precision
   */
  async rerank(
    query: string,
    documents: any[],
    topN: number = 5
  ): Promise<RerankResult[]> {
    
    return await RAGMonitoring.track('rerank', async () => {
      if (documents.length === 0) return []
      
      try {
        // Use Cohere rerank API for best results
        const response = await this.callCohereRerank(query, documents, topN)
        
        // Map results back to original documents with metadata
        const reranked: RerankResult[] = response.results.map((result: any, idx: number) => {
          const originalDoc = documents[result.index]
          return {
            id: originalDoc.id,
            content: originalDoc.content,
            score: result.relevance_score,
            originalRank: result.index,
            newRank: idx,
            metadata: originalDoc.metadata || {}
          }
        })
        
        return reranked
        
      } catch (error) {
        console.error('Reranking failed:', error)
        
        // Fallback: return top N from original results with basic scoring
        return this.fallbackRerank(documents, topN)
      }
    }, {
      queryLength: query.length,
      documentCount: documents.length,
      topN
    })
  }
  
  /**
   * Call Cohere rerank API
   */
  private async callCohereRerank(
    query: string,
    documents: any[],
    topN: number
  ): Promise<any> {
    
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key not configured')
    }
    
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'rerank-english-v3.0',
        query: query,
        documents: documents.map(doc => doc.content),
        topN: topN,
        returnDocuments: true
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cohere API error: ${response.status} ${errorText}`)
    }
    
    return await response.json()
  }
  
  /**
   * Fallback reranking when Cohere is unavailable
   */
  private fallbackRerank(documents: any[], topN: number): RerankResult[] {
    return documents.slice(0, topN).map((doc, idx) => ({
      id: doc.id,
      content: doc.content,
      score: doc.score || (1 - idx * 0.1), // Decreasing score
      originalRank: idx,
      newRank: idx,
      metadata: doc.metadata || {}
    }))
  }
  
  /**
   * Local reranking using cross-encoder (alternative to Cohere)
   * Good for self-hosted solutions
   */
  async rerankLocal(
    query: string,
    documents: any[],
    topN: number = 5
  ): Promise<RerankResult[]> {
    
    // This would use a local cross-encoder model
    // Implementation depends on your ML infrastructure
    console.log('Local reranking not implemented yet')
    return this.fallbackRerank(documents, topN)
  }
  
  /**
   * Multi-stage reranking for complex queries
   */
  async multiStageRerank(
    query: string,
    documents: any[],
    stages: number = 2
  ): Promise<RerankResult[]> {
    
    let currentDocs = documents
    const docsPerStage = Math.ceil(documents.length / stages)
    
    for (let stage = 0; stage < stages; stage++) {
      const stageDocs = currentDocs.slice(0, docsPerStage * (stage + 1))
      currentDocs = await this.rerank(query, stageDocs, docsPerStage)
    }
    
    return currentDocs.slice(0, 5) // Final top 5
  }
}

/**
 * Singleton reranker instance
 */
export const reranker = new Reranker()
