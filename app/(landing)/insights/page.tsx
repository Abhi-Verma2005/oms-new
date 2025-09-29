'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import LineChart01 from '@/components/charts/line-chart-01'
import BarChart01 from '@/components/charts/bar-chart-01'
import DoughnutChart from '@/components/charts/doughnut-chart'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { adjustColorOpacity, getCssVariable } from '@/components/utils/utils'

export default function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m')
  const [selectedMetric, setSelectedMetric] = useState('traffic')
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setIsLoadingAnalytics(true)
        setAnalyticsError(null)
        const res = await fetch('/api/case-studies/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch analytics')
        const data = await res.json()
        if (!cancelled) setAnalytics(data)
      } catch (err: any) {
        if (!cancelled) setAnalyticsError(err?.message || 'Failed to load analytics')
      } finally {
        if (!cancelled) setIsLoadingAnalytics(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Traffic Growth Data
  const trafficData = {
    labels: [
      'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
      'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
    ],
    datasets: [
      {
        data: [18.17, 19.5, 22.1, 25.8, 28.9, 32.37, 35.2, 38.1, 41.3, 44.7, 48.2, 52.1],
        fill: true,
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          const gradientOrColor = chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-purple-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-purple-500'), 0.2) }
          ]);
          return gradientOrColor || 'transparent';
        },   
        borderColor: getCssVariable('--color-purple-500'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: getCssVariable('--color-purple-500'),
        pointHoverBackgroundColor: getCssVariable('--color-purple-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  }

  // Keyword Rankings Data
  const keywordData = {
    labels: [
      'mahindra auto', 'protean egov', 'upgrad courses', 'digital marketing', 
      'seo services', 'online education', 'fintech solutions', 'automotive industry'
    ],
    datasets: [
      {
        data: [95, 90, 85, 80, 75, 70, 65, 60],
        backgroundColor: [
          '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', 
          '#e9d5ff', '#f3e8ff', '#faf5ff', '#fdf4ff'
        ],
        borderWidth: 0,
      },
    ],
  }

  // Traffic Sources Data
  const trafficSourcesData = {
    labels: ['Organic Search', 'Direct', 'Social Media', 'Email', 'Referral', 'Paid Ads'],
    datasets: [
      {
        data: [45.2, 12.8, 8.4, 4.2, 2.1, 1.8],
        backgroundColor: [
          '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'
        ],
        borderWidth: 0,
      },
    ],
  }

  // Backlinks Performance Data
  const backlinksData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Backlinks',
        data: [45, 52, 38, 67, 73, 58, 82, 91, 76, 88, 95, 102],
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Lost Backlinks',
        data: [12, 8, 15, 6, 9, 11, 7, 4, 13, 5, 8, 3],
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 2,
        fill: false,
      },
    ],
  }

  // Map selected period to number of points
  const periodLength = useMemo(() => {
    switch (selectedPeriod) {
      case '3m':
        return 3
      case '6m':
        return 6
      case '1y':
      default:
        return 12
    }
  }, [selectedPeriod])

  // Helper to slice labels and each dataset's data consistently from the end
  function sliceChartData<T extends { labels: string[]; datasets: Array<{ data: number[] }> }>(
    chart: T,
    length: number,
  ): T {
    const labels = chart.labels.slice(-length)
    const datasets = chart.datasets.map(ds => ({
      ...ds,
      data: ds.data.slice(-length),
    })) as T['datasets']
    return { ...(chart as any), labels, datasets }
  }

  // Build traffic from API if available (aggregate all studies by month)
  const trafficFromApiFull = useMemo(() => {
    if (!analytics?.monthlyTrafficData) return null
    const monthToSum: Record<string, number> = {}
    for (const study of analytics.monthlyTrafficData as Array<{ client: string; data: Array<{ month: string; traffic: number }> }>) {
      for (const point of study.data) {
        monthToSum[point.month] = (monthToSum[point.month] || 0) + (typeof point.traffic === 'number' ? point.traffic : 0)
      }
    }
    const labels = Object.keys(monthToSum).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const data = labels.map(l => monthToSum[l])
    return {
      labels,
      datasets: [
        {
          data,
          fill: true,
          backgroundColor: function(context: any) {
            const chart = context.chart
            const { ctx, chartArea } = chart
            const gradientOrColor = chartAreaGradient(ctx, chartArea, [
              { stop: 0, color: adjustColorOpacity(getCssVariable('--color-purple-500'), 0) },
              { stop: 1, color: adjustColorOpacity(getCssVariable('--color-purple-500'), 0.2) },
            ])
            return gradientOrColor || 'transparent'
          },
          borderColor: getCssVariable('--color-purple-500'),
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: getCssVariable('--color-purple-500'),
          pointHoverBackgroundColor: getCssVariable('--color-purple-500'),
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          clip: 20,
          tension: 0.2,
        },
      ],
    }
  }, [analytics])

  // Build top keywords from API if available (first case study keywords by average rank)
  const keywordFromApiFull = useMemo(() => {
    if (!analytics?.keywordRankingData?.length) return null
    const first = (analytics.keywordRankingData as any[])[0]
    const items: Array<{ keyword: string; score: number }> = []
    for (const k of first.keywords || []) {
      const ranks = Object.values(k.ranks || {}).filter(v => typeof v === 'number') as number[]
      const avgRank = ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 50
      const score = Math.max(0, 100 - avgRank) // higher score for better (lower) ranks
      items.push({ keyword: k.keyword, score })
    }
    items.sort((a, b) => b.score - a.score)
    const top = items.slice(0, 8)
    return {
      labels: top.map(t => t.keyword),
      datasets: [
        {
          data: top.map(t => Math.round(t.score)),
          backgroundColor: [
            '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff', '#fdf4ff',
          ],
          borderWidth: 0,
        },
      ],
    }
  }, [analytics])

  const trafficFull = trafficFromApiFull || trafficData
  const keywordFull = keywordFromApiFull || keywordData

  const trafficDataView = useMemo(() => sliceChartData(trafficFull, periodLength), [trafficFull, periodLength])
  const backlinksDataView = useMemo(() => sliceChartData(backlinksData, periodLength), [backlinksData, periodLength])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Analytics
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Detailed Insights
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Comprehensive analytics and performance metrics from our outreach campaigns. 
                Real data, real results, real impact.
              </p>
            </div>
          </div>
        </section>

        {/* Analytics Dashboard */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between mb-12">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPeriod('3m')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === '3m' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    3M
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('6m')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === '6m' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    6M
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('1y')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === '1y' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    1Y
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">View:</span>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedMetric('traffic')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedMetric === 'traffic' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Traffic
                  </button>
                  <button
                    onClick={() => setSelectedMetric('keywords')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedMetric === 'keywords' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Keywords
                  </button>
                  <button
                    onClick={() => setSelectedMetric('backlinks')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedMetric === 'backlinks' 
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Backlinks
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">187%</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">+187% Growth</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Traffic Growth</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Year-over-year organic traffic increase</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">2,847</div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Keywords</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ranking Keywords</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Total keywords ranking in top 100</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">1,247</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">New Links</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Backlinks Acquired</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">High-quality backlinks from authoritative domains</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">96.8%</div>
                    <div className="text-sm text-violet-600 dark:text-violet-400 font-medium">Success Rate</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Campaign Success</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Average success rate across all campaigns</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Traffic Growth Chart */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Growth</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Organic Traffic</span>
                  </div>
                </div>
                <div className="h-64">
                  <LineChart01 data={trafficDataView} width={400} height={256} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">52.1M</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Current Traffic</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">+187%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">YoY Growth</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">+33.9M</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Traffic Increase</div>
                  </div>
                </div>
              </div>

              {/* Keyword Rankings Chart */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Top Keywords</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Ranking Performance</div>
                </div>
                <div className="h-64">
                  <BarChart01 data={keywordFull} width={400} height={256} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">mahindra auto</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">#1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">protean egov</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">#2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">upgrad courses</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">#3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic Sources & Backlinks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Traffic Sources */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Traffic Sources</h3>
                <div className="h-64">
                  <DoughnutChart data={trafficSourcesData} width={400} height={256} />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Organic Search</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">45.2K (59%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Direct</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">12.8K (17%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">Social Media</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">8.4K (11%)</span>
                  </div>
                </div>
              </div>

              {/* Backlinks Performance */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Backlinks Performance</h3>
                <div className="h-64">
                  <BarChart01 data={backlinksDataView} width={400} height={256} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">1,247</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">New Backlinks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">-89</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Lost Backlinks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Studies Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Case Study Results</h2>
                <p className="text-gray-600 dark:text-gray-300">Real results from our client campaigns</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mahindra Auto</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Automotive Industry</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Traffic Growth</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">+78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Keywords Ranking</span>
                      <span className="font-semibold text-gray-900 dark:text-white">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Backlinks Acquired</span>
                      <span className="font-semibold text-gray-900 dark:text-white">342</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Protean eGov</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Government Services</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Traffic Growth</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">+142%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Keywords Ranking</span>
                      <span className="font-semibold text-gray-900 dark:text-white">892</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Backlinks Acquired</span>
                      <span className="font-semibold text-gray-900 dark:text-white">567</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">UpGrad Courses</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Education Technology</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Traffic Growth</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">+95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Keywords Ranking</span>
                      <span className="font-semibold text-gray-900 dark:text-white">1,156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Backlinks Acquired</span>
                      <span className="font-semibold text-gray-900 dark:text-white">423</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-3xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">Ready to See These Results for Your Business?</h2>
                <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                  Join 2,000+ companies already seeing real growth with our proven outreach strategies.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/publishers"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200"
                  >
                    Start Your Campaign
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center px-8 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200"
                  >
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
