'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  Key, 
  UserCheck, 
  TrendingUp, 
  Activity,
  Plus,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

// Import chart components
import BarChart01 from '@/components/charts/bar-chart-01';
import BarChart02 from '@/components/charts/bar-chart-02';
import LineChart01 from '@/components/charts/line-chart-01';
import LineChart02 from '@/components/charts/line-chart-02';
import DoughnutChart from '@/components/charts/doughnut-chart';
import PieChart from '@/components/charts/pie-chart';
import { chartAreaGradient } from '@/components/charts/chartjs-config';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '@/components/utils/utils';

interface DashboardStats {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  activeUserRoles: number;
  totalRevenue: number;
  totalOrders: number;
  totalViews: number;
  conversionRate: number;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

// Sample data for charts with proper CSS variables
const userGrowthData = {
  labels: [
    '12-01-2022', '01-01-2023', '02-01-2023',
    '03-01-2023', '04-01-2023', '05-01-2023',
    '06-01-2023', '07-01-2023', '08-01-2023',
    '09-01-2023', '10-01-2023', '11-01-2023',
    '12-01-2023', '01-01-2024', '02-01-2024',
    '03-01-2024', '04-01-2024', '05-01-2024',
    '06-01-2024', '07-01-2024', '08-01-2024',
    '09-01-2024', '10-01-2024', '11-01-2024',
    '12-01-2024', '01-01-2025',
  ],
  datasets: [
    {
      label: 'New Users',
      data: [65, 78, 90, 81, 56, 55, 40, 45, 60, 70, 85, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230],
      fill: true,
      backgroundColor: function(context: any) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        const gradientOrColor = chartAreaGradient(ctx, chartArea, [
          { stop: 0, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0) },
          { stop: 1, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0.2) }
        ]);
        return gradientOrColor || 'transparent';
      },
      borderColor: getCssVariable('--color-violet-500'),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointBackgroundColor: getCssVariable('--color-violet-500'),
      pointHoverBackgroundColor: getCssVariable('--color-violet-500'),
      pointBorderWidth: 0,
      pointHoverBorderWidth: 0,
      clip: 20,
      tension: 0.2,
    },
    {
      label: 'Active Users',
      data: [45, 58, 70, 61, 46, 45, 30, 35, 50, 60, 75, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155],
      borderColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
      pointHoverBackgroundColor: adjustColorOpacity(getCssVariable('--color-gray-500'), 0.25),
      pointBorderWidth: 0,
      pointHoverBorderWidth: 0,
      clip: 20,
      tension: 0.2,
    }
  ]
};

const revenueData = {
  labels: [
    '12-01-2022', '01-01-2023', '02-01-2023',
    '03-01-2023', '04-01-2023', '05-01-2023',
    '06-01-2023', '07-01-2023', '08-01-2023',
    '09-01-2023', '10-01-2023', '11-01-2023',
    '12-01-2023', '01-01-2024', '02-01-2024',
    '03-01-2024', '04-01-2024', '05-01-2024',
    '06-01-2024', '07-01-2024', '08-01-2024',
    '09-01-2024', '10-01-2024', '11-01-2024',
    '12-01-2024', '01-01-2025',
  ],
  datasets: [
    {
      label: 'Revenue',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 45000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 68000, 70000, 72000, 75000, 78000, 80000, 82000, 85000],
      fill: true,
      backgroundColor: function(context: any) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        const gradientOrColor = chartAreaGradient(ctx, chartArea, [
          { stop: 0, color: adjustColorOpacity(getCssVariable('--color-emerald-500'), 0) },
          { stop: 1, color: adjustColorOpacity(getCssVariable('--color-emerald-500'), 0.2) }
        ]);
        return gradientOrColor || 'transparent';
      },
      borderColor: getCssVariable('--color-emerald-500'),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointBackgroundColor: getCssVariable('--color-emerald-500'),
      pointHoverBackgroundColor: getCssVariable('--color-emerald-500'),
      pointBorderWidth: 0,
      pointHoverBorderWidth: 0,
      clip: 20,
      tension: 0.2,
    }
  ]
};

const orderStatusData = {
  labels: ['Completed', 'Pending', 'Cancelled', 'Processing'],
  datasets: [{
    data: [65, 20, 10, 5],
    backgroundColor: [
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#3b82f6'  // blue-500
    ],
    borderWidth: 0,
  }]
};

const userRoleData = {
  labels: ['Admin', 'Manager', 'User', 'Guest'],
  datasets: [{
    data: [5, 15, 120, 25],
    backgroundColor: [
      '#ef4444', // red-500
      '#f59e0b', // amber-500
      '#3b82f6', // blue-500
      '#6b7280'  // gray-500
    ],
    borderWidth: 0,
  }]
};

const monthlyOrdersData = {
  labels: [
    '12-01-2022', '01-01-2023', '02-01-2023',
    '03-01-2023', '04-01-2023', '05-01-2023',
    '06-01-2023', '07-01-2023', '08-01-2023',
    '09-01-2023', '10-01-2023', '11-01-2023',
    '12-01-2023', '01-01-2024', '02-01-2024',
    '03-01-2024', '04-01-2024', '05-01-2024',
    '06-01-2024', '07-01-2024', '08-01-2024',
    '09-01-2024', '10-01-2024', '11-01-2024',
    '12-01-2024', '01-01-2025',
  ],
  datasets: [
    {
      label: 'Orders',
      data: [28, 48, 40, 19, 86, 27, 90, 45, 60, 75, 85, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230],
      backgroundColor: getCssVariable('--color-blue-500'),
      borderColor: getCssVariable('--color-blue-500'),
      borderWidth: 1,
    }
  ]
};

export function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback to sample data if API fails
          setStats({
            totalUsers: 165,
            totalRoles: 8,
            totalPermissions: 24,
            activeUserRoles: 142,
            totalRevenue: 485000,
            totalOrders: 1247,
            totalViews: 45678,
            conversionRate: 2.7,
            recentActivity: [
              { id: '1', action: 'User created', user: 'John Doe', timestamp: '2024-01-15T10:30:00Z' },
              { id: '2', action: 'Role assigned', user: 'Jane Smith', timestamp: '2024-01-15T09:15:00Z' },
              { id: '3', action: 'Permission updated', user: 'Admin User', timestamp: '2024-01-15T08:45:00Z' },
              { id: '4', action: 'User deleted', user: 'System', timestamp: '2024-01-14T16:20:00Z' },
              { id: '5', action: 'Role created', user: 'Admin User', timestamp: '2024-01-14T14:10:00Z' }
            ]
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback to sample data
        setStats({
          totalUsers: 165,
          totalRoles: 8,
          totalPermissions: 24,
          activeUserRoles: 142,
          totalRevenue: 485000,
          totalOrders: 1247,
          totalViews: 45678,
          conversionRate: 2.7,
          recentActivity: [
            { id: '1', action: 'User created', user: 'John Doe', timestamp: '2024-01-15T10:30:00Z' },
            { id: '2', action: 'Role assigned', user: 'Jane Smith', timestamp: '2024-01-15T09:15:00Z' },
            { id: '3', action: 'Permission updated', user: 'Admin User', timestamp: '2024-01-15T08:45:00Z' },
            { id: '4', action: 'User deleted', user: 'System', timestamp: '2024-01-14T16:20:00Z' },
            { id: '5', action: 'Role created', user: 'Admin User', timestamp: '2024-01-14T14:10:00Z' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        {/* Dashboard actions */}
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          {/* Left: Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive overview of your application's performance and user management</p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-12 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl animate-pulse">
              <div className="px-5 pt-5">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Dashboard actions */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8 relative z-10">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive overview of your application's performance and user management</p>
          {session?.user && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Welcome, {session.user.name || session.user.email}</span>
              <div className="flex space-x-1">
                {(((session as any)?.user?.roles) ?? []).map((role: string) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2 relative z-10">
          {/* Add view button */}
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white relative z-20">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add View</span>
          </button>              
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Key Metrics - Top Row */}
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-6">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total Users</h2>
              <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Users</div>
            <div className="flex items-start">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">{stats?.totalUsers || 0}</div>
              <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">+12%</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-6">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total Revenue</h2>
              <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Revenue</div>
            <div className="flex items-start">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">${(stats?.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">+8.2%</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-6">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Total Orders</h2>
              <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Orders</div>
            <div className="flex items-start">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">{stats?.totalOrders || 0}</div>
              <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">+15%</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-6">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Conversion Rate</h2>
              <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Rate</div>
            <div className="flex items-start">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">{stats?.conversionRate || 0}%</div>
              <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">+0.3%</div>
            </div>
          </div>
        </div>

        {/* Main Charts - Second Row */}
        <div className="flex flex-col col-span-full xl:col-span-8 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-2">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">User Growth & Revenue</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Monthly Performance</div>
          </div>
          {/* Chart built with Chart.js 3 */}
          <div className="grow max-sm:max-h-[180px] xl:max-h-[180px]">
            <LineChart02 data={userGrowthData} width={800} height={180} />
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="flex flex-col col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-6">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quick Actions</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3">Admin Tasks</div>
            <div className="space-y-3">
              <Button asChild size="sm" className="w-full justify-start">
                <Link href="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/roles">
                  <Shield className="h-4 w-4 mr-2" />
                  Roles
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/user-roles">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assignments
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/permissions">
                  <Key className="h-4 w-4 mr-2" />
                  Permissions
                </Link>
              </Button>
               <Button asChild size="sm" variant="outline" className="w-full justify-start">
                 <Link href="/admin/activities">
                   <Activity className="h-4 w-4 mr-2" />
                   Activity Log
                 </Link>
               </Button>
               <Button asChild size="sm" variant="outline" className="w-full justify-start">
                 <Link href="/admin/notification-types">
                   <Eye className="h-4 w-4 mr-2" />
                   Notification Types
                 </Link>
               </Button>
               <Button asChild size="sm" variant="outline" className="w-full justify-start">
                 <Link href="/admin/notifications">
                   <Clock className="h-4 w-4 mr-2" />
                   Notifications
                 </Link>
               </Button>
            </div>
          </div>
        </div>

        {/* Analytics Charts - Third Row */}
        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-h-[320px]">
          <div className="px-6 pt-6 pb-2">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Order Status</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Distribution</div>
          </div>
          {/* Chart built with Chart.js 3 */}
          <div className="grow max-sm:max-h-[250px] xl:max-h-[250px]">
            <DoughnutChart data={orderStatusData} width={240} height={220} />
          </div>
        </div>

        <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-h-[320px]">
          <div className="px-6 pt-6 pb-2">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">User Roles</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Distribution</div>
          </div>
          {/* Chart built with Chart.js 3 */}
          <div className="grow max-sm:max-h-[250px] xl:max-h-[250px]">
            <PieChart data={userRoleData} width={240} height={220} />
          </div>
        </div>

        <div className="flex flex-col col-span-full xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-h-[320px]">
          <div className="px-6 pt-6 pb-2">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Monthly Orders</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Volume Trends</div>
          </div>
          {/* Chart built with Chart.js 3 */}
          <div className="grow max-sm:max-h-[250px] xl:max-h-[250px]">
            <BarChart01 data={monthlyOrdersData} width={200} height={180} />
          </div>
        </div>

        {/* Recent Activity - Bottom Row */}
        <div className="flex flex-col col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
          <div className="px-6 pt-6 pb-2">
            <header className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h2>
            </header>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Latest Changes</div>
          </div>
          <div className="px-6 pb-6">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-600">
                        {activity.action.includes('created') && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {activity.action.includes('deleted') && <XCircle className="h-3 w-3 text-red-600" />}
                        {activity.action.includes('updated') && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                        {activity.action.includes('assigned') && <UserCheck className="h-3 w-3 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          by {activity.user}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>

      </div>      
    </div>
  );
}
