import 'dotenv/config'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import fs from 'fs'
import path from 'path'

function loadAllowedNiches(): string[] {
  // 1) Prefer JSON array from env (NICHES_JSON)
  const nichesJson = process.env.NICHES_JSON
  if (nichesJson) {
    try {
      const arr = JSON.parse(nichesJson)
      if (Array.isArray(arr)) {
        return normalizeLines(arr.map(String))
      }
      console.warn('NICHES_JSON is not a JSON array; falling back...')
    } catch (e) {
      console.warn('Failed to parse NICHES_JSON; falling back...')
    }
  }

  // 2) Or newline/comma separated env (NICHES_LIST)
  const nichesList = process.env.NICHES_LIST
  if (nichesList) {
    const pieces = nichesList.includes('\n') ? nichesList.split('\n') : nichesList.split(',')
    return normalizeLines(pieces)
  }

  // 3) Fallback to niches.txt file
  const filePath = path.join(__dirname, 'niches.txt')
  if (!fs.existsSync(filePath)) {
    console.warn(`niches.txt not found at ${filePath}. Provide NICHES_JSON or NICHES_LIST in env, or create the file.`)
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split('\n')
  return normalizeLines(lines)
}

function normalizeLines(lines: string[]): string[] {
  const cleaned = lines
    .map(l => l.trim())
    .filter(l => l.length > 0)
    // strip leading bullets/dashes if present
    .map(l => l.replace(/^[-•\u2022]\s*/, ''))
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of cleaned) {
    if (!seen.has(line)) {
      seen.add(line)
      result.push(line)
    }
  }
  return result
}

async function main() {
  const ALLOWED_NICHES = loadAllowedNiches()
  if (ALLOWED_NICHES.length === 0) {
    console.warn('ALLOWED_NICHES is empty. Populate niches.txt before running.')
  }

  const openai = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY) as string })
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string })
  const indexName = process.env.PINECONE_NICHES_INDEX || 'oms-niches'
  // Ensure index exists (Pinecone v2 serverless)
  const cloud = process.env.PINECONE_CLOUD || 'aws'
  const region = process.env.PINECONE_REGION || process.env.PINECONE_ENVIRONMENT || 'us-east-1'
  // We'll assume embedding dims for text-embedding-3-small = 1536
  const dimension = 1536
  try {
    await pinecone.describeIndex(indexName)
  } catch (e) {
    console.log(`Index '${indexName}' not found. Creating...`)
    await pinecone.createIndex({
      name: indexName,
      dimension,
      metric: 'cosine',
      spec: {
        serverless: { cloud: cloud as any, region },
      },
    })
    // Wait for it to be ready (basic retry)
    let ready = false
    for (let i = 0; i < 20; i++) {
      try {
        await pinecone.describeIndex(indexName)
        ready = true
        break
      } catch {
        await new Promise(r => setTimeout(r, 3000))
      }
    }
    if (!ready) throw new Error('Pinecone index creation pending; try again shortly')
  }
  const index = pinecone.index(indexName)

  // Batch embed + batch upsert to speed up massively
  const BATCH_SIZE = parseInt(process.env.NICHES_BATCH_SIZE || '100', 10)
  const total = ALLOWED_NICHES.length
  let upserted = 0

  for (let start = 0; start < total; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, total)
    const batch = ALLOWED_NICHES.slice(start, end)

    // 1 embedding API call for the whole batch
    const embedRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: batch })
    const vectors = embedRes.data
      .map((d, idx) => ({
        id: `niche-${start + idx}`,
        values: d.embedding as number[],
        metadata: { name: batch[idx] },
      }))
      .filter(v => Array.isArray(v.values) && v.values.length === 1536)

    if (vectors.length > 0) {
      await index.upsert(vectors)
      upserted += vectors.length
      console.log(`Upserted batch ${Math.floor(start / BATCH_SIZE) + 1} (${vectors.length} items). Total: ${upserted}/${total}`)
    }
  }
  console.log(`Done. Upserted ${upserted} vectors.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


