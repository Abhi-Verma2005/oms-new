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

    const views = await prisma.savedView.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Views API: Returning views:', views)
    return Response.json({ views })
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

    // Maintain existing uniqueness (userId + name) while attaching optional projectId
    const existing = await prisma.savedView.findUnique({
      where: { userId_name: { userId: session.user.id, name } }
    })
    const savedView = existing
      ? await prisma.savedView.update({
          where: { userId_name: { userId: session.user.id, name } },
          data: { filters, projectId, updatedAt: new Date() }
        })
      : await prisma.savedView.create({
          data: { userId: session.user.id, name, filters, projectId }
        })

    console.log('Views API: Created/updated view:', savedView)
    return Response.json({ ok: true, id: savedView.id })
  } catch (error) {
    console.log('Views API: Error creating view:', error)
    return new Response('Bad Request', { status: 400 })
  }
}


