export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-2 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-2 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


