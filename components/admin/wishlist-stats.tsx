"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Stat = { label: string; value: number }

export default function WishlistStats({ overall, user }: { overall: Stat[]; user?: Stat[] }) {
  const StatCard = ({ title, stats }: { title: string; stats: Stat[] }) => (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-lg font-semibold tabular-nums">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <StatCard title="Overall" stats={overall} />
      {user && <StatCard title="Selected User" stats={user} />}
    </div>
  )
}


