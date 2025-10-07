export default function Loading() {
  return (
    <div className="relative bg-white dark:bg-gray-900 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="max-w-xl mx-auto text-center">
          <div className="h-16 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-4" />
          <div className="h-8 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}


