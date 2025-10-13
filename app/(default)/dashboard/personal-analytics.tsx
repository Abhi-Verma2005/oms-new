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
    creditsUsed: 0
  })

  // Mock data - in real implementation, this would come from API/database
  useEffect(() => {
    // Simulate loading user data
    setUserData({
      totalOrders: 12,
      totalSpent: 2450,
      wishlistItems: 8,
      feedbackCount: 3,
      avgRating: 4.2,
      dailyCredits: 50,
      creditsUsed: 23
    })
  }, [])


  // Order Status Distribution Chart Data
  const orderStatusData = {
    labels: ['Paid', 'Pending', 'Failed', 'Cancelled'],
    datasets: [
      {
        data: [8, 3, 1, 0],
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


  // Activity Categories Chart Data
  const activityCategoriesData = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'
    ],
    datasets: [
      {
        label: 'Navigation',
        data: [15, 18, 12, 20, 25, 22],
        backgroundColor: getCssVariable('--color-violet-700'),
        hoverBackgroundColor: getCssVariable('--color-violet-800'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Orders',
        data: [8, 12, 6, 15, 18, 14],
        backgroundColor: getCssVariable('--color-violet-500'),
        hoverBackgroundColor: getCssVariable('--color-violet-600'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Profile',
        data: [5, 7, 4, 8, 10, 9],
        backgroundColor: getCssVariable('--color-violet-300'),
        hoverBackgroundColor: getCssVariable('--color-violet-400'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
      {
        label: 'Other',
        data: [12, 15, 10, 18, 20, 16],
        backgroundColor: getCssVariable('--color-violet-100'),
        hoverBackgroundColor: getCssVariable('--color-violet-200'),
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      },
    ],
  }

  // Wishlist Activity Chart Data
  const wishlistData = {
    labels: ['Added This Month', 'Added Last Month', 'Added Earlier'],
    datasets: [
      {
        data: [3, 2, 3],
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

  // Credits Usage Chart Data
  const creditsChartData = {
    labels: [
      'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
    ],
    datasets: [
      {
        data: [8, 12, 6, 15, 18, 4, 7],
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
              <div className="text-lg font-semibold text-blue-600 mt-1">{userData.dailyCredits - userData.creditsUsed}</div>
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
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">92</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Activity Score</div>
              <div className="text-lg font-semibold text-green-600 mt-1">+12%</div>
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
