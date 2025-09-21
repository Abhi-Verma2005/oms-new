import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAIChatbot() {
  try {
    console.log('🌱 Seeding AI Chatbot configuration...')

    // Create default system prompt
    const systemPrompt = `You are a helpful AI assistant for the Outreach Mosaic application. You can help users navigate the application, answer questions about features, and provide general assistance.

Key features of this application:
- User management and authentication
- Admin dashboard for system management
- Feedback system for user input
- Notification system
- Role-based access control
- Search functionality

When users ask to navigate to specific pages, use the navigation data provided to help them get to the right place. Be friendly, helpful, and concise in your responses.`

    // Default navigation data
    const navigationData = [
      { name: 'Dashboard', route: '/dashboard', description: 'Main dashboard overview' },
      { name: 'Admin Panel', route: '/admin', description: 'Administrative controls and settings' },
      { name: 'Users', route: '/admin/users', description: 'User management' },
      { name: 'Roles', route: '/admin/roles', description: 'Role management' },
      { name: 'Permissions', route: '/admin/permissions', description: 'Permission management' },
      { name: 'Feedback', route: '/admin/feedback', description: 'User feedback management' },
      { name: 'Notifications', route: '/admin/notifications', description: 'Notification management' },
      { name: 'Activities', route: '/admin/activities', description: 'User activity logs' },
      { name: 'Profile', route: '/profile', description: 'User profile settings' },
      { name: 'Sign In', route: '/signin', description: 'User authentication' },
      { name: 'Sign Up', route: '/signup', description: 'User registration' }
    ]

    // Upsert AI Chatbot config
    const config = await prisma.aIChatbotConfig.upsert({
      where: { id: 'default' },
      update: {
        systemPrompt,
        navigationData,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        systemPrompt,
        navigationData,
        isActive: true
      }
    })

    console.log('✅ AI Chatbot config created/updated:', config.id)

    // Create navigation items
    for (const navItem of navigationData) {
      await prisma.aIChatbotNavigation.upsert({
        where: { 
          name_route: {
            name: navItem.name,
            route: navItem.route
          }
        },
        update: {
          description: navItem.description,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          name: navItem.name,
          route: navItem.route,
          description: navItem.description,
          isActive: true
        }
      })
    }

    console.log('✅ Navigation items created/updated')

    console.log('🎉 AI Chatbot seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding AI Chatbot:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAIChatbot()

