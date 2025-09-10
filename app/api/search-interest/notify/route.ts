import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { fetchSitesWithFilters } from '@/lib/sample-sites'

// POST to trigger scan and send emails for interests that now have matches
export async function POST(_req: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const interests = await prisma.searchInterest.findMany({
      where: { notified: false },
      take: 100,
      orderBy: { createdAt: 'asc' },
    })

    const results: Array<{ id: string; matched: boolean }> = []

    for (const interest of interests) {
      const filters: any = { limit: 1 }
      if (interest.query) {
        filters.website = interest.query
        filters.niche = interest.query
      }
      if (interest.filters) Object.assign(filters, interest.filters as any)

      const sites = await fetchSitesWithFilters(filters)
      const matched = Array.isArray(sites) && sites.length > 0
      results.push({ id: interest.id, matched })

      if (matched) {
        try {
          await sendEmail({
            to: interest.email,
            subject: `Good news: results for "${interest.query}" are now available`,
            text: `We found new publisher matches for your search: ${interest.query}. Visit the publishers page to view them.`,
          })
        } catch (e) {
          // Continue; do not mark notified if email failed
          continue
        }

        await prisma.searchInterest.update({ where: { id: interest.id }, data: { notified: true } })
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process interests' }, { status: 500 })
  }
}


