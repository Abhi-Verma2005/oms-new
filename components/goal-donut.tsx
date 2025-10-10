"use client"

import React, { useEffect, useMemo, useState } from 'react'

type AnalyticsResponse = {
  industryStats: Record<string, { count: number; totalGrowth: number; totalKeywords: number }>
}

export default function GoalDonut() {
  const [stats, setStats] = useState<AnalyticsResponse['industryStats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/case-studies/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load analytics')
        const json: AnalyticsResponse = await res.json()
        if (cancelled) return
        setStats(json.industryStats || {})
      } catch {
        setStats({})
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Track theme to choose palette matching site theme
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setIsDark(document.documentElement.classList.contains('dark') || (prefers?.matches ?? false))
    update()
    prefers?.addEventListener?.('change', update as any)
    const obs = new MutationObserver(update)
    try { obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }) } catch {}
    return () => { try { prefers?.removeEventListener?.('change', update as any) } catch {}; try { obs.disconnect() } catch {} }
  }, [])

  const series = useMemo(() => {
    if (!stats) return [] as Array<{ label: string; value: number; color: string }>
    const paletteLight = ['#7c3aed', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444']
    const paletteDark = ['#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f87171']
    const palette = isDark ? paletteDark : paletteLight
    const entries = Object.entries(stats)
    const total = entries.reduce((s, [, v]) => s + (v.count || 0), 0)
    return entries.slice(0, 5).map(([label, v], i) => ({ label, value: v.count || 0, color: palette[i % palette.length], total }))
  }, [stats, isDark])

  if (loading) {
    return <div className="h-24 flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" /></div>
  }
  if (!series.length) return <div className="text-sm text-gray-500 dark:text-gray-400">No data available</div>

  const total = series.reduce((s, v) => s + v.value, 0)

  return (
    <div className="relative w-24 h-24 sm:w-20 sm:h-20">
      {/* Background ring */}
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="4" className="stroke-gray-200 dark:stroke-gray-700" />
        {(() => {
          let acc = 0
          return series.map((s, idx) => {
            const frac = total > 0 ? s.value / total : 0
            const dash = Math.max(0, frac * 100)
            const gap = Math.max(0, 100 - dash)
            const rot = acc * 3.6
            acc += dash
            return (
              <circle
                key={idx}
                cx="18" cy="18" r="16" fill="none" strokeWidth="4"
                stroke={s.color}
                strokeDasharray={`${dash} ${gap}`}
                transform={`rotate(-90 18 18) rotate(${rot} 18 18)`}
              />
            )
          })
        })()}
      </svg>
      {/* Legend summary */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 dark:text-gray-400">Industries</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{total}</div>
        </div>
      </div>
    </div>
  )
}


