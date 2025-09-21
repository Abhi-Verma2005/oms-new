import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const config = await prisma?.aIChatbotConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    })

    const navigationData = await prisma?.aIChatbotNavigation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      systemPrompt: config?.systemPrompt || 'You are a helpful AI assistant for this application.',
      navigationData: navigationData.map(nav => ({
        id: nav.id,
        name: nav.name,
        route: nav.route,
        description: nav.description
      }))
    })
  } catch (error) {
    console.error('Error fetching AI chatbot config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, navigationData } = await request.json()

    // Update or create config
    const config = await prisma?.aIChatbotConfig.upsert({
      where: { id: 'default' },
      update: {
        systemPrompt,
        navigationData,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        systemPrompt,
        navigationData,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error updating AI chatbot config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

