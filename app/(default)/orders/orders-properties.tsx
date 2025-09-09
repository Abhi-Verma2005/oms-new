export function OrdersProperties() {
  const totalColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-emerald-600'
      case 'PENDING':
        return 'text-amber-600'
      case 'CANCELLED':
        return 'text-red-600'
      case 'FAILED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-400/30 dark:text-emerald-400'
      case 'PENDING':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-400/30 dark:text-amber-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-600 dark:bg-red-400/30 dark:text-red-400'
      case 'FAILED':
        return 'bg-red-100 text-red-600 dark:bg-red-400/30 dark:text-red-400'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-400/30 dark:text-blue-400'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-400/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-400/30 dark:text-gray-400'
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'Online':
        return (
          <svg className="w-4 h-4 fill-current text-sky-500 mr-2" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
            <path d="M8 4c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
        )
      case 'In-Store':
        return (
          <svg className="w-4 h-4 fill-current text-emerald-500 mr-2" viewBox="0 0 16 16">
            <path d="M8 0L0 4v8l8 4 8-4V4L8 0zM2 5.5L8 8.5l6-3V6L8 9.5 2 6v-.5z" />
          </svg>
        )
      case 'Phone':
        return (
          <svg className="w-4 h-4 fill-current text-amber-500 mr-2" viewBox="0 0 16 16">
            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122L9.99 12.5a.678.678 0 0 1-.55-.25L7.25 9.56a.678.678 0 0 1-.25-.55l.122-1.08a.678.678 0 0 0-.122-.58L5.654 3.328z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 fill-current text-gray-500 mr-2" viewBox="0 0 16 16">
            <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
          </svg>
        )
    }
  }

  return {
    totalColor,
    statusColor,
    typeIcon,
  }
}
