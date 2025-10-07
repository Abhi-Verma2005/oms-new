export default function Loading() {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-[96rem] mx-auto">
        <div className="max-w-3xl m-auto">
          {/* Title skeleton */}
          <div className="mb-6">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Search skeleton */}
          <div className="mb-8">
            <div className="h-12 w-full bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl animate-pulse" />
          </div>

          {/* Filter pills skeleton */}
          <div className="mb-10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ))}
            </div>
          </div>

          {/* FAQ cards skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
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


