import { prisma } from '@/lib/db'
import { ragSystem } from '@/lib/rag-minimal'

// Note: Database filtering removed - publisher page uses external API

// Navigation tool
export async function navigateTo(route: string, userId: string) {
  console.log(`🧭 Navigating to: ${route}`)
  
  // Log navigation in conversation
  try {
    const conversation = await prisma.$queryRaw`
      SELECT id FROM conversations WHERE user_id = ${userId} LIMIT 1
    `
    
    if (conversation.length > 0) {
      const conversationId = conversation[0].id
      
      // Add navigation to tool history
      await prisma.$executeRaw`
        UPDATE conversations 
        SET tool_history = tool_history || ${JSON.stringify([{
          type: 'navigation',
          route,
          timestamp: new Date().toISOString()
        }])}::jsonb
        WHERE id = ${conversationId}
      `
    }
  } catch (error) {
    console.error('❌ Failed to log navigation:', error instanceof Error ? error.message : 'Unknown error')
  }
  
  return {
    action: 'navigate',
    route,
    message: `Navigating to ${route}`,
    success: true
  }
}

// Document search tool
export async function searchDocuments(query: string, userId: string) {
  console.log(`🔍 Searching documents for: "${query}"`)
  
  try {
    // Search using RAG system
    const documents = await ragSystem.searchDocuments(query, userId, 5)
    
    // Update RAG context in conversation
    const conversation = await prisma.$queryRaw`
      SELECT id FROM conversations WHERE user_id = ${userId} LIMIT 1
    `
    
    if (conversation.length > 0) {
      const conversationId = conversation[0].id
      
      await prisma.$executeRaw`
        UPDATE conversations 
        SET rag_context = ${JSON.stringify({
          query,
          sources: documents,
          timestamp: new Date().toISOString()
        })}::jsonb
        WHERE id = ${conversationId}
      `
    }
    
    return {
      action: 'search_completed',
      query,
      sources: documents,
      message: `Found ${documents.length} documents about "${query}"`,
      success: true
    }
    
  } catch (error) {
    console.error('❌ Document search failed:', error instanceof Error ? error.message : 'Unknown error')
    return {
      action: 'search_failed',
      query,
      sources: [],
      message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

// Cart management tool
export async function addToCart(productId: string, quantity: number, userId: string) {
  console.log(`🛒 Adding to cart: ${productId} x${quantity}`)
  
  try {
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId
      }
    })
    
    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity
        }
      })
    }
    
    // Get updated cart count
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      select: { quantity: true }
    })
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    
    return {
      action: 'cart_updated',
      productId,
      quantity,
      totalItems,
      message: `Added ${quantity}x product ${productId} to cart (${totalItems} total items)`,
      success: true
    }
    
  } catch (error) {
    console.error('❌ Failed to add to cart:', error instanceof Error ? error.message : 'Unknown error')
    return {
      action: 'cart_failed',
      productId,
      quantity: 0,
      message: `Failed to add to cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

// Filter tool
export async function applyFilters(filters: any, userId: string) {
  console.log(`🔍 Applying filters:`, filters)
  
  try {
    // Extract reasoning from filters
    const { reasoning, ...actualFilters } = filters
    
    // Build URL parameters
    const urlParams = new URLSearchParams()
    
    // Map filter parameters to URL parameters
    if (actualFilters.priceMin) urlParams.set('priceMin', actualFilters.priceMin.toString())
    if (actualFilters.priceMax) urlParams.set('priceMax', actualFilters.priceMax.toString())
    if (actualFilters.daMin) urlParams.set('daMin', actualFilters.daMin.toString())
    if (actualFilters.daMax) urlParams.set('daMax', actualFilters.daMax.toString())
    if (actualFilters.paMin) urlParams.set('paMin', actualFilters.paMin.toString())
    if (actualFilters.paMax) urlParams.set('paMax', actualFilters.paMax.toString())
    if (actualFilters.drMin) urlParams.set('drMin', actualFilters.drMin.toString())
    if (actualFilters.drMax) urlParams.set('drMax', actualFilters.drMax.toString())
    if (actualFilters.spamMin) urlParams.set('spamMin', actualFilters.spamMin.toString())
    if (actualFilters.spamMax) urlParams.set('spamMax', actualFilters.spamMax.toString())
    if (actualFilters.niche) urlParams.set('niche', actualFilters.niche)
    if (actualFilters.country) urlParams.set('country', actualFilters.country)
    if (actualFilters.language) urlParams.set('language', actualFilters.language)
    if (actualFilters.trafficMin) urlParams.set('trafficMin', actualFilters.trafficMin.toString())
    if (actualFilters.trafficMax) urlParams.set('trafficMax', actualFilters.trafficMax.toString())
    if (actualFilters.semrushTrafficMin) urlParams.set('semrushTrafficMin', actualFilters.semrushTrafficMin.toString())
    if (actualFilters.semrushTrafficMax) urlParams.set('semrushTrafficMax', actualFilters.semrushTrafficMax.toString())
    if (actualFilters.trafficTrend) urlParams.set('trafficTrend', actualFilters.trafficTrend)
    if (actualFilters.backlinkNature) urlParams.set('backlinkNature', actualFilters.backlinkNature)
    if (actualFilters.availability !== undefined) urlParams.set('availability', actualFilters.availability.toString())
    if (actualFilters.tatMin) urlParams.set('tatMin', actualFilters.tatMin.toString())
    if (actualFilters.tatMax) urlParams.set('tatMax', actualFilters.tatMax.toString())
    
    const publisherUrl = `/publishers?${urlParams.toString()}`
    
    return {
      action: 'filter_applied',
      filters: actualFilters,
      reasoning: reasoning, // Pass reasoning to frontend
      message: `Applied filters successfully`,
      url: publisherUrl,
      success: true
    }
  } catch (error) {
    console.error('❌ Filter application error:', error)
    return {
      action: 'filter_error',
      message: 'Failed to apply filters',
      success: false
    }
  }
}

// Document upload tool
export async function uploadDocument(content: string, filename: string, userId: string) {
  console.log(`📄 Uploading document: ${filename}`)
  
  try {
    // Add document to RAG system
    const success = await ragSystem.addDocument(content, {
      filename,
      type: 'user_upload',
      size: content.length
    }, userId)
    
    if (success) {
      // Update conversation with document info
      const conversation = await prisma.$queryRaw`
        SELECT id FROM conversations WHERE user_id = ${userId} LIMIT 1
      `
      
      if (conversation.length > 0) {
        const conversationId = conversation[0].id
        
        // Add document to documents array
        await prisma.$executeRaw`
          UPDATE conversations 
          SET documents = documents || ${JSON.stringify([{
            filename,
            size: content.length,
            uploadedAt: new Date().toISOString()
          }])}::jsonb
          WHERE id = ${conversationId}
        `
      }
      
      return {
        action: 'document_uploaded',
        filename,
        size: content.length,
        message: `Document ${filename} uploaded and processed successfully`,
        success: true
      }
    } else {
      throw new Error('Failed to add document to RAG system')
    }
    
  } catch (error) {
    console.error('❌ Failed to upload document:', error instanceof Error ? error.message : 'Unknown error')
    return {
      action: 'upload_failed',
      filename,
      message: `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

// Get user context tool
export async function getUserContext(userId: string) {
  console.log(`👤 Getting user context for: ${userId}`)
  
  try {
    const conversation = await prisma.$queryRaw`
      SELECT user_context, rag_context, tool_history 
      FROM conversations 
      WHERE user_id = ${userId} 
      LIMIT 1
    `
    
    if (conversation.length > 0) {
      const context = conversation[0]
      return {
        action: 'context_retrieved',
        userContext: context.user_context,
        ragContext: context.rag_context,
        toolHistory: context.tool_history,
        message: 'User context retrieved successfully',
        success: true
      }
    } else {
      return {
        action: 'context_not_found',
        message: 'No user context found',
        success: false
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to get user context:', error instanceof Error ? error.message : 'Unknown error')
    return {
      action: 'context_failed',
      message: `Failed to get user context: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

