'use client'

import { useState, useEffect } from 'react'
import BarChart03 from '@/components/charts/bar-chart-03'
import { chartColors } from './chart-colors'

interface IndustryStats {
  [key: string]: {
    count: number
    totalGrowth: number
    totalKeywords: number
  }
}

export default function IndustryComparisonChart() {
  const [industryStats, setIndustryStats] = useState<IndustryStats>({})
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchIndustryStats()
    }
  }, [mounted])

  const fetchIndustryStats = async () => {
    try {
      const response = await fetch('/api/case-studies/analytics')
      const data = await response.json()
      setIndustryStats(data.industryStats || {})
    } catch (error) {
      console.error('Error fetching industry stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Industry Performance</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading industry data...'}</div>
        </div>
      </div>
    )
  }

  const industries = Object.keys(industryStats)
  const avgGrowth = industries.map(industry => industryStats[industry].totalGrowth / industryStats[industry].count)
  const totalKeywords = industries.map(industry => industryStats[industry].totalKeywords)

  const chartData = {
    labels: industries,
    datasets: [
      {
        label: 'Average Growth %',
        data: avgGrowth,
        backgroundColor: chartColors.violet[700],
        hoverBackgroundColor: chartColors.violet[800],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Keywords (100s)',
        data: totalKeywords.map(count => count / 100),
        backgroundColor: chartColors.violet[500],
        hoverBackgroundColor: chartColors.violet[600],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Case Studies',
        data: industries.map(industry => industryStats[industry].count),
        backgroundColor: chartColors.violet[300],
        hoverBackgroundColor: chartColors.violet[400],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Industry Performance</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      <BarChart03 data={chartData} width={595} height={248} />
    </div>
  )
}
