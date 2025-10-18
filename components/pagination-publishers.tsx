'use client'

import { useState } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

export default function PaginationPublishers({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ''
}: PaginationProps) {
  const [showPageInput, setShowPageInput] = useState(false)
  const [inputPage, setInputPage] = useState('')

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputPage)
      if (page >= 1 && page <= totalPages) {
        onPageChange(page)
        setShowPageInput(false)
        setInputPage('')
      }
    } else if (e.key === 'Escape') {
      setShowPageInput(false)
      setInputPage('')
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots.filter((page, index, array) => array.indexOf(page) === index)
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Items info */}
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </span>
      </div>

      {/* Pagination controls */}
      <nav className="flex items-center space-x-1" role="navigation" aria-label="Pagination">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9.4 13.4l1.4-1.4-4-4 4-4-1.4-1.4L4 8z" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="flex items-center -space-x-px">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              )
            }

            const pageNumber = page as number
            const isCurrentPage = pageNumber === currentPage

            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium transition-colors ${
                  isCurrentPage
                    ? 'bg-violet-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
                aria-label={`Page ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
            currentPage === totalPages
              ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.6 13.4L5.2 12l4-4-4-4 1.4-1.4L12 8z" />
          </svg>
        </button>

        {/* Jump to page */}
        <div className="ml-2 flex items-center">
          {showPageInput ? (
            <input
              type="number"
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => {
                setShowPageInput(false)
                setInputPage('')
              }}
              className="w-16 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Page"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setShowPageInput(true)}
              className="inline-flex items-center justify-center px-2.5 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition-colors"
              aria-label="Jump to page"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}
