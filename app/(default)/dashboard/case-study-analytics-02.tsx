'use client'

import { useState, useEffect } from 'react'
import BarChart04 from '@/components/charts/bar-chart-04'
import { chartColors } from './chart-colors'

export default function CaseStudyAnalytics02() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  // Industry performance data
  const chartData = {
    labels: [
      'Automotive', 'Fintech/Gov', 'Education'
    ],
    datasets: [
      // Traffic Growth
      {
        label: 'Traffic Growth %',
        xAxisID: 'x',
        data: [78.09, 933.0, 51.86],
        backgroundColor: chartColors.violet[500],
        hoverBackgroundColor: chartColors.violet[600],
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      // Keywords Ranked
      {
        label: 'Keywords Ranked (100s)',
        xAxisID: 'x1',
        data: [30, 7.96, 30],
        backgroundColor: chartColors.sky[500],
        hoverBackgroundColor: chartColors.sky[600],
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  if (!mounted) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Industry Performance</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Initializing...</div>
        </div>
      </div>
    )
  }

  return(
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Industry Performance</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <BarChart04 data={chartData} width={595} height={248} />
    </div>
  )
}
