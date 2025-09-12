import { AdminLayout } from "@/components/admin/admin-layout"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserSearchFilter from "@/components/admin/user-search-filter"
import WishlistStats from "@/components/admin/wishlist-stats"
import WishlistCharts from "@/components/admin/wishlist-charts"

export const dynamic = 'force-dynamic'

async function getData(searchParams: URLSearchParams) {
  const q = searchParams.get('q') || undefined
  const userId = searchParams.get('userId') || undefined
  const orderBy = (searchParams.get('orderBy') as any) || 'addedAt'
  const order = ((searchParams.get('order') || 'desc') as 'asc' | 'desc')

  const where: any = {}
  if (userId) where.userId = userId

  const wishlists = await prisma.wishlist.findMany({
    where,
    include: { items: {
      where: q ? { OR: [ { siteName: { contains: q, mode: 'insensitive' } }, { siteUrl: { contains: q, mode: 'insensitive' } } ] } : undefined,
      orderBy: { [orderBy]: order }
    }, user: true },
    orderBy: { createdAt: 'desc' },
  })

  // Overall stats
  const overallItems = await prisma.wishlistItem.count()
  const overallWishlists = await prisma.wishlist.count()
  // 30-day series overall
  const labels: string[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return `${d.getMonth()+1}/${d.getDate()}`
  })
  const since = new Date(); since.setDate(since.getDate() - 29)
  const overallItemsSince = await prisma.wishlistItem.findMany({
    where: { addedAt: { gte: since } },
    select: { addedAt: true },
  })
  const formatKey = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const countByDay = (dates: Date[]) => {
    const map = new Map<string, number>()
    for (const dt of dates) {
      const k = formatKey(new Date(dt))
      map.set(k, (map.get(k) || 0) + 1)
    }
    return map
  }
  const byDayMap = countByDay(overallItemsSince.map(i => i.addedAt as any as Date))
  const overallSeries: number[] = labels.map(label => {
    const now = new Date()
    const [m, day] = label.split('/').map(Number)
    const y = now.getFullYear()
    const key = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return byDayMap.get(key) || 0
  })

  // Per user stats if filtered
  let perUser = null as null | { items: number; wishlists: number }
  let userSeries: number[] | undefined
  if (userId) {
    const items = await prisma.wishlistItem.count({ where: { wishlist: { userId } } })
    const lists = await prisma.wishlist.count({ where: { userId } })
    perUser = { items, wishlists: lists }
    const userItemsSince = await prisma.wishlistItem.findMany({
      where: { addedAt: { gte: since }, wishlist: { userId } },
      select: { addedAt: true },
    })
    const mapU = countByDay(userItemsSince.map(i => i.addedAt as any as Date))
    userSeries = labels.map(label => {
      const now = new Date()
      const [m, day] = label.split('/').map(Number)
      const y = now.getFullYear()
      const key = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      return mapU.get(key) || 0
    })
  }

  // top sites (JS aggregation to avoid SQL/groupBy compatibility issues)
  const allSites = await prisma.wishlistItem.findMany({ select: { siteName: true } })
  const countNames = (arr: Array<{ siteName: string }>) => {
    const m = new Map<string, number>()
    for (const a of arr) { const n = a.siteName || 'Unknown'; m.set(n, (m.get(n) || 0) + 1) }
    return Array.from(m.entries()).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count).slice(0,8)
  }
  const topSitesOverall = countNames(allSites)
  let topSitesUser: Array<{ name: string; count: number }> = []
  if (userId) {
    const userSites = await prisma.wishlistItem.findMany({ where: { wishlist: { userId } }, select: { siteName: true } })
    topSitesUser = countNames(userSites)
  }

  return { wishlists, stats: { overallItems, overallWishlists, perUser, labels, overallSeries, userSeries, topSitesOverall, topSitesUser } }
}

export default async function WishlistsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth()
  if (!(session as any)?.user) {
    return <div className="p-6">Unauthorized</div>
  }

  const spResolved = await searchParams
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(spResolved)) {
    if (typeof v === 'string') usp.set(k, v)
  }
  const { wishlists, stats } = await getData(usp)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input name="q" placeholder="Search site name/url" defaultValue={usp.get('q') || ''} className="h-8 text-xs w-64" />
          <UserSearchFilter />
          <Button type="submit" formAction="/admin/wishlists" variant="outline" className="h-8">Filter</Button>
        </div>

        {/* Stats */}
        <WishlistStats
          overall={[
            { label: 'Total Wishlists', value: stats.overallWishlists },
            { label: 'Total Items', value: stats.overallItems },
          ]}
          user={stats.perUser ? [
            { label: 'User Wishlists', value: stats.perUser.wishlists },
            { label: 'User Items', value: stats.perUser.items },
          ] : undefined}
        />

        <WishlistCharts
          labels={stats.labels}
          overallSeries={{ label: 'Overall', data: stats.overallSeries, color: '#7c3aed' }}
          userSeries={stats.userSeries ? { label: 'User', data: stats.userSeries, color: '#22c55e' } : undefined}
          topSitesOverall={stats.topSitesOverall}
          topSitesUser={stats.topSitesUser}
        />

        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Wishlist</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wishlists.map(w => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{w.user?.name || w.userId}</div>
                    <div className="text-xs text-gray-500">{w.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-gray-500">{new Date(w.createdAt as any).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {w.items.map(it => (
                        <div key={it.id} className="text-sm truncate">
                          <a href={it.siteUrl || '#'} target="_blank" className="text-violet-600 hover:underline" rel="noreferrer">{it.siteName}</a>
                          <span className="ml-2 text-xs text-gray-500">{it.priceCents ? `$${(it.priceCents/100).toFixed(2)}` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}



