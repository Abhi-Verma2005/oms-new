"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import LineChart01 from '@/components/charts/line-chart-01'

export type Series = { label: string; data: number[]; color?: string }

export default function WishlistCharts({
  labels,
  overallSeries,
  userSeries,
  topSitesOverall,
  topSitesUser,
}: {
  labels: string[]
  overallSeries: Series
  userSeries?: Series
  topSitesOverall: Array<{ name: string; count: number }>
  topSitesUser?: Array<{ name: string; count: number }>
}) {
  const renderBarList = (items: Array<{ name: string; count: number }>) => {
    const max = Math.max(1, ...items.map(i => i.count))
    return (
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center gap-2">
            <div className="text-xs w-40 truncate" title={it.name}>{it.name}</div>
            <div className="flex-1 h-2 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: `${(it.count / max) * 100}%` }} />
            </div>
            <div className="text-xs tabular-nums w-8 text-right">{it.count}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Items Added (30 days) - Overall</CardTitle></CardHeader>
        <CardContent>
          <LineChart01
            width={520}
            height={180}
            data={{
              labels,
              datasets: [{ data: overallSeries.data, borderColor: overallSeries.color || '#7c3aed', fill: true }],
            }}
          />
        </CardContent>
      </Card>

      {userSeries && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Items Added (30 days) - Selected User</CardTitle></CardHeader>
          <CardContent>
            <LineChart01
              width={520}
              height={180}
              data={{
                labels,
                datasets: [{ data: userSeries.data, borderColor: userSeries.color || '#22c55e', fill: true }],
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Top Sites - Overall</CardTitle></CardHeader>
        <CardContent>
          {renderBarList(topSitesOverall)}
        </CardContent>
      </Card>

      {topSitesUser && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top Sites - Selected User</CardTitle></CardHeader>
          <CardContent>
            {renderBarList(topSitesUser)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}


