import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type View = { id: string; name: string; filters: any }

const dataDir = path.join(process.cwd(), 'data')
const dataFile = path.join(dataDir, 'views.json')

async function readViews(): Promise<View[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf8')
    const json = JSON.parse(raw)
    return Array.isArray(json) ? json : []
  } catch {
    return []
  }
}

async function writeViews(views: View[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(dataFile, JSON.stringify(views, null, 2), 'utf8')
}

export async function GET() {
  const views = await readViews()
  return Response.json({ views })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name || '').trim()
    const filters = body?.filters ?? {}
    if (!name) return new Response('Name required', { status: 400 })
    const views = await readViews()
    const id = `${name}-${Date.now()}`
    const next: View[] = [{ id, name, filters }, ...views.filter(v => v.name !== name)]
    await writeViews(next)
    return Response.json({ ok: true, id })
  } catch {
    return new Response('Bad Request', { status: 400 })
  }
}


