import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { getNamespace } from './rag-namespace'

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'test-key'
})

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || 'test-key'
})

export class MinimalRAG {
  private index: any
  private openai: OpenAI

  constructor() {
    this.openai = openai
  }

  async initialize() {
    try {
      console.log('🔍 Initializing Pinecone...')
      const indexName = 'oms-knowledge-base'
      
      // Get or create index
      const indexes = await pinecone.listIndexes()
      const existingIndex = indexes.indexes?.find(idx => idx.name === indexName)
      
      if (!existingIndex) {
        console.log('📦 Creating Pinecone index...')
        await pinecone.createIndex({
          name: indexName,
          dimension: 1536, // OpenAI ada-002 embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        })
        console.log('✅ Pinecone index created')
      } else {
        console.log('✅ Pinecone index found')
      }
      
      this.index = pinecone.index(indexName)
      console.log('🚀 RAG system initialized')
      
    } catch (error) {
      console.error('❌ RAG initialization failed:', error)
      throw error
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Updated to newer model
        input: text,
        dimensions: 1536
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('❌ Embedding generation failed:', error)
      throw error
    }
  }

  // FIXED: Smart chunking with paragraph boundaries
  chunkDocument(
    content: string, 
    documentId: string,
    documentName: string,
    userId: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): Array<{text: string; index: number; metadata: any}> {
    const chunks = []
    let chunkIndex = 0
    
    // Split by paragraphs (double newlines)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
    let currentChunk = ''
    
    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim()
      
      // Check if adding this paragraph would exceed chunk size
      if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
          metadata: {
            documentId,
            documentName,
            userId,
            chunkIndex,
            totalChunks: 0 // Updated later
          }
        })
        
        // Create overlap: take last ~200 chars from current chunk
        const overlapText = currentChunk.slice(-overlap).trim()
        currentChunk = overlapText + '\n\n' + trimmedPara
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          documentId,
          documentName,
          userId,
          chunkIndex,
          totalChunks: 0
        }
      })
    }
    
    // Update total chunks count
    const totalChunks = chunks.length
    chunks.forEach(chunk => chunk.metadata.totalChunks = totalChunks)
    
    return chunks
  }

  // FIXED: Batch embedding generation with consistent model
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Consistent model, cheaper than ada-002
        input: texts,
        dimensions: 1536 // Explicit dimension specification
      })
      
      return response.data.map(item => item.embedding)
    } catch (error) {
      console.error('❌ Embedding generation failed:', error)
      throw error
    }
  }

  // FIXED: Add document with proper namespace isolation
  async addDocumentWithChunking(
    content: string, 
    metadata: {
      documentId: string
      filename: string
      type: string
      size: number
    },
    userId: string
  ): Promise<{ success: boolean; chunks: any[]; error?: string }> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📄 Processing document: ${metadata.filename} for user ${userId}`)
      
      // 1. Chunk the document
      const chunks = this.chunkDocument(
        content, 
        metadata.documentId, 
        metadata.filename, 
        userId
      )
      
      if (chunks.length === 0) {
        throw new Error('No chunks created from document')
      }
      
      console.log(`✂️ Created ${chunks.length} chunks`)
      
      // 2. Generate embeddings for all chunks
      const chunkTexts = chunks.map(c => c.text)
      const embeddings = await this.generateEmbeddings(chunkTexts)
      
      // 3. Prepare vectors with rich metadata
      const vectors = chunks.map((chunk, i) => ({
        id: `${metadata.documentId}_chunk_${chunk.index}`,
        values: embeddings[i],
        metadata: {
          ...chunk.metadata,
          type: 'document_chunk', // Identify as document chunk
          text: chunk.text, // Store full text in Pinecone metadata
          timestamp: new Date().toISOString(),
          fileType: metadata.type,
          fileSize: metadata.size
        }
      }))
      
      // 4. FIXED: Upsert to user's namespace
      const namespace = getNamespace('documents', userId)
      await this.index.namespace(namespace).upsert(vectors)
      
      console.log(`✅ Uploaded ${chunks.length} chunks to namespace: ${namespace}`)
      return { success: true, chunks }
      
    } catch (error) {
      console.error('❌ Failed to add document:', error)
      return { 
        success: false, 
        chunks: [],
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // FIXED: Search with proper namespace and token limits
  async searchDocumentChunks(
    query: string, 
    userId: string, 
    limit: number = 5,
    maxTokens: number = 8000 // Increased token limit for better context
  ): Promise<Array<{
    id: string
    content: string
    score: number
    documentId: string
    documentName: string
    chunkIndex: number
    metadata: any
  }>> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🔍 Searching documents for user ${userId}: "${query.substring(0, 50)}..."`)
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // FIXED: Search in user's document namespace only
      const namespace = getNamespace('documents', userId)
      const results = await this.index.namespace(namespace).query({
        vector: queryEmbedding,
        topK: limit * 2, // Get more results for token filtering
        includeMetadata: true
      })
      
      // Extract and format chunks
      let chunks = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.text as string || '',
        score: match.score || 0,
        documentId: match.metadata?.documentId as string,
        documentName: match.metadata?.documentName as string,
        chunkIndex: match.metadata?.chunkIndex as number,
        metadata: match.metadata || {}
      })) || []
      
      // FIXED: Token-aware filtering (rough estimate: 4 chars = 1 token)
      let totalTokens = 0
      const filteredChunks = []
      
      for (const chunk of chunks) {
        const estimatedTokens = Math.ceil(chunk.content.length / 4)
        if (totalTokens + estimatedTokens <= maxTokens) {
          filteredChunks.push(chunk)
          totalTokens += estimatedTokens
        } else {
          break // Stop adding chunks
        }
      }
      
      console.log(`✅ Found ${filteredChunks.length} relevant chunks (~${totalTokens} tokens)`)
      return filteredChunks
      
    } catch (error) {
      console.error('❌ Document search failed:', error)
      return []
    }
  }

  // FIXED: Proper document deletion from namespace
  async deleteUserDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🗑️ Deleting document ${documentId} for user ${userId}`)
      
      const namespace = getNamespace('documents', userId)
      
      // Get all chunk IDs for this document
      const results = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0),
        filter: { documentId: { $eq: documentId } },
        topK: 10000,
        includeMetadata: true
      })
      
      const chunkIds = results.matches?.map(m => m.id) || []
      
      if (chunkIds.length > 0) {
        // Delete all chunks
        await this.index.namespace(namespace).deleteMany(chunkIds)
        console.log(`✅ Deleted ${chunkIds.length} chunks from Pinecone`)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Document deletion failed:', error)
      return false
    }
  }

  async addDocument(content: string, metadata: any, userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📄 Adding document for user ${userId}...`)
      
      // Generate embedding
      const embedding = await this.generateEmbedding(content)
      
      // Create unique ID
      const id = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Upsert to Pinecone
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          ...metadata,
          userId,
          content: content.substring(0, 1000), // Store first 1000 chars
          timestamp: new Date().toISOString()
        }
      }])
      
      console.log(`✅ Document added with ID: ${id}`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to add document:', error)
      return false
    }
  }

  async searchDocuments(query: string, userId: string, limit: number = 5): Promise<any[]> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🔍 Searching documents for user ${userId}: "${query}"`)
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Search in Pinecone
      const results = await this.index.query({
        vector: queryEmbedding,
        filter: { userId: { $eq: userId } },
        topK: limit,
        includeMetadata: true
      })
      
      const documents = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.content || '',
        score: match.score || 0,
        metadata: match.metadata || {}
      })) || []
      
      console.log(`✅ Found ${documents.length} documents`)
      return documents
      
    } catch (error) {
      console.error('❌ Document search failed:', error)
      return []
    }
  }

  async updateUserContext(userId: string, context: any): Promise<boolean> {
    try {
      console.log(`👤 Updating user context for ${userId}...`)
      
      // This would update the user_context field in the conversations table
      // For now, just log the context
      console.log('📊 User context:', JSON.stringify(context, null, 2))
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to update user context:', error)
      return false
    }
  }

  // Store conversation for user-specific training
  async storeConversation(userId: string, messages: any[], summary?: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`💬 Storing conversation for user ${userId}...`)
      
      // Create conversation summary for embedding
      const conversationText = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      // Generate embedding for the conversation
      const embedding = await this.generateEmbedding(conversationText)
      
      // Create unique ID for conversation
      const id = `conv_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store in Pinecone with user isolation
      await this.index.upsert([{
        id,
        values: embedding,
        metadata: {
          userId,
          type: 'conversation',
          content: conversationText.substring(0, 2000), // Store first 2000 chars
          summary: summary || conversationText.substring(0, 500),
          messageCount: messages.length,
          timestamp: new Date().toISOString(),
          isPrivate: true // Ensure user isolation
        }
      }])
      
      console.log(`✅ Conversation stored with ID: ${id}`)
      return true
      
    } catch (error) {
      console.error('❌ Failed to store conversation:', error)
      return false
    }
  }

  // Get user-specific conversation history
  async getUserConversations(userId: string, limit: number = 10): Promise<any[]> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`📚 Retrieving conversations for user ${userId}...`)
      
      // Search for user's conversations only
      const results = await this.index.query({
        vector: new Array(1536).fill(0), // Dummy vector for metadata search
        filter: { 
          userId: { $eq: userId },
          type: { $eq: 'conversation' }
        },
        topK: limit,
        includeMetadata: true
      })
      
      const conversations = results.matches?.map(match => ({
        id: match.id,
        content: match.metadata?.content || '',
        summary: match.metadata?.summary || '',
        timestamp: match.metadata?.timestamp || '',
        messageCount: match.metadata?.messageCount || 0
      })) || []
      
      console.log(`✅ Found ${conversations.length} conversations for user ${userId}`)
      return conversations
      
    } catch (error) {
      console.error('❌ Failed to get user conversations:', error)
      return []
    }
  }

  // Delete user data (GDPR compliance)
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize()
      }

      console.log(`🗑️ Deleting all data for user ${userId}...`)
      
      // Get all user's vectors
      const results = await this.index.query({
        vector: new Array(1536).fill(0),
        filter: { userId: { $eq: userId } },
        topK: 10000, // Large number to get all
        includeMetadata: true
      })
      
      // Delete all user's vectors
      if (results.matches && results.matches.length > 0) {
        const idsToDelete = results.matches.map(match => match.id)
        await this.index.deleteMany(idsToDelete)
        console.log(`✅ Deleted ${idsToDelete.length} vectors for user ${userId}`)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to delete user data:', error)
      return false
    }
  }
}

// Export singleton instance
export const ragSystem = new MinimalRAG()
