'use client'

import { useState, useEffect } from 'react'
import LineChart01 from '@/components/charts/line-chart-01'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { chartColors, getRgbaColor } from './chart-colors'

interface CaseStudy {
  id: string
  clientName: string
  industry: string
  trafficGrowth: number
  keywordsRanked: number
  backlinksPerMonth: number
  isActive: boolean
}

export default function DomainRatingChart() {
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
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Domain Rating Growth</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading domain data...'}</div>
        </div>
      </div>
    )
  }

  // Simulate domain rating growth over time for each case study
  const months = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025']
  
  const chartData = {
    labels: months,
    datasets: caseStudies.map((study, index) => {
      const colors = [
        chartColors.violet[500],
        chartColors.sky[500],
        chartColors.emerald[500]
      ]
      
      // Simulate domain rating growth based on traffic growth
      const startRating = 40 + (index * 5) // Different starting points
      const endRating = startRating + (study.trafficGrowth / 20) // Growth based on traffic
      
      const data = months.map((_, monthIndex) => {
        const progress = monthIndex / (months.length - 1)
        return Math.round(startRating + (endRating - startRating) * progress)
      })

      return {
        label: study.clientName,
        data,
        fill: index === 0,
        backgroundColor: index === 0 ? function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          const gradientOrColor = chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: getRgbaColor(`${index === 0 ? 'violet' : index === 1 ? 'sky' : 'emerald'}-500`, 0) },
            { stop: 1, color: getRgbaColor(`${index === 0 ? 'violet' : index === 1 ? 'sky' : 'emerald'}-500`, 0.2) }
          ]);
          return gradientOrColor || 'transparent';
        } : 'transparent',
        borderColor: colors[index],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: colors[index],
        pointHoverBackgroundColor: colors[index],
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      }
    })
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Domain Rating Growth</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      <div className="grow">
        <LineChart01 data={chartData} width={595} height={200} />
      </div>
    </div>
  )
}
