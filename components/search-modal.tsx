'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
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
  FileText,
  Clock,
  ArrowRight,
  X
} from 'lucide-react'
import { searchItems, searchCategories, type SearchItem } from '@/lib/search-data'
import { useAIChatbot } from '@/components/ai-chatbot-provider'

interface SearchModalProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

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

export default function SearchModal({
  isOpen,
  setIsOpen
}: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentPages, setRecentPages] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const { openChatbot } = useAIChatbot()
  
  // Get user roles and admin status (stabilize references)
  const rolesFromSession = (session?.user as any)?.roles as string[] | undefined
  const userRoles = useMemo(() => rolesFromSession ?? [], [rolesFromSession])
  const isAdmin = Boolean((session?.user as any)?.isAdmin)

  // Load recent searches and pages from localStorage (mount only)
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recent-searches')
      const savedPages = localStorage.getItem('recent-pages')
      if (savedSearches) setRecentSearches(JSON.parse(savedSearches))
      if (savedPages) setRecentPages(JSON.parse(savedPages))
    } catch {}
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Search functionality
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchItems(query, userRoles, isAdmin)
      setResults(searchResults)
      setSelectedIndex(0)
    } else {
      setResults([])
    }
  }, [query, userRoles, isAdmin])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results.length > 0 && results[selectedIndex]) {
        handleItemClick(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleItemClick = (item: SearchItem) => {
    // Save to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecentSearches)
    localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches))

    // Save to recent pages
    const newRecentPages = [item, ...recentPages.filter(p => p.id !== item.id)].slice(0, 3)
    setRecentPages(newRecentPages)
    localStorage.setItem('recent-pages', JSON.stringify(newRecentPages))

    // Close modal first, then navigate
    setIsOpen(false)
    setQuery('')
    
    // Special handling for AI chatbot - open the chatbot instead of navigating
    if (item.id === 'ai-chatbot') {
      setTimeout(() => {
        openChatbot()
      }, 100)
      return
    }
    
    // Navigate after a short delay to ensure modal closes
    if (item.href !== '#') {
      setTimeout(() => {
        router.push(item.href)
      }, 100)
    }
  }

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }

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
    <Transition appear show={isOpen}>
      <Dialog as="div" onClose={() => setIsOpen(false)}>
        <TransitionChild
          as="div"
          className="fixed inset-0 bg-gray-900/30 z-50 transition-opacity"
          enter="transition ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-out duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          aria-hidden="true"
        />
        <TransitionChild
          as="div"
          className="fixed inset-0 z-50 overflow-hidden flex items-start top-20 mb-4 justify-center px-4 sm:px-6"
          enter="transition ease-in-out duration-200"
          enterFrom="opacity-0 translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in-out duration-200"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-4"
        >
          <DialogPanel className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700/60 overflow-auto max-w-2xl w-full max-h-[80vh] rounded-lg shadow-lg">
            {/* Search form */}
            <div className="border-b border-gray-200 dark:border-gray-700/60">
              <div className="relative">
                <label htmlFor="search-modal" className="sr-only">Search</label>
                <input 
                  ref={inputRef}
                  id="search-modal" 
                  className="w-full dark:text-gray-300 bg-white dark:bg-gray-800 border-0 focus:ring-transparent placeholder-gray-400 dark:placeholder-gray-500 appearance-none py-3 pl-10 pr-4" 
                  type="search" 
                  placeholder="Search anything..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute inset-0 flex items-center justify-center right-auto group pointer-events-none">
                  <Search className="shrink-0 text-gray-400 dark:text-gray-500 ml-4 mr-2 h-4 w-4" />
                </div>
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="py-4 px-2 max-h-[60vh] overflow-y-auto">
              {query ? (
                // Search results
                <div>
                  {results.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(groupedResults).map(([category, items]) => {
                        const categoryInfo = searchCategories[category as keyof typeof searchCategories]
                        const IconComponent = getIcon(categoryInfo?.icon)
                        
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2 px-2 py-1">
                              <IconComponent className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                                {categoryInfo?.label || category}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {items.map((item, index) => {
                                const globalIndex = results.indexOf(item)
                                const ItemIcon = getIcon(item.icon)
                                const isSelected = globalIndex === selectedIndex
                                
                                return (
                                  <li key={item.id}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleItemClick(item)
                                      }}
                                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                        isSelected 
                                          ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' 
                                          : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/20'
                                      }`}
                                    >
                                      <ItemIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.title}</div>
                                        {item.description && (
                                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {item.description}
                                          </div>
                                        )}
                                      </div>
                                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                    </div>
                  )}
                </div>
              ) : (
                // Recent searches and pages
                <div className="space-y-4">
                  {/* Recent searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                            Recent searches
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            clearRecentSearches()
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <li key={index}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleRecentSearchClick(search)
                              }}
                              className="w-full flex items-center gap-3 p-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg text-left"
                            >
                              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="truncate">{search}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recent pages */}
                  {recentPages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-2 mb-2">
                        <File className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                          Recent pages
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {recentPages.map((page) => {
                          const PageIcon = getIcon(page.icon)
                          return (
                            <li key={page.id}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleItemClick(page)
                                }}
                                className="w-full flex items-center gap-3 p-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg text-left"
                              >
                                <PageIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{page.title}</div>
                                  {page.description && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                      {page.description}
                                    </div>
                                  )}
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Quick access */}
                  <div>
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <Star className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
                        Quick access
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                        { title: 'Settings', href: '/settings/account', icon: Settings },
                        { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
                        { title: 'Publishers', href: '/publishers', icon: Users }
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsOpen(false)
                            setTimeout(() => {
                              router.push(item.href)
                            }, 100)
                          }}
                          className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/20 rounded-lg text-left"
                        >
                          <item.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
