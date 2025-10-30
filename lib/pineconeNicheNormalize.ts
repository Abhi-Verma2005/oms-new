import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

export type NormalizedNiche = {
  name: string
  score: number
}

export async function normalizeNiche(userInput: string): Promise<NormalizedNiche | null> {
  if (!userInput || typeof userInput !== 'string') return null

  const openai = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY) as string })
  const embedRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: userInput })
  const embedding = embedRes.data[0]?.embedding as number[] | undefined
  if (!embedding) return null

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string })
  const indexName = process.env.PINECONE_NICHES_INDEX || 'oms-niches'
  const index = pinecone.index(indexName)

  const query = await index.query({ vector: embedding, topK: 1, includeMetadata: true })
  const match = query.matches?.[0]
  const name = match?.metadata?.name as string | undefined
  const score = typeof match?.score === 'number' ? match.score : 0

  if (name && score >= 0.75) {
    return { name, score }
  }
  return null
}


