/**
 * Template for implementing standardized filtering in admin pages
 * 
 * This template shows how to use the useAdminFilters hook for consistent
 * filtering behavior across all admin pages with URL parameter support
 * and instant filtering.
 */

'use client'

import { useAdminFilters } from '@/hooks/use-admin-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'

export function AdminPageTemplate() {
  // Use the standardized filtering hook
  const {
    data,           // Your data array (users, orders, etc.)
    loading,        // Loading state
    pagination,     // Pagination info
    filters,        // Current filter state
    updateFilters,  // Function to update filters
    handlePageChange, // Function to handle pagination
    resetFilters,   // Function to reset all filters
    toggleTag,      // Function to toggle tag filters
    setSearch,      // Convenience function for search
    setStatus,      // Convenience function for status
    setSorting      // Convenience function for sorting
  } = useAdminFilters('/api/admin/your-endpoint', {
    // Configuration options
    searchPlaceholder: 'Search...',
    statusOptions: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    sortOptions: [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
      { value: 'name-asc', label: 'Name A-Z' },
      { value: 'name-desc', label: 'Name Z-A' }
    ],
    enableDateRange: true,  // Enable date range filtering
    enableTags: true,       // Enable tag filtering
    defaultSort: 'createdAt-desc',
    defaultLimit: 20
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Admin Page</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your data with consistent filtering</p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              setSorting(sortBy, sortOrder);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={resetFilters} variant="outline">
              Reset
            </Button>
          </div>

          {/* Date Range (if enabled) */}
          {filters.dateFrom !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="font-semibold text-gray-800 dark:text-gray-100">
            Data ({pagination?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data found matching your criteria
            </div>
          ) : (
            <div>
              {/* Your data rendering logic here */}
              {data.map((item: any) => (
                <div key={item.id} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {/* Render your data item */}
                  <div>{item.name || item.id}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Key Features of the Standardized Filtering System:
 * 
 * 1. URL Parameter Support:
 *    - All filters are automatically synced with URL parameters
 *    - Users can bookmark filtered views
 *    - Back/forward navigation works correctly
 * 
 * 2. Instant Filtering:
 *    - Search input has 300ms debouncing for smooth UX
 *    - Other filters apply immediately
 *    - No "Apply Filters" button needed
 * 
 * 3. Consistent API:
 *    - Same hook interface across all admin pages
 *    - Standardized filter options and configurations
 *    - Built-in pagination handling
 * 
 * 4. Dark Mode Support:
 *    - All components styled for dark mode consistency
 *    - Proper contrast and readability
 * 
 * 5. Type Safety:
 *    - Full TypeScript support
 *    - IntelliSense for all filter options
 * 
 * Usage Examples:
 * 
 * // Basic usage
 * const { data, loading, filters, setSearch } = useAdminFilters('/api/admin/users')
 * 
 * // With custom options
 * const { data, loading, filters, setStatus } = useAdminFilters('/api/admin/orders', {
 *   statusOptions: [
 *     { value: 'pending', label: 'Pending' },
 *     { value: 'completed', label: 'Completed' }
 *   ],
 *   enableDateRange: true,
 *   defaultSort: 'createdAt-desc'
 * })
 * 
 * // Manual filter updates
 * updateFilters({ search: 'john', status: 'active' })
 * 
 * // Reset all filters
 * resetFilters()
 */
