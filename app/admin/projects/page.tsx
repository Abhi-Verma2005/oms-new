'use client'

import { useAdminFilters } from '@/hooks/use-admin-filters'
import { Suspense, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AdminLayout } from '@/components/admin/admin-layout'

type ProjectRow = {
  id: string
  name: string
  domain: string
  avgTraffic: number | null
  domainRating: number | null
  createdAt: string
  _count?: { competitors: number }
  user?: { id: string; email: string }
}

function AdminProjectsInner() {
  const {
    data,
    loading,
    pagination,
    filters,
    setSearch,
    setSorting,
    handlePageChange,
    updateFilters,
  } = useAdminFilters('/api/admin/projects', {
    searchPlaceholder: 'Search by name or domain…',
    sortOptions: [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
    ],
    defaultSort: 'createdAt-desc',
    defaultLimit: 20,
  })

  // Load last-used filters for this page from SavedView on mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await fetch('/api/views?projectId=individual', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        const views = Array.isArray(json?.views) ? json.views : []
        const name = 'admin-projects:last-used'
        const saved = views.find((v: any) => v.name === name)
        const savedFilters = saved?.filters || {}

        if (savedFilters) {
          if (typeof savedFilters.search === 'string') {
            setSearch(savedFilters.search)
          }
          if (savedFilters.sortBy || savedFilters.sortOrder) {
            setSorting(savedFilters.sortBy || 'createdAt', savedFilters.sortOrder || 'desc')
          }
          if (typeof savedFilters.limit === 'number') {
            updateFilters({ limit: savedFilters.limit }, true)
          }
          if (typeof savedFilters.page === 'number' && savedFilters.page > 1) {
            handlePageChange(savedFilters.page)
          }
        }
      } catch (_) {
        // ignore
      }
    }
    loadSaved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist filters to SavedView whenever filters change (debounced)
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    const payload = {
      name: 'admin-projects:last-used',
      filters: {
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page,
        limit: filters.limit,
      },
    }

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(() => {
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, projectId: 'individual' }),
      }).catch(() => {})
    }, 400)

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    }
  }, [filters.search, filters.sortBy, filters.sortOrder, filters.page, filters.limit])

  const projects = (data as ProjectRow[]) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search by name or domain…"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">Competitors</th>
                  <th className="py-2 pr-4">Avg Traffic</th>
                  <th className="py-2 pr-4">DR</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{p.name || p.domain}</div>
                      <div className="text-xs text-gray-500">{p.domain}</div>
                    </td>
                    <td className="py-2 pr-4">{p.user?.email || '-'}</td>
                    <td className="py-2 pr-4">{p._count?.competitors ?? 0}</td>
                    <td className="py-2 pr-4">{p.avgTraffic ?? '–'}</td>
                    <td className="py-2 pr-4">{p.domainRating ?? '–'}</td>
                    <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {projects.length === 0 && !loading && (
                  <tr>
                    <td className="py-6 text-center text-gray-500 dark:text-gray-400" colSpan={6}>No projects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
              <div>
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn px-3 py-1 bg-white border border-gray-200 dark:bg-gray-800 dark:border-white/10"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Prev
                </button>
                <button
                  className="btn px-3 py-1 bg-white border border-gray-200 dark:bg-gray-800 dark:border-white/10"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminProjectsPage() {
  return (
    <AdminLayout>
      <Suspense fallback={<div className="p-6 text-gray-500">Loading projects…</div>}>
        <AdminProjectsInner />
      </Suspense>
    </AdminLayout>
  )
}


