"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader as UITableHeader, TableRow } from '@/components/ui/table'
import BarChart01 from '@/components/charts/bar-chart-01'

export default function UserFeedbackClient({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)

  async function load() {
    const [listRes, sumRes] = await Promise.all([
      fetch(`/api/admin/feedback?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' }),
      fetch(`/api/admin/feedback/summary?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' }),
    ])
    setItems(await listRes.json())
    setSummary(await sumRes.json())
  }

  useEffect(() => { load() }, [userId])

  const labels = ['1','2','3','4','5']
  const counts = labels.map(l => summary?.byRating?.[Number(l)] || 0)

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-white">
        <UICardHeader className="pb-2"><UICardTitle className="text-base">Rating Distribution</UICardTitle></UICardHeader>
        <CardContent className="pt-0">
          <div className="h-[220px]">
            <BarChart01 data={{ labels, datasets: [{ label: 'Count', data: counts, backgroundColor: '#7C3AED', borderRadius: 6 }] }} width={600} height={200} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <UICardHeader className="pb-2"><UICardTitle className="text-base">Feedback</UICardTitle></UICardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <Table>
              <UITableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </UITableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
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
  )
}


