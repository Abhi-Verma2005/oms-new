import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const projectId = searchParams.get('projectId') || undefined
  const excludeCategories = searchParams.get('excludeCategories')?.split(',') || []
  const includeCategories = searchParams.get('includeCategories')?.split(',').filter(Boolean) || []
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const cursor = searchParams.get('cursor') || undefined

  const where: any = { userId }
  
  // Include specific categories if provided (e.g., CART, PAYMENT, ORDER, NAVIGATION)
  if (includeCategories.length > 0) {
    where.category = { in: includeCategories }
  }

  // Exclude certain categories (like AUTHENTICATION)
  if (excludeCategories.length > 0) {
    // Combine include/exclude if both present
    if (includeCategories.length > 0) {
      where.AND = [
        { category: { in: includeCategories } },
        { category: { notIn: excludeCategories } },
      ]
      delete where.category
    } else {
      where.category = { notIn: excludeCategories }
    }
  }
  
  // Note: projectId filtering will work once the database migration is run
  // For now, we'll fetch all activities and filter client-side if needed
  // if (projectId) where.projectId = projectId

  const activities = await prisma.userActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const nextCursor = activities.length > limit ? activities[limit].id : null
  const data = activities.slice(0, limit)
  return NextResponse.json({ data, nextCursor })
}


