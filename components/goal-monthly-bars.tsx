"use client"

import React, { useEffect, useMemo, useState } from 'react'

type MonthlyDatum = { month: string; traffic: number }
type AnalyticsResponse = {
  monthlyTrafficData: Array<{ client: string; data: MonthlyDatum[] }>
}

export default function GoalMonthlyBars() {
  const [data, setData] = useState<MonthlyDatum[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/case-studies/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load analytics')
        const json: AnalyticsResponse = await res.json()
        if (cancelled) return
        // Aggregate traffic per month across all clients
        const map = new Map<string, number>()
        for (const s of json.monthlyTrafficData || []) {
          for (const m of s.data || []) {
            map.set(m.month, (map.get(m.month) || 0) + (m.traffic || 0))
          }
        }
        // Sort by month order as appeared in first client if possible, else by key
        const order = (json.monthlyTrafficData?.[0]?.data || []).map(d => d.month)
        const entries = Array.from(map.entries())
        entries.sort((a, b) => {
          const ia = order.indexOf(a[0])
          const ib = order.indexOf(b[0])
          if (ia !== -1 && ib !== -1) return ia - ib
          return a[0].localeCompare(b[0])
        })
        const aggregated = entries.map(([month, traffic]) => ({ month, traffic }))
        setData(aggregated)
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const max = useMemo(() => (data && data.length ? Math.max(...data.map(d => d.traffic)) : 0), [data])

  if (loading) {
    return (
      <div className="h-24 flex items-end justify-between gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="w-full bg-purple-300/60 dark:bg-purple-500/40 rounded-t-sm animate-pulse" style={{ height: `${20 + (i % 4) * 10}%` }} />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">&nbsp;</div>
          </div>
        ))}
      </div>
    )
  }

  if (!data || !data.length || max <= 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">No data available</div>
  }

  const monthLabels = (m: string) => {
    // Expect formats like Jan, Feb or 2025-01, fallback to first letter
    const short = m.slice(0, 1)
    const map: Record<string, string> = { Jan: 'J', Feb: 'F', Mar: 'M', Apr: 'A', May: 'M', Jun: 'J', Jul: 'J', Aug: 'A', Sep: 'S', Oct: 'O', Nov: 'N', Dec: 'D' }
    return map[m]?.toUpperCase?.() || short.toUpperCase()
  }

  return (
    <div className="h-24 flex items-end justify-between gap-2">
      {data.map((d, index) => {
        const heightPct = Math.max(4, Math.round((d.traffic / max) * 100))
        return (
          <div key={`${d.month}-${index}`} className="flex flex-col items-center flex-1 h-full">
            <div
              className="w-full rounded-t-sm transition-all duration-300 bg-purple-500 hover:bg-purple-600 dark:bg-purple-500/90 dark:hover:bg-purple-400 min-h-[6px]"
              style={{ height: `${heightPct}%` }}
              title={`${d.month}: ${d.traffic.toLocaleString()}`}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {monthLabels(d.month)}
            </div>
          </div>
        )
      })}
    </div>
  )
}


