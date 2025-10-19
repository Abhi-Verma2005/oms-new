 
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params
    
    console.log('Views API: Deleting view:', id, 'for user:', session.user.id)
    
    // Delete the view, ensuring it belongs to the current user
    const deletedView = await prisma.savedView.deleteMany({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (deletedView.count === 0) {
      return new Response('View not found', { status: 404 })
    }

    console.log('Views API: Deleted view:', id)
    return Response.json({ ok: true })
  } catch (error) {
    console.log('Views API: Error deleting view:', error)
    return new Response('Bad Request', { status: 400 })
  }
}


