export default function Loading() {
  return (
    <div className="relative bg-white dark:bg-gray-900 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="max-w-3xl m-auto">
          <div className="mb-5">
            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="mb-6">
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


