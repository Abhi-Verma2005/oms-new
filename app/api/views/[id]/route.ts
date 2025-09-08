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

export async function DELETE(_req: NextRequest, { params }: any) {
  const id = params?.id
  const views = await readViews()
  const next = views.filter(v => v.id !== id)
  await writeViews(next)
  return Response.json({ ok: true })
}


