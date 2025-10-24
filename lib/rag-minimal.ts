import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'

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
        model: 'text-embedding-ada-002',
        input: text
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('❌ Embedding generation failed:', error)
      throw error
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
