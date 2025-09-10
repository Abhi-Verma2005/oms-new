'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearch } from '@/hooks/use-search'
import { searchCategories, type SearchItem } from '@/lib/search-data'
import { 
  Search, 
  LayoutDashboard, 
  BarChart3, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Shield, 
  File, 
  Star,
  User,
  Bell,
  AppWindow,
  Key,
  Bot,
  Users,
  Receipt,
  FileText
} from 'lucide-react'

const iconMap = {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Shield,
  File,
  Star,
  User,
  Bell,
  AppWindow,
  Key,
  Bot,
  Users,
  Receipt,
  FileText
}

export default function SearchDemo() {
  const { data: session } = useSession()
  const userRoles = (session?.user as any)?.roles || []
  const isAdmin = (session?.user as any)?.isAdmin || false
  
  const { query, setQuery, results, isLoading, error } = useSearch({
    debounceMs: 200,
    minQueryLength: 1,
    maxResults: 20,
    userRoles,
    isAdmin
  })

  const getIcon = (iconName?: string) => {
    if (!iconName || !(iconName in iconMap)) return Search
    return iconMap[iconName as keyof typeof iconMap]
  }

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Search System Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Try searching for pages, features, or any content in the app
          </p>
          
          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search anything... (try 'dashboard', 'admin', 'settings')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘K</kbd> or <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+K</kbd> to open search modal
          </p>
        </div>

        {/* Search Results */}
        <div className="space-y-8">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Searching...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {query && !isLoading && !error && (
            <>
              {results.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Search Results
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {results.length} result{results.length !== 1 ? 's' : ''} found
                    </span>
                  </div>

                  {Object.entries(groupedResults).map(([category, items]) => {
                    const categoryInfo = searchCategories[category as keyof typeof searchCategories]
                    const IconComponent = getIcon(categoryInfo?.icon)
                    
                    return (
                      <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-violet-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {categoryInfo?.label || category}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {items.length} item{items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="grid gap-3">
                            {items.map((item) => {
                              const ItemIcon = getIcon(item.icon)
                              
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                  <ItemIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {item.href}
                                      </span>
                                      {item.isActive !== undefined && (
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          item.isActive 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                          {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try searching for different keywords or check your spelling
                  </p>
                </div>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start searching
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Type in the search box above to find pages, features, and content
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {Object.entries(searchCategories).map(([key, category]) => {
                  const IconComponent = getIcon(category.icon)
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <IconComponent className="h-5 w-5 text-violet-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
