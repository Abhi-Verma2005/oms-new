'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import CountUp from 'react-countup'
import LineChart01 from '@/components/charts/line-chart-01'
import BarChart01 from '@/components/charts/bar-chart-01'
import DoughnutChart from '@/components/charts/doughnut-chart'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { CaseStudiesGrid } from '@/components/insights-section'
import { adjustColorOpacity, getCssVariable } from '@/components/utils/utils'
import LandingFooter from '@/components/landing-footer'

// Animation variants for hero section
const fadeInUp = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
}

const fadeInLeft = {
  initial: { x: -40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
}

const fadeInRight = {
  initial: { x: 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Case Studies
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
            >
              Our Success Stories
              <span className="block bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Driving Revenue
              </span>
              <span className="block text-gray-900 dark:text-white">
                & Growth
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg"
            >
              See how our proven, award-winning strategies drive real impact for businesses in every sector.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Explore Case Studies
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300">
                Download Report
              </button>
            </motion.div>
          </motion.div>

          {/* Right side - Image and stats */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="relative"
          >
            {/* Main image */}
            <motion.div 
              variants={fadeInRight}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="https://emiactech.com/wp-content/uploads/2025/09/107327.jpg"
                alt="Team working in an office"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>

            {/* Stats cards */}
            <motion.div 
              variants={fadeInRight}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute -bottom-8 -left-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  <CountUp end={80} duration={2.5} suffix="M+" />
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Organic Traffic</div>
              </div>
            </motion.div>

            <motion.div 
              variants={fadeInRight}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute -top-8 -right-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  <CountUp end={100} duration={2.5} suffix="+" />
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Case Studies</div>
              </div>
            </motion.div>

            {/* Decorative image */}
            <motion.div 
              variants={fadeInLeft}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute top-4 left-4 w-20 h-20 opacity-80"
            >
              <Image
                src="https://emiactech.com/wp-content/uploads/2025/09/decor-help-body.png"
                alt="Decorative graphic"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m')
  const [selectedMetric, setSelectedMetric] = useState('traffic')
  const [activeCategory, setActiveCategory] = useState<string>('finance-case')
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
      <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                background: "radial-gradient(125% 125% at 50% 90%, transparent 50%, #6366f1 100%)",
              }}
            />
      <div className=" -mt-20">
        {/* Hero Section */}
        <HeroSection />

        {/* Insights Header + Columns */}
        <section className="pt-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="text-center mb-10"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10"/></svg>
                Insights Overview
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Actionable SEO Insights
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Understand what you are looking at: each column highlights a different lens on performance.
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div variants={fadeInUp} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Traffic Growth</span>
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 7-7"/></svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Trend of organic visitors over time; helpful to spot momentum.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Keyword Rankings</span>
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8M12 17V3m0 0l-3 3m3-3l3 3"/></svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Visibility across priority keywords; shows where we win attention.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Traffic Sources</span>
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3"/></svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Breakdown of where users come from: search, direct, social, and more.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Backlinks</span>
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 005.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Authority from referring domains; indicates long-term ranking power.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Case Studies Only */}
        <section className="pb-20 pt-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Removed controls/charts/tabs - showing all case studies */}
            <div className="hidden">
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

            {/* Key Metrics Cards (removed) */}
            <div className="hidden">
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

            {/* Charts Section (removed) */}
            <div className="hidden">
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

            {/* Traffic Sources & Backlinks (removed) */}
            <div className="hidden">
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

            {/* Case Studies - All Rows */}
            <div className="mt-6">
              <CaseStudiesGrid selectedCategoryId="all" />
            </div>

          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}


