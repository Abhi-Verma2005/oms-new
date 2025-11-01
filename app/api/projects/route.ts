import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: projects })
  } catch (e) {
    console.error('GET /api/projects error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { domain, name, description, defaultUrl, defaultAnchor } = body || {}
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        domain,
        name: name || domain,
        description: description || null,
        defaultUrl: defaultUrl || null,
        defaultAnchor: defaultAnchor || null,
      }
    })

    // Create default view for this project immediately
    try {
      await prisma.savedView.create({
        data: {
          userId: session.user.id,
          name: 'Default',
          filters: {},
          projectId: project.id
        }
      })
    } catch (error: any) {
      // If view already exists (shouldn't happen), log but don't fail project creation
      console.log('Note: Default view may already exist for project:', project.id, error.message)
    }

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/projects error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


