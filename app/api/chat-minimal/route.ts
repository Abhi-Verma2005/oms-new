import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { 
  navigateTo, 
  searchDocuments, 
  addToCart, 
  applyFilters, 
  uploadDocument, 
  getUserContext 
} from '@/lib/tools-minimal'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }
    
    console.log(`🚀 Minimal AI Chat: ${messages.length} messages for user ${userId}`)
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      temperature: 0.1,
      maxSteps: 3,
      tools: {
        searchDocuments: tool({
          description: 'Search user documents and knowledge base',
          parameters: z.object({ 
            query: z.string()
          }),
          execute: async ({ query }) => {
            return await searchDocuments(query, userId)
          }
        }),
        
        navigateTo: tool({
          description: 'Navigate to a specific page',
          parameters: z.object({ 
            route: z.string()
          }),
          execute: async ({ route }) => {
            return await navigateTo(route, userId)
          }
        }),
        
        addToCart: tool({
          description: 'Add product to cart',
          parameters: z.object({ 
            productId: z.string(),
            quantity: z.number().default(1)
          }),
          execute: async ({ productId, quantity }) => {
            return await addToCart(productId, quantity, userId)
          }
        }),
        
        applyFilters: tool({
          description: 'Apply filters to search results',
          parameters: z.object({ 
            filters: z.record(z.any())
          }),
          execute: async ({ filters }) => {
            return await applyFilters(filters, userId)
          }
        }),
        
        uploadDocument: tool({
          description: 'Upload and process a document',
          parameters: z.object({ 
            content: z.string(),
            filename: z.string()
          }),
          execute: async ({ content, filename }) => {
            return await uploadDocument(content, filename, userId)
          }
        }),
        
        getUserContext: tool({
          description: 'Get user context and preferences',
          parameters: z.object({}),
          execute: async () => {
            return await getUserContext(userId)
          }
        })
      },
      onFinish: async (result) => {
        try {
          // Update conversation in database
          const conversation = await prisma.$queryRaw`
            SELECT id FROM conversations WHERE user_id = ${userId} LIMIT 1
          `
          
          if (conversation.length > 0) {
            const conversationId = conversation[0].id
            
            // Update messages
            const updatedMessages = [...messages, { 
              role: 'assistant', 
              content: result.text,
              timestamp: new Date().toISOString()
            }]
            
            await prisma.$executeRaw`
              UPDATE conversations 
              SET 
                messages = ${JSON.stringify(updatedMessages)}::jsonb,
                updated_at = NOW()
              WHERE id = ${conversationId}
            `
            
            console.log(`✅ Updated conversation ${conversationId} with ${updatedMessages.length} messages`)
          }
        } catch (error) {
          console.error('❌ Failed to update conversation:', error)
        }
      }
    })
    
    return result.toDataStreamResponse()
    
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
