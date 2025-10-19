import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ views: [] })
    }

    console.log('Views API: GET request received for user:', session.user.id)
    const views = await prisma.savedView.findMany({
      where: { userId: session.user.id },
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
    
    if (!name) return new Response('Name required', { status: 400 })

    console.log('Views API: Creating view for user:', session.user.id, 'name:', name)
    
    // Use upsert to handle duplicate names (update existing or create new)
    const savedView = await prisma.savedView.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name
        }
      },
      update: {
        filters: filters,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        name: name,
        filters: filters
      }
    })

    console.log('Views API: Created/updated view:', savedView)
    return Response.json({ ok: true, id: savedView.id })
  } catch (error) {
    console.log('Views API: Error creating view:', error)
    return new Response('Bad Request', { status: 400 })
  }
}


