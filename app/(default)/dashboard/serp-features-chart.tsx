'use client'

import { useState, useEffect } from 'react'
import DoughnutChart from '@/components/charts/doughnut-chart'
import { chartColors } from './chart-colors'

interface SerpFeaturesStats {
  featuredSnippets?: number
  aiOverview?: number
  regularRankings?: number
}

export default function SerpFeaturesChart() {
  const [serpStats, setSerpStats] = useState<SerpFeaturesStats>({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchSerpStats()
    }
  }, [mounted])

  const fetchSerpStats = async () => {
    try {
      const response = await fetch('/api/case-studies/analytics')
      const data = await response.json()
      setSerpStats(data.serpFeaturesStats || {})
    } catch (error) {
      console.error('Error fetching SERP stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">SERP Features Distribution</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading SERP data...'}</div>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: ['AI Overview', 'Featured Snippets', 'Regular Rankings'],
    datasets: [
      {
        label: 'SERP Features',
        data: [
          serpStats.aiOverview || 0,
          serpStats.featuredSnippets || 0,
          serpStats.regularRankings || 0,
        ],
        backgroundColor: [
          chartColors.violet[500],
          chartColors.sky[500],
          chartColors.emerald[500],
        ],
        hoverBackgroundColor: [
          chartColors.violet[600],
          chartColors.sky[600],
          chartColors.emerald[600],
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">SERP Features Distribution</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      <DoughnutChart data={chartData} width={595} height={248} />
    </div>
  )
}
