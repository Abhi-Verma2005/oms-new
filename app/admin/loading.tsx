export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header skeleton */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0 space-y-2">
          <div className="h-7 w-56 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-80 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-12 gap-6">
        {[...Array(8)].map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col col-span-full sm:col-span-6 xl:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            <div className="px-6 pt-6 pb-6 space-y-3">
              <div className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 w-16 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 w-28 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Wide section skeleton */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-full xl:col-span-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-6 pt-6 pb-6 space-y-3">
            <div className="h-4 w-48 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-[180px] w-full rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
        <div className="col-span-full xl:col-span-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-6 pt-6 pb-6 space-y-3">
            <div className="h-4 w-40 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-full rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


