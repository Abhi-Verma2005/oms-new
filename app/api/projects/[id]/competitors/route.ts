import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const competitors = await prisma.projectCompetitor.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: competitors })
  } catch (e) {
    console.error('GET /api/projects/[id]/competitors error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { domain, name, traffic, domainRating } = body || {}
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

    const comp = await prisma.projectCompetitor.create({
      data: {
        projectId: project.id,
        domain,
        name: name || domain,
        traffic: typeof traffic === 'number' ? traffic : null,
        domainRating: typeof domainRating === 'number' ? domainRating : null,
      }
    })
    return NextResponse.json({ data: comp }, { status: 201 })
  } catch (e) {
    console.error('POST /api/projects/[id]/competitors error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


