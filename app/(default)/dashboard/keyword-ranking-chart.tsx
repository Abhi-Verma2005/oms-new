'use client'

import { useState, useEffect } from 'react'
import BarChart04 from '@/components/charts/bar-chart-04'
import { chartColors } from './chart-colors'

interface KeywordData {
  client: string
  keywords: Array<{
    keyword: string
    ranks: {
      jan2025?: number
      feb2025?: number
      mar2025?: number
      apr2025?: number
      may2025?: number
      jun2025?: number
      jul2025?: number
    }
  }>
}

export default function KeywordRankingChart() {
  const [keywordData, setKeywordData] = useState<KeywordData[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchKeywordData()
    }
  }, [mounted])

  const fetchKeywordData = async () => {
    try {
      const response = await fetch('/api/case-studies/analytics')
      const data = await response.json()
      setKeywordData(data.keywordRankingData || [])
    } catch (error) {
      console.error('Error fetching keyword data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Keyword Ranking Progress</h2>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">{!mounted ? 'Initializing...' : 'Loading keyword data...'}</div>
        </div>
      </div>
    )
  }

  // Calculate average rankings for each client
  const rankingData = keywordData.map(client => {
    const allRanks = client.keywords.flatMap(keyword => 
      Object.values(keyword.ranks).filter(rank => rank !== null && rank !== undefined) as number[]
    )
    
    const avgRank = allRanks.length > 0 
      ? allRanks.reduce((sum, rank) => sum + rank, 0) / allRanks.length 
      : 0
    
    const top3Count = allRanks.filter(rank => rank <= 3).length
    const top10Count = allRanks.filter(rank => rank <= 10).length
    
    return {
      client: client.client,
      avgRank: Math.round(avgRank * 10) / 10,
      top3Count,
      top10Count,
      totalKeywords: allRanks.length
    }
  })

  const chartData = {
    labels: rankingData.map(d => d.client),
    datasets: [
      {
        label: 'Top 3 Rankings',
        data: rankingData.map(d => d.top3Count),
        backgroundColor: chartColors.violet[500],
        hoverBackgroundColor: chartColors.violet[600],
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Top 10 Rankings',
        data: rankingData.map(d => d.top10Count),
        backgroundColor: chartColors.sky[500],
        hoverBackgroundColor: chartColors.sky[600],
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Keyword Ranking Progress</h2>
      </header>
      <div className="px-5 py-3">
        <div className="space-y-3">
          {rankingData.map((data, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{data.client}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Avg Rank: {data.avgRank} | Total: {data.totalKeywords}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-violet-600">{data.top3Count}</div>
                <div className="text-xs text-gray-500">Top 3</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chart built with Chart.js 3 */}
      <div className="grow">
        <BarChart04 data={chartData} width={389} height={200} />
      </div>
    </div>
  )
}
