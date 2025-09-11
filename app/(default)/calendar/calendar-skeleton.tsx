'use client'

export default function CalendarSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header skeleton */}
      <div className="sm:flex sm:justify-between sm:items-center mb-4">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-2" />
              <div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="sm:flex sm:justify-between sm:items-center mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-0">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
          <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
        </div>
        <div className="flex -space-x-px">
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-l-lg animate-pulse" />
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-r-lg animate-pulse" />
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, idx) => (
            <div key={idx} className="h-24 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700/60 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}


