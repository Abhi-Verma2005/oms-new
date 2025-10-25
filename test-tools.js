const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testTools() {
  try {
    console.log('🧪 Testing tool functions...')
    
    // Get a test user
    const user = await prisma.user.findFirst({
      select: { id: true, email: true }
    })
    
    if (!user) {
      console.log('❌ No users found')
      return
    }
    
    console.log('👤 Testing with user:', user.email)
    
    // Test cart functionality
    console.log('🛒 Testing cart functionality...')
    
    // Add item to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: 'test-product-123',
        quantity: 2
      }
    })
    
    console.log('✅ Cart item created:', cartItem.id)
    
    // Check cart count
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id }
    })
    
    console.log('📊 Cart items count:', cartItems.length)
    
    // Test conversation update
    console.log('💬 Testing conversation update...')
    
    const conversation = await prisma.$queryRaw`
      SELECT id FROM conversations WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (conversation.length > 0) {
      const conversationId = conversation[0].id
      
      // Update tool history
      await prisma.$executeRaw`
        UPDATE conversations 
        SET tool_history = tool_history || ${JSON.stringify([{
          type: 'test_tool',
          action: 'cart_add',
          timestamp: new Date().toISOString()
        }])}::jsonb
        WHERE id = ${conversationId}
      `
      
      console.log('✅ Tool history updated')
      
      // Check updated conversation
      const updatedConversation = await prisma.$queryRaw`
        SELECT tool_history FROM conversations WHERE id = ${conversationId}
      `
      
      console.log('📊 Tool history:', updatedConversation[0].tool_history.length, 'entries')
    }
    
    console.log('🎉 All tool tests passed!')
    
  } catch (error) {
    console.error('❌ Tool test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTools()

