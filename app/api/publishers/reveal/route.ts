import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

function shouldReset(lastReset?: Date | null): boolean {
  if (!lastReset) return true
  const now = new Date()
  return now.toDateString() !== new Date(lastReset).toDateString()
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id = String(payload?.id || '').trim()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Credit handling: reset if day changed, then spend 1 credit
  let user
  try {
    user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, dailyCredits: true, lastCreditReset: true } })
  } catch (dbError) {
    console.error('Database error during user lookup:', dbError)
    return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const needsReset = shouldReset(user.lastCreditReset)
  const currentCredits = needsReset ? 50 : user.dailyCredits
  if (currentCredits <= 0) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

  // Fetch website name from external API
  // Example endpoint documented: https://agents.outreachdeal.com/webhook/get-website?id=2
  const url = `https://agents.outreachdeal.com/webhook/get-website?id=${encodeURIComponent(id)}`
  console.log(`[REVEAL] Fetching website for ID: ${id}, URL: ${url}`)
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const res = await fetch(url, { 
      method: 'GET', 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log(`[REVEAL] External API response status: ${res.status} ${res.statusText}`)
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response')
      console.error(`[REVEAL] External API error: ${res.status} ${res.statusText} - ${errorText}`)
      return NextResponse.json({ 
        error: `External API error: ${res.status} ${res.statusText}`, 
        details: errorText 
      }, { status: 502 })
    }
    
    const text = await res.text()
    console.log(`[REVEAL] External API response text: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`)
    
    if (!text) {
      console.error('[REVEAL] External API returned empty response')
      return NextResponse.json({ error: 'Empty response from external API' }, { status: 502 })
    }
    
    let data: any
    try { 
      data = JSON.parse(text) 
      console.log(`[REVEAL] Parsed JSON data:`, data)
    } catch (parseError) { 
      console.log(`[REVEAL] Response is not JSON, treating as string: ${text}`)
      data = text 
    }
    
    // Normalize: expect { website: 'www.example.com' } or string
    const website = typeof data === 'string' ? data : (data.website || data.name || data.url || '')
    console.log(`[REVEAL] Extracted website: ${website}`)
    
    if (!website) {
      console.error(`[REVEAL] No website found in response. Data:`, data)
      return NextResponse.json({ 
        error: 'No website found in external API response', 
        details: data 
      }, { status: 502 })
    }
    
    // Only deduct credits after successful reveal
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          dailyCredits: currentCredits - 1,
          lastCreditReset: needsReset ? new Date() : user.lastCreditReset,
        },
      })
      console.log(`[REVEAL] Successfully revealed website: ${website}, deducted 1 credit`)
    } catch (dbError) {
      console.error('Database error during credit update after successful reveal:', dbError)
      // Still return the website even if we can't update credits
      return NextResponse.json({ website, credits: currentCredits - 1 })
    }
    
    // Get updated credits for response
    let refreshed
    try {
      refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: { dailyCredits: true } })
    } catch (dbError) {
      console.error('Database error during credit refresh:', dbError)
      return NextResponse.json({ website, credits: currentCredits - 1 })
    }
    
    console.log(`[REVEAL] Successfully revealed website: ${website}, remaining credits: ${refreshed?.dailyCredits ?? 0}`)
    return NextResponse.json({ website, credits: refreshed?.dailyCredits ?? 0 })
  } catch (error: any) {
    console.error(`[REVEAL] Network or timeout error:`, error.message)
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout - external API took too long to respond' }, { status: 502 })
    }
    return NextResponse.json({ error: `Network error: ${error.message}` }, { status: 502 })
  }
}


