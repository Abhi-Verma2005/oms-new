export default function Loading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-6">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex justify-end">
            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}


