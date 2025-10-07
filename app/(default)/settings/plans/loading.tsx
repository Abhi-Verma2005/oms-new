export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-2 mb-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}


