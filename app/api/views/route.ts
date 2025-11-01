import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ views: [] })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId') || undefined

    console.log('Views API: GET request received for user:', session.user.id, 'projectId:', projectId)

    // If projectId is provided and not 'individual', filter by project; otherwise show all for the user
    const where: any = { userId: session.user.id }
    if (projectId && projectId !== 'individual') {
      where.projectId = projectId
    }

    // Include default views in the list - they should be visible in the dropdown
    const views = await prisma.savedView.findMany({
      where,
      orderBy: [
        // Put "Default" view first if it exists
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    // Sort manually to put "Default" at the top
    const sortedViews = views.sort((a, b) => {
      if (a.name === 'Default' && b.name !== 'Default') return -1
      if (a.name !== 'Default' && b.name === 'Default') return 1
      return 0
    })
    
    console.log('Views API: Returning views:', sortedViews)
    return Response.json({ views: sortedViews })
  } catch (error) {
    console.log('Views API: Error fetching views:', error)
    return Response.json({ views: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const name = String(body?.name || '').trim()
    const filters = body?.filters ?? {}
    const incomingProjectId: string | undefined = body?.projectId || undefined
    const projectId = incomingProjectId === 'individual' ? null : incomingProjectId ?? null
    
    if (!name) return new Response('Name required', { status: 400 })

    console.log('Views API: Creating/updating view for user:', session.user.id, 'name:', name, 'projectId:', projectId)
    
    // Find existing view by userId, name, and projectId (using the new unique constraint)
    const existing = await prisma.savedView.findFirst({
      where: {
        userId: session.user.id,
        name,
        projectId: projectId === 'individual' ? null : projectId
      }
    })
    
    const savedView = existing
      ? await prisma.savedView.update({
          where: { id: existing.id },
          data: { filters, updatedAt: new Date() }
        })
      : await prisma.savedView.create({
          data: { userId: session.user.id, name, filters, projectId: projectId === 'individual' ? null : projectId }
    })

    console.log('Views API: Created/updated view:', savedView)
    return Response.json({ ok: true, id: savedView.id })
  } catch (error) {
    console.log('Views API: Error creating view:', error)
    return new Response('Bad Request', { status: 400 })
  }
}


