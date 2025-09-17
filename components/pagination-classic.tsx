export default function PaginationClassic({
  page = 1,
  perPage = 10,
  total = 0,
  onPrev,
  onNext,
}: {
  page?: number
  perPage?: number
  total?: number
  onPrev?: () => void
  onNext?: () => void
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  const canPrev = page > 1
  const canNext = end < total
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <nav className="mb-4 sm:mb-0 sm:order-1" role="navigation" aria-label="Navigation">
        <ul className="flex justify-center">
          <li className="ml-3 first:ml-0">
            {canPrev ? (
              <button onClick={onPrev} className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">&lt;- Previous</button>
            ) : (
              <span className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 text-gray-300 dark:text-gray-600">&lt;- Previous</span>
            )}
          </li>
          <li className="ml-3 first:ml-0">
            {canNext ? (
              <button onClick={onNext} className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">Next -&gt;</button>
            ) : (
              <span className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 text-gray-300 dark:text-gray-600">Next -&gt;</span>
            )}
          </li>
        </ul>
      </nav>
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Showing <span className="font-medium text-gray-600 dark:text-gray-300">{start}</span> to <span className="font-medium text-gray-600 dark:text-gray-300">{end}</span> of <span className="font-medium text-gray-600 dark:text-gray-300">{total}</span> results
      </div>
    </div>
  )
}