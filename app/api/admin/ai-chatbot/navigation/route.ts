import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const navigationItems = await prisma?.aIChatbotNavigation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(navigationItems)
  } catch (error) {
    console.error('Error fetching navigation items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch navigation items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, route, description } = await request.json()

    if (!name || !route) {
      return NextResponse.json(
        { error: 'Name and route are required' },
        { status: 400 }
      )
    }

    const navigationItem = await prisma?.aIChatbotNavigation.create({
      data: {
        name,
        route,
        description,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, navigationItem })
  } catch (error) {
    console.error('Error creating navigation item:', error)
    return NextResponse.json(
      { error: 'Failed to create navigation item' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, route, description, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const navigationItem = await prisma?.aIChatbotNavigation.update({
      where: { id },
      data: {
        name,
        route,
        description,
        isActive: isActive ?? true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, navigationItem })
  } catch (error) {
    console.error('Error updating navigation item:', error)
    return NextResponse.json(
      { error: 'Failed to update navigation item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    await prisma?.aIChatbotNavigation.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting navigation item:', error)
    return NextResponse.json(
      { error: 'Failed to delete navigation item' },
      { status: 500 }
    )
  }
}

