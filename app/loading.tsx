export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-[96rem] mx-auto">
        {/* Hero/Heading skeleton */}
        <div className="space-y-3 mb-10">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Cards/sections skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


