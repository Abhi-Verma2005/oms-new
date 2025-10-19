'use client'

import { useState, useEffect } from 'react'
import LineChart01 from '@/components/charts/line-chart-01'
import BarChart03 from '@/components/charts/bar-chart-03'
import DoughnutChart from '@/components/charts/doughnut-chart'
import PieChart from '@/components/charts/pie-chart'
import { chartAreaGradient } from '@/components/charts/chartjs-config'
import { adjustColorOpacity, getCssVariable } from '@/components/utils/utils'

export default function PersonalAnalytics() {
  const [userData, setUserData] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    feedbackCount: 0,
    avgRating: 0,
    dailyCredits: 50,
    creditsUsed: 0,
    activityScore: 0,
    monthOverMonthChange: 0,
    orderStatusDistribution: {} as Record<string, number>,
    weeklyCreditsUsage: [] as { day: string; credits: number }[],
    wishlistBreakdown: { addedThisMonth: 0, addedLastMonth: 0, addedEarlier: 0 },
    activityByMonth: {} as Record<string, Record<string, number>>,
    monthLabels: [] as string[]
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real user analytics data
  const fetchUserAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/analytics', {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`)
      }
      
      const data = await response.json()
      
      setUserData({
        totalOrders: data.totalOrders,
        totalSpent: data.totalSpent,
        wishlistItems: data.wishlistItems,
        feedbackCount: data.feedbackCount,
        avgRating: 4.2, // This would need to be calculated from actual feedback
        dailyCredits: data.dailyCredits,
        creditsUsed: data.creditsUsedToday,
        activityScore: data.activityScore,
        monthOverMonthChange: data.monthOverMonthChange,
        orderStatusDistribution: data.orderStatusDistribution || {},
        weeklyCreditsUsage: data.weeklyCreditsUsage || [],
        wishlistBreakdown: data.wishlistBreakdown || { addedThisMonth: 0, addedLastMonth: 0, addedEarlier: 0 },
        activityByMonth: data.activityByMonth || {},
        monthLabels: data.monthLabels || []
      })
    } catch (err) {
      console.error('Error fetching user analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      
      // Fallback to default values on error
      setUserData({
        totalOrders: 0,
        totalSpent: 0,
        wishlistItems: 0,
        feedbackCount: 0,
        avgRating: 0,
        dailyCredits: 50,
        creditsUsed: 0,
        activityScore: 0,
        monthOverMonthChange: 0,
        orderStatusDistribution: {},
        weeklyCreditsUsage: [],
        wishlistBreakdown: { addedThisMonth: 0, addedLastMonth: 0, addedEarlier: 0 },
        activityByMonth: {},
        monthLabels: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAnalytics()
  }, [])

  // Listen for credit usage events to refresh data
  useEffect(() => {
    const handleCreditsUsed = () => {
      // Refresh analytics data when credits are used
      fetchUserAnalytics()
    }

    window.addEventListener('creditsUsed', handleCreditsUsed)
    
    return () => {
      window.removeEventListener('creditsUsed', handleCreditsUsed)
    }
  }, [])


  // Order Status Distribution Chart Data (from API)
  const orderStatusLabels = ['PAID','PENDING','FAILED','CANCELLED']
  const orderStatusData = {
    labels: ['Paid', 'Pending', 'Failed', 'Cancelled'],
    datasets: [
      {
        data: orderStatusLabels.map(k => userData.orderStatusDistribution[k] || 0),
        backgroundColor: [
          getCssVariable('--color-green-500'),
          getCssVariable('--color-yellow-500'),
          getCssVariable('--color-red-500'),
          getCssVariable('--color-gray-500'),
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-green-600'),
          getCssVariable('--color-yellow-600'),
          getCssVariable('--color-red-600'),
          getCssVariable('--color-gray-600'),
        ],
        borderWidth: 0,
      },
    ],
  }


  // Activity Categories Chart Data (stacked across months)
  const monthLabels = userData.monthLabels.length ? userData.monthLabels : ['Jan','Feb','Mar','Apr','May','Jun']
  const activityCategoriesData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Navigation',
        data: monthLabels.map(m => (userData.activityByMonth[m]?.NAVIGATION) || 0),
        backgroundColor: getCssVariable('--color-violet-700'),
        hoverBackgroundColor: getCssVariable('--color-violet-800'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Orders',
        data: monthLabels.map(m => (userData.activityByMonth[m]?.ORDER) || 0),
        backgroundColor: getCssVariable('--color-violet-500'),
        hoverBackgroundColor: getCssVariable('--color-violet-600'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Profile',
        data: monthLabels.map(m => (userData.activityByMonth[m]?.PROFILE) || 0),
        backgroundColor: getCssVariable('--color-violet-300'),
        hoverBackgroundColor: getCssVariable('--color-violet-400'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Other',
        data: monthLabels.map(m => (userData.activityByMonth[m]?.OTHER) || 0),
        backgroundColor: getCssVariable('--color-violet-100'),
        hoverBackgroundColor: getCssVariable('--color-violet-200'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  // Wishlist Activity Chart Data (from API breakdown)
  const wishlistData = {
    labels: ['Added This Month', 'Added Last Month', 'Added Earlier'],
    datasets: [
      {
        data: [
          userData.wishlistBreakdown.addedThisMonth,
          userData.wishlistBreakdown.addedLastMonth,
          userData.wishlistBreakdown.addedEarlier,
        ],
        backgroundColor: [
          getCssVariable('--color-green-500'),
          getCssVariable('--color-blue-500'),
          getCssVariable('--color-gray-500'),
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-green-600'),
          getCssVariable('--color-blue-600'),
          getCssVariable('--color-gray-600'),
        ],
        borderWidth: 0,
      },
    ],
  }

  // Credits Usage Chart Data (from API weeklyCreditsUsage)
  const creditsChartData = {
    labels: userData.weeklyCreditsUsage.map(d => d.day),
    datasets: [
      {
        data: userData.weeklyCreditsUsage.map(d => d.credits),
        fill: true,
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          const gradientOrColor = chartAreaGradient(ctx, chartArea, [
            { stop: 0, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0) },
            { stop: 1, color: adjustColorOpacity(getCssVariable('--color-blue-500'), 0.2) }
          ]);
          return gradientOrColor || 'transparent';
        },
        borderColor: getCssVariable('--color-blue-500'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointBackgroundColor: getCssVariable('--color-blue-500'),
        pointHoverBackgroundColor: getCssVariable('--color-blue-500'),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        clip: 20,
        tension: 0.2,
      },
    ],
  }

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-6 min-w-0">
        {/* Key Metrics Summary Card - 4 metrics in a row */}
        <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {/* Total Orders & Spent */}
              <div className="text-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
              
              {/* Credits Usage */}
              <div className="text-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
              
              {/* Wishlist Items */}
              <div className="text-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
              
              {/* Activity Score */}
              <div className="text-center">
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 mx-auto" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Chart - Doughnut Chart */}
        <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </header>
          <div className="p-5 flex items-center justify-center">
            {/* Doughnut chart skeleton */}
            <div className="relative">
              <div className="h-48 w-48 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
          {/* Legend skeleton */}
          <div className="px-5 pb-4 flex flex-wrap gap-4 justify-center">
            {['Paid', 'Pending', 'Failed', 'Cancelled'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Credits Usage - Line Chart */}
        <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </header>
          <div className="p-5">
            {/* Line chart skeleton with area fill */}
            <div className="relative h-32">
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-16">
                <div className="h-full w-full bg-gray-100 dark:bg-gray-600 rounded-t" />
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Activity - Pie Chart */}
        <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </header>
          <div className="p-5 flex items-center justify-center">
            {/* Pie chart skeleton */}
            <div className="h-48 w-48 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
          {/* Legend skeleton */}
          <div className="px-5 pb-4 flex flex-wrap gap-4 justify-center">
            {['Added This Month', 'Added Last Month', 'Added Earlier'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Activity Breakdown - Bar Chart */}
        <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </header>
          <div className="p-5">
            {/* Bar chart skeleton with multiple bars */}
            <div className="h-48 flex items-end justify-between gap-2">
              {[40, 60, 30, 70, 50, 45].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse" 
                    style={{ height: `${height}%` }} 
                  />
                  <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
            {/* Activity type buttons skeleton */}
            <div className="flex gap-4 mt-4 justify-center">
              {['Navigation', 'Orders', 'Profile', 'Other'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-5 py-4 text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">⚠️ Error loading analytics</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 min-w-0">
      {/* Key Metrics Summary */}
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* Total Orders & Spent */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{userData.totalOrders}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Orders</div>
              <div className="text-lg font-semibold text-green-600 mt-1">${userData.totalSpent}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Spent</div>
            </div>
            
            {/* Credits Usage */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{userData.creditsUsed}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Credits Used Today</div>
              <div className="text-lg font-semibold text-blue-600 mt-1">{userData.dailyCredits}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
            </div>
            
            {/* Wishlist Items */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{userData.wishlistItems}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Wishlist Items</div>
              <div className="text-lg font-semibold text-purple-600 mt-1">{userData.feedbackCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Feedback Given</div>
            </div>
            
            {/* Activity Score */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{userData.activityScore}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Activity Score</div>
              <div className={`text-lg font-semibold mt-1 ${
                userData.monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {userData.monthOverMonthChange >= 0 ? '+' : ''}{userData.monthOverMonthChange}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">vs Last Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Order Status</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Breakdown of your orders</p>
        </header>
        <div className="w-full overflow-hidden">
          <DoughnutChart data={orderStatusData} width={400} height={200} />
        </div>
      </div>

      {/* Credits Usage Pattern */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Weekly Credits Usage</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your usage pattern this week</p>
        </header>
        <div className="grow w-full overflow-hidden">
          <LineChart01 data={creditsChartData} width={400} height={150} />
        </div>
      </div>

      {/* Wishlist Activity */}
      <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Wishlist Activity</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">When you added items</p>
        </header>
        <div className="w-full overflow-hidden">
          <PieChart data={wishlistData} width={400} height={200} />
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Activity Breakdown</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Different types of activities over time</p>
        </header>
        <div className="w-full overflow-hidden">
          <BarChart03 data={activityCategoriesData} width={800} height={200} />
        </div>
      </div>
    </div>
  )
}
