"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader as UITableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import BarChart01 from '@/components/charts/bar-chart-01'

type InterestItem = {
  id: string
  userId: string
  userEmail?: string
  userName?: string
  query: string
  filters: any
  notified: boolean
  createdAt: string
}

type Summary = {
  totals: { total: number; pending: number; notified: number }
  topQueries: Array<{ query: string; count: number }>
  recent: Array<{ id: string; query: string; userEmail?: string; createdAt: string; notified: boolean }>
}

export function SearchInterestsAdmin({ userId }: { userId?: string }) {
  const [items, setItems] = useState<InterestItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState("")
  const [notified, setNotified] = useState<'all'|'true'|'false'>('all')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  async function load() {
    setLoading(true)
    try {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (q.trim()) sp.set('q', q.trim())
      if (notified !== 'all') sp.set('notified', notified)
      if (userId) sp.set('userId', userId)
      const [listRes, sumRes] = await Promise.all([
        fetch(`/api/admin/search-interests?${sp.toString()}`, { cache: 'no-store' }),
        fetch(`/api/admin/search-interests/summary${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`, { cache: 'no-store' }),
      ])
      const listData = await listRes.json()
      const sumData = await sumRes.json()
      setItems(listData.items || [])
      setTotal(listData.total || 0)
      setSummary(sumData || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, pageSize])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected])
  const allSelectedOnPage = useMemo(() => items.length > 0 && items.every(it => selected[it.id]), [items, selected])

  const exportCsv = () => {
    const headers = ['id','userId','userEmail','query','notified','createdAt']
    const rows = items.map(it => [it.id, it.userId, it.userEmail || '', JSON.stringify(it.query), String(it.notified), it.createdAt])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => String(v).replaceAll('"', '""')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `search-interests-page${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const bulkMark = async (flag: boolean) => {
    if (selectedIds.length === 0) return
    await fetch('/api/admin/search-interests/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, notified: flag })
    })
    setSelected({})
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Total Interests</UICardTitle></UICardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{summary?.totals.total ?? '—'}</div></CardContent>
        </Card>
        <Card className="bg-white">
          <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Pending (Notified=false)</UICardTitle></UICardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{summary?.totals.pending ?? '—'}</div></CardContent>
        </Card>
        <Card className="bg-white">
          <UICardHeader className="pb-2"><UICardTitle className="text-sm font-medium">Notified</UICardTitle></UICardHeader>
          <CardContent className="pt-0"><div className="text-2xl font-semibold">{summary?.totals.notified ?? '—'}</div></CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <UICardHeader className="pb-2"><UICardTitle className="text-base">Top Queries</UICardTitle></UICardHeader>
        <CardContent className="pt-0">
          {summary?.topQueries && summary.topQueries.length > 0 ? (
            <div className="h-[300px]">
              <BarChart01
                data={{
                  labels: summary.topQueries.map(t => t.query.length > 24 ? t.query.slice(0, 22) + '…' : t.query),
                  datasets: [{
                    label: 'Search Count',
                    data: summary.topQueries.map(t => t.count),
                    backgroundColor: '#7C3AED',
                    hoverBackgroundColor: '#6D28D9',
                    borderRadius: 6,
                  }]
                }}
                width={600}
                height={280}
              />
            </div>
          ) : (
            <div className="text-sm text-gray-500">No data</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <UICardHeader className="pb-2"><UICardTitle className="text-base">Search Interests</UICardTitle></UICardHeader>
        <CardContent className="pt-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input className="w-64" placeholder="Filter query..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={notified} onValueChange={(v: 'all'|'true'|'false') => setNotified(v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
                <SelectItem value="true">Notified</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setPage(1); load() }} disabled={loading}>Apply</Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
              <Button variant="outline" disabled={selectedIds.length===0} onClick={() => bulkMark(true)}>Mark Notified</Button>
              <Button variant="outline" disabled={selectedIds.length===0} onClick={() => bulkMark(false)}>Mark Pending</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <UITableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const next = { ...selected }
                        for (const it of items) next[it.id] = checked
                        setSelected(next)
                      }}
                    />
                  </TableHead>
                  {!userId && <TableHead>User</TableHead>}
                  <TableHead>Query</TableHead>
                  <TableHead>Notified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </UITableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-gray-500">No interests found</TableCell></TableRow>
                ) : items.map(it => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={!!selected[it.id]}
                        onChange={(e) => setSelected(prev => ({ ...prev, [it.id]: e.target.checked }))}
                      />
                    </TableCell>
                    {!userId && <TableCell>{it.userName || it.userEmail || it.userId}</TableCell>}
                    <TableCell className="max-w-[420px]">
                      <div className="truncate" title={it.query}>{it.query}</div>
                    </TableCell>
                    <TableCell>{it.notified ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(it.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={async () => {
                          const ok = window.confirm('Delete this search interest?')
                          if (!ok) return
                          try {
                            await fetch(`/api/admin/search-interests/${it.id}`, { method: 'DELETE' })
                            await load()
                          } catch {}
                        }}
                      >Delete</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-500">Page {page} of {totalPages} • {total} total • {selectedIds.length} selected</div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10,20,50,100].map(n => <SelectItem key={n} value={String(n)}>{n}/page</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
