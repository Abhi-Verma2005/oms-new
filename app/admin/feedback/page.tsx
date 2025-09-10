"use client"

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader as UITableHeader, TableRow } from '@/components/ui/table'
import BarChart01 from '@/components/charts/bar-chart-01'

type FeedbackItem = {
  id: string
  userId: string
  rating: number
  category?: string
  comment?: string
  createdAt: string
  user?: { id: string; email: string; name?: string }
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [summary, setSummary] = useState<{ total: number; byRating: Record<number, number>; recent: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [listRes, sumRes] = await Promise.all([
        fetch('/api/admin/feedback', { cache: 'no-store' }),
        fetch('/api/admin/feedback/summary', { cache: 'no-store' }),
      ])
      if (!listRes.ok || !sumRes.ok) throw new Error('Failed to fetch data')
      const itemsData = await listRes.json()
      const summaryData = await sumRes.json()
      console.log('Feedback items:', itemsData)
      console.log('Feedback summary:', summaryData)
      setItems(itemsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error loading feedback data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const ratingLabels = ['1','2','3','4','5']
  const ratingCounts = ratingLabels.map((l) => summary?.byRating?.[Number(l)] || 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white">
              <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Total Feedback</UICardTitle></UICardHeader>
              <CardContent className="pt-0"><div className="text-2xl font-semibold">—</div></CardContent>
            </Card>
            <Card className="bg-white md:col-span-2">
              <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Rating Distribution</UICardTitle></UICardHeader>
              <CardContent className="pt-0">
                <div className="h-[240px] flex items-center justify-center">Loading chart...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Total Feedback</UICardTitle></UICardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{summary?.total ?? '—'}</div></CardContent>
        </Card>
        <Card className="bg-white md:col-span-2">
          <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Rating Distribution</UICardTitle></UICardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px]">
              {summary && summary.byRating ? (
                <BarChart01
                  data={{
                    labels: ratingLabels,
                    datasets: [{ 
                      label: 'Count', 
                      data: ratingCounts, 
                      backgroundColor: '#7C3AED', 
                      hoverBackgroundColor: '#6D28D9', 
                      borderRadius: 6 
                    }]
                  }}
                  width={600}
                  height={220}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <UICardHeader className="pb-2"><UICardTitle className="text-base">All Feedback</UICardTitle></UICardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <Table>
              <UITableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </UITableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.user?.name || it.user?.email || it.userId}</TableCell>
                    <TableCell>{it.rating}</TableCell>
                    <TableCell>{it.category || '-'}</TableCell>
                    <TableCell className="max-w-[520px]"><div className="truncate" title={it.comment}>{it.comment || '-'}</div></TableCell>
                    <TableCell>{new Date(it.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  )
}


