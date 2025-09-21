'use client'

import { useState, useEffect } from 'react'
import LineChart03 from '@/components/charts/line-chart-03'
import { chartAreaGradient } from '@/components/charts/chartjs-config'

// Import utilities
import { chartColors, getRgbaColor } from './chart-colors'

export default function CaseStudyAnalytics01() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  // Combined traffic growth data for all case studies
  const chartData = {
    labels: [
      'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025'
    ],
    datasets: [
      // Mahindra Auto
      {
        label: 'Mahindra Auto',
        data: [null, null, 18.17, 19.5, 22.1, 25.8, 28.9, 32.37],
        fill: true,
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          const gradientOrColor = chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: 'rgba(139, 92, 246, 0)' },
            { stop: 1, color: 'rgba(139, 92, 246, 0.2)' }
          ]);
          return gradientOrColor || 'transparent';
        },     
        borderColor: '#8b5cf6',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: '#8b5cf6',
        pointHoverBackgroundColor: '#8b5cf6',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
      // Protean eGov
      {
        label: 'Protean eGov',
        data: [null, 1.45, 2.1, 3.2, 5.8, 8.9, 12.1, 15.2],
        borderColor: '#0ea5e9',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: '#0ea5e9',
        pointHoverBackgroundColor: '#0ea5e9',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,        
        clip: 20,
        tension: 0.2,
      },
      // UpGrad
      {
        label: 'UpGrad',
        data: [5.84, 6.2, 6.8, 7.4, 8.1, 8.87, null, null],
        borderColor: '#10b981',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: '#10b981',
        pointHoverBackgroundColor: '#10b981',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,        
        clip: 20,
        tension: 0.2,
      },
    ],
  }

  if (!mounted) {
    return (
      <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">EMIAC Case Studies - Traffic Growth</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Initializing...</div>
        </div>
      </div>
    )
  }

  return(
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">EMIAC Case Studies - Traffic Growth</h2>
      </header>
      <div className="px-5 py-1">
        <div className="flex flex-wrap max-sm:*:w-1/2">
          {/* Total Growth */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">1000%+</div>
                <div className="text-sm font-medium text-green-600">Combined</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Traffic Growth</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Keywords Ranked */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">6.6K+</div>
                <div className="text-sm font-medium text-green-600">Keywords</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Top 3 Rankings</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Backlinks */}
          <div className="flex items-center py-2">
            <div className="mr-5">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">170-220</div>
                <div className="text-sm font-medium text-green-600">Monthly</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">High-Quality Backlinks</div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700 mr-5" aria-hidden="true"></div>
          </div>
          {/* Campaign Duration */}
          <div className="flex items-center">
            <div>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">500+</div>
                <div className="text-sm font-medium text-green-600">Days</div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active SEO Execution</div>
            </div>
          </div>
        </div>
      </div>
      {/* Chart built with Chart.js 3 */}
      <div className="grow">
        {/* Change the height attribute to adjust the chart height */}
        <LineChart03 data={chartData} width={800} height={300} />
      </div>
    </div>
  )
}
