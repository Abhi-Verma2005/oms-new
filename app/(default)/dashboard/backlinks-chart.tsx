'use client'

import { useState, useEffect } from 'react'
import BarChart01 from '@/components/charts/bar-chart-01'
import { chartColors } from './chart-colors'

interface CaseStudy {
  id: string
  clientName: string
  industry: string
  trafficGrowth: number
  keywordsRanked: number
  backlinksPerMonth: number
  isActive: boolean
}

export default function BacklinksChart() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchCaseStudies()
    }
  }, [mounted])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/case-studies/analytics')
      const data = await response.json()
      setCaseStudies(data.caseStudies || [])
    } catch (error) {
      console.error('Error fetching case studies:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Backlinks per Month</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading backlinks data...'}</div>
        </div>
      </div>
    )
  }

  const chartData = {
    labels: caseStudies.map(study => study.clientName),
    datasets: [
      {
        label: 'Backlinks per Month',
        data: caseStudies.map(study => study.backlinksPerMonth),
        backgroundColor: chartColors.sky[500],
        hoverBackgroundColor: chartColors.sky[600],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Keywords Ranked (100s)',
        data: caseStudies.map(study => study.keywordsRanked / 100),
        backgroundColor: chartColors.violet[500],
        hoverBackgroundColor: chartColors.violet[600],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Backlinks per Month</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      <BarChart01 data={chartData} width={595} height={248} />
    </div>
  )
}
