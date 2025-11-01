import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addSecurityHeaders } from '@/lib/security'

// Helper function to get or create default view for a project
async function getOrCreateDefaultView(userId: string, projectId: string | null, page: string = 'publishers') {
  // For projects, use "Default" as the name; for individual, use the old naming
  const defaultViewName = projectId && projectId !== 'individual' ? 'Default' : `default_filters_${page}`
  
  // For projects, find by userId, name='Default', and projectId
  // For individual, use the unique constraint userId + name
  let defaultView
  if (projectId && projectId !== 'individual') {
    defaultView = await prisma.savedView.findFirst({
      where: {
        userId,
        name: 'Default',
        projectId: projectId
      }
    })
  } else {
    defaultView = await prisma.savedView.findUnique({
      where: { userId_name: { userId, name: defaultViewName } }
    })
  }

  // If not found, create it (and optionally migrate from ProjectFilterPreference if it exists)
  if (!defaultView) {
    let initialFilters: any = {}
    
    // For projects, try to migrate from ProjectFilterPreference
    if (projectId && projectId !== 'individual') {
      const pref = await prisma.projectFilterPreference.findUnique({
        where: { userId_projectId_page: { userId, projectId, page } },
      })
      if (pref && pref.data) {
        initialFilters = pref.data as any
      }
    }
    
    defaultView = await prisma.savedView.create({
      data: {
        userId,
        name: projectId && projectId !== 'individual' ? 'Default' : defaultViewName,
        filters: initialFilters,
        projectId: projectId === 'individual' ? null : projectId
      }
    })
  }

  return defaultView
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const page = req.nextUrl.searchParams.get('page') || 'publishers'
  const { id: projectId } = await ctx.params

  // Special handling for "individual" (no project)
  if (projectId === 'individual') {
    const name = `default_filters_${page}`
    const view = await prisma.savedView.findUnique({
      where: { userId_name: { userId, name } }
    })
    const res = NextResponse.json({ preference: view?.filters ?? null })
    addSecurityHeaders(res)
    return res
  }

  // For projects, use default view instead of ProjectFilterPreference
  const defaultView = await getOrCreateDefaultView(userId, projectId, page)
  const res = NextResponse.json({ 
    preference: defaultView?.filters ?? null,
    defaultViewId: defaultView.id 
  })
  addSecurityHeaders(res)
  return res
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const page: string = (req.nextUrl.searchParams.get('page') as string) || body.page || 'publishers'
  const data = body?.data ?? body?.filters ?? {}
  const { id: projectId } = await ctx.params

  // Special handling for "individual" (no project) using SavedView as storage
  if (projectId === 'individual') {
    const name = `default_filters_${page}`
    const existing = await prisma.savedView.findUnique({
      where: { userId_name: { userId, name } }
    })
    const saved = existing
      ? await prisma.savedView.update({
          where: { userId_name: { userId, name } },
          data: { filters: data }
        })
      : await prisma.savedView.create({
          data: { userId, name, filters: data, projectId: null }
        })
    const res = NextResponse.json({ preference: saved.filters })
    addSecurityHeaders(res)
    return res
  }

  // For projects, save to default view instead of ProjectFilterPreference
  const defaultView = await getOrCreateDefaultView(userId, projectId, page)
  const updated = await prisma.savedView.update({
    where: { id: defaultView.id },
    data: { filters: data }
  })

  const res = NextResponse.json({ preference: updated.filters })
  addSecurityHeaders(res)
  return res
}



