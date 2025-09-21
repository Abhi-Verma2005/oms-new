'use client'

import { useState, useEffect } from 'react'
import LineChart03 from '@/components/charts/line-chart-03'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { chartColors, getRgbaColor } from './chart-colors'

interface TrafficData {
  client: string
  data: Array<{
    month: string
    traffic: number
  }>
}

export default function TrafficGrowthChart() {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchTrafficData()
    }
  }, [mounted])

  const fetchTrafficData = async () => {
    try {
      const response = await fetch('/api/case-studies/analytics')
      const data = await response.json()
      setTrafficData(data.monthlyTrafficData || [])
    } catch (error) {
      console.error('Error fetching traffic data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Traffic Growth Analysis</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading traffic data...'}</div>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const allMonths = Array.from(new Set(
    trafficData.flatMap(client => client.data.map(d => d.month))
  )).sort()

  const chartData = {
    labels: allMonths,
    datasets: trafficData.map((client, index) => {
      const colors = [
        chartColors.violet[500],
        chartColors.sky[500],
        chartColors.emerald[500]
      ]
      
      const data = allMonths.map(month => {
        const clientMonth = client.data.find(d => d.month === month)
        return clientMonth ? clientMonth.traffic : null
      })

      return {
        label: client.client,
        data,
        fill: index === 0, // Only fill the first dataset
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
    <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Traffic Growth Analysis</h2>
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
        <LineChart03 data={chartData} width={800} height={300} />
      </div>
    </div>
  )
}
