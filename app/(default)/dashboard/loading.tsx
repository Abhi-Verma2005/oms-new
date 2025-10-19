import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto min-w-0">
      {/* Page header skeleton */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        {/* Right: Actions - Datepicker */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Personal Analytics Section Skeleton - Full Layout */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-6 min-w-0">
          {/* Key Metrics Summary Card - 4 metrics in a row */}
          <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {/* Total Orders & Spent */}
                <div className="text-center">
                  <Skeleton className="h-8 w-8 mb-2 mx-auto" />
                  <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                  <Skeleton className="h-6 w-16 mb-1 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
                
                {/* Credits Usage */}
                <div className="text-center">
                  <Skeleton className="h-8 w-8 mb-2 mx-auto" />
                  <Skeleton className="h-4 w-24 mb-1 mx-auto" />
                  <Skeleton className="h-6 w-8 mb-1 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                
                {/* Wishlist Items */}
                <div className="text-center">
                  <Skeleton className="h-8 w-8 mb-2 mx-auto" />
                  <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                  <Skeleton className="h-6 w-8 mb-1 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
                
                {/* Activity Score */}
                <div className="text-center">
                  <Skeleton className="h-8 w-12 mb-2 mx-auto" />
                  <Skeleton className="h-4 w-20 mb-1 mx-auto" />
                  <Skeleton className="h-6 w-8 mb-1 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Chart - Doughnut Chart */}
          <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </header>
            <div className="p-5 flex items-center justify-center">
              {/* Doughnut chart skeleton */}
              <div className="relative">
                <Skeleton className="h-48 w-48 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
              </div>
            </div>
            {/* Legend skeleton */}
            <div className="px-5 pb-4 flex flex-wrap gap-4 justify-center">
              {['Paid', 'Pending', 'Failed', 'Cancelled'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Credits Usage - Line Chart */}
          <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-40" />
            </header>
            <div className="p-5">
              {/* Line chart skeleton with area fill */}
              <div className="relative h-32">
                <Skeleton className="h-full w-full rounded" />
                <div className="absolute bottom-0 left-0 right-0 h-16">
                  <Skeleton className="h-full w-full rounded-t" />
                </div>
              </div>
            </div>
          </div>

          {/* Wishlist Activity - Pie Chart */}
          <div className="col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-4 w-36" />
            </header>
            <div className="p-5 flex items-center justify-center">
              {/* Pie chart skeleton */}
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
            {/* Legend skeleton */}
            <div className="px-5 pb-4 flex flex-wrap gap-4 justify-center">
              {['Added This Month', 'Added Last Month', 'Added Earlier'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Breakdown - Bar Chart */}
          <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl min-w-0">
            <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </header>
            <div className="p-5">
              {/* Bar chart skeleton with multiple bars */}
              <div className="h-48 flex items-end justify-between gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <Skeleton className="w-full rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }} />
                    <Skeleton className="h-3 w-8" />
                  </div>
                ))}
              </div>
              {/* Activity type buttons skeleton */}
              <div className="flex gap-4 mt-4 justify-center">
                {['Navigation', 'Orders', 'Profile', 'Other'].map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Orders Section Skeleton */}
      <div className="mb-10">
        {/* Project Selector Skeleton */}
        <div className="inline-flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-56" />
        </div>

        {/* Project Orders Content Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          {/* Orders Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="pt-2">
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}