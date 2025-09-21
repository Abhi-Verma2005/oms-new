'use client'

import { useState, useEffect } from 'react'
import DoughnutChart from '@/components/charts/doughnut-chart'
import { chartColors } from './chart-colors'

export default function CaseStudyAnalytics04() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  // Backlinks per month distribution
  const chartData = {
    labels: ['Mahindra Auto', 'Protean eGov', 'UpGrad'],
    datasets: [
      {
        label: 'Backlinks per Month',
        data: [75, 60, 60],
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

  if (!mounted) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Backlinks per Month</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Initializing...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Backlinks per Month</h2>
      </header>
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <DoughnutChart data={chartData} width={389} height={260} />
    </div>
  )
}
