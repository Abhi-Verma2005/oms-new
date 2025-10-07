'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppProvider } from '@/app/app-provider'
import { useSelectedLayoutSegments, usePathname } from 'next/navigation'
import { useWindowWidth } from '@/components/utils/use-window-width'
import SidebarLinkGroup from '@/components/ui/sidebar-link-group'
import SidebarLink from '@/components/ui/sidebar-link'
import Logo from '@/components/ui/logo'
import { Search, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function Sidebar() {
  const sidebar = useRef<HTMLDivElement>(null)
  const { sidebarOpen, setSidebarOpen, sidebarExpanded, setSidebarExpanded } = useAppProvider()
  const segments = useSelectedLayoutSegments() || []
  const pathname = usePathname()
  const breakpoint = useWindowWidth()
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Fix hydration by ensuring expandOnly is only true on client
  const expandOnly = isClient && !sidebarExpanded && breakpoint && (breakpoint >= 1024 && breakpoint < 1536)

  // Navigation items data structure
  const navigationItems = [
    {
      category: 'Overview',
      items: [
        { name: 'Dashboard', href: '/admin', icon: 'dashboard' }
      ]
    },
    {
      category: 'User Management',
      items: [
        { name: 'Users', href: '/admin/users', icon: 'users' },
        { name: 'Roles', href: '/admin/roles', icon: 'roles' },
        { name: 'Permissions', href: '/admin/permissions', icon: 'permissions' },
        { name: 'User Roles', href: '/admin/user-roles', icon: 'user-roles' },
        { name: 'User Activities', href: '/admin/activities', icon: 'activities' }
      ]
    },
    {
      category: 'Product Management',
      items: [
        { name: 'Products', href: '/admin/products', icon: 'products' },
        { name: 'Reviews', href: '/admin/reviews', icon: 'reviews' },
        { name: 'Wishlists', href: '/admin/wishlists', icon: 'wishlists' }
      ]
    },
    {
      category: 'System Management',
      items: [
        { name: 'Notifications', href: '/admin/notifications', icon: 'notifications' },
        { name: 'Notification Types', href: '/admin/notification-types', icon: 'notification-types' },
        { name: 'Search Interests', href: '/admin/search-interests', icon: 'search-interests' },
        { name: 'AI Chatbot', href: '/admin/ai-chatbot', icon: 'ai-chatbot' }
      ]
    },
    {
      category: 'Business Operations',
      items: [
        { name: 'Orders', href: '/admin/orders', icon: 'orders' },
        { name: 'Bonus System', href: '/admin/bonus', icon: 'bonus' },
        { name: 'Feedback', href: '/admin/feedback', icon: 'feedback' },
        { name: 'Changelog', href: '/admin/changelog', icon: 'changelog' }
      ]
    },
    {
      category: 'Content Management',
      items: [
        { name: 'Tags', href: '/admin/tags', icon: 'tags' }
      ]
    }
  ]

  // Filter navigation items based on search query
  const filteredNavigationItems = searchQuery.trim() === '' 
    ? navigationItems 
    : navigationItems.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0)

  // Get icon component based on icon name
  const getIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `shrink-0 w-5 h-5 lg:w-6 lg:h-6 fill-current ${isActive ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}`
    
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
            <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
          </svg>
        )
      case 'users':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        )
      case 'roles':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      case 'permissions':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )
      case 'user-roles':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        )
      case 'activities':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        )
      case 'products':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7ZM9 8H15V10H9V8ZM9 12H15V14H9V12Z"/>
          </svg>
        )
      case 'reviews':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      case 'wishlists':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        )
      case 'notifications':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h6v2H4v14zM14 4h2a2 2 0 012 2v4h-2V6h-2v2h-2V6a2 2 0 012-2z"/>
          </svg>
        )
      case 'notification-types':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M15 17h5l-5 5v-5zM4 19h6v2H4a2 2 0 01-2-2V5a2 2 0 012-2h6v2H4v14zM14 4h2a2 2 0 012 2v4h-2V6h-2v2h-2V6a2 2 0 012-2z"/>
          </svg>
        )
      case 'search-interests':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        )
      case 'ai-chatbot':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )
      case 'orders':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7ZM9 8H15V10H9V8ZM9 12H15V14H9V12Z"/>
          </svg>
        )
      case 'bonus':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      case 'feedback':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        )
      case 'changelog':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
          </svg>
        )
      case 'tags':
        return (
          <svg className={iconClass} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      default:
        return null
    }
  }
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-close sidebar on route change (any viewport)
  useEffect(() => {
    if (!isClient) return
    if (sidebarOpen) setSidebarOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }): void => {
      if (!sidebar.current) return
      if (!sidebarOpen || sidebar.current.contains(target as Node)) return
      setSidebarOpen(false)
    }
    document.addEventListener('click', clickHandler)
    return () => document.removeEventListener('click', clickHandler)
  })

  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }): void => {
      if (!sidebarOpen || keyCode !== 27) return
      setSidebarOpen(false)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  })

  return (
    <div className={`min-w-fit ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
      <div
        className={`fixed inset-0 bg-gray-900/30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      ></div>

      <div
        id="sidebar"
        ref={sidebar}
        className={`flex lg:!flex flex-col absolute z-40 left-0 top-0 lg:sticky lg:top-0 lg:h-screen lg:left-auto lg:translate-x-0 h-[100dvh] overflow-hidden w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-white dark:bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        } rounded-r-2xl shadow-xs`}
      >
        <div className="mb-10 pr-3 sm:px-2">
          {/* Logo + Toggle: conditional layout */}
          {(breakpoint && breakpoint >= 1024 && !sidebarExpanded) ? (
            <div>
              <div className="flex items-center justify-center mb-2">
                <Logo href="/admin" />
              </div>
              <div className="flex items-center justify-center">
                <button
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 active:scale-95 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 shadow-xs"
                  onClick={() => setSidebarExpanded(true)}
                  aria-controls="sidebar"
                  aria-expanded={false}
                  title="Expand sidebar"
                >
                  <span className="sr-only">Expand sidebar</span>
                  <svg className="shrink-0 fill-current text-gray-400 dark:text-gray-500 transition-transform duration-200 ease-out" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Logo href="/admin" />
              </div>
              <button
                className="inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 active:scale-95 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 shadow-xs"
                onClick={() => {
                  if (breakpoint && breakpoint < 1024) {
                    setSidebarOpen(!sidebarOpen)
                  } else {
                    setSidebarExpanded(!sidebarExpanded)
                  }
                }}
                aria-controls="sidebar"
                aria-expanded={breakpoint && breakpoint < 1024 ? sidebarOpen : sidebarExpanded}
                title={breakpoint && breakpoint < 1024 ? (sidebarOpen ? 'Close sidebar' : 'Open sidebar') : (sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar')}
              >
                <span className="sr-only">
                  {breakpoint && breakpoint < 1024 ? (sidebarOpen ? 'Close sidebar' : 'Open sidebar') : (sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar')}
                </span>
                {breakpoint && breakpoint < 1024 ? (
                  <svg className="w-6 h-6 fill-current transition-transform duration-150 will-change-transform group-active:scale-90" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
                  </svg>
                ) : (
                  <svg className={`shrink-0 fill-current text-gray-400 dark:text-gray-500 ${sidebarExpanded ? 'rotate-180' : ''} transition-transform duration-200 ease-out`} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 16a1 1 0 0 1-1-1V1a1 1 0 1 1 2 0v14a1 1 0 0 1-1 1ZM8.586 7H1a1 1 0 1 0 0 2h7.586l-2.793 2.793a1 1 0 1 0 1.414 1.414l4.5-4.5A.997.997 0 0 0 12 8.01M11.924 7.617a.997.997 0 0 0-.217-.324l-4.5-4.5a1 1 0 0 0-1.414 1.414L8.586 7M12 7.99a.996.996 0 0 0-.076-.373Z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
        {/* Search: icon-only on collapsed desktop, full input otherwise */}
        {(breakpoint && breakpoint >= 1024 && !sidebarExpanded) ? (
          <div className="mb-6 px-0 flex justify-center">
            <button
              type="button"
              title="Search"
              aria-label="Search"
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 active:scale-95 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 shadow-xs"
              onClick={() => {
                setSidebarExpanded(true)
                setTimeout(() => searchInputRef.current?.focus(), 0)
              }}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="mb-6 px-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full pl-10 pr-10 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors ${
                  isSearchFocused ? 'ring-2 ring-violet-500' : ''
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Back button below search */}
        <div className="px-3 mb-4">
          <Link
            href="/dashboard"
            className="flex h-10 items-center justify-center lg:justify-start rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="ml-2 text-sm font-medium hidden lg:sidebar-expanded:inline 2xl:inline">Back</span>
          </Link>
        </div>

        <div className="space-y-8">
          {filteredNavigationItems.map((category) => (
            <div key={category.category}>
            <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold pl-3">
              <span className="hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6" aria-hidden="true">
                •••
              </span>
                <span className="lg:hidden lg:sidebar-expanded:block 2xl:block">{category.category}</span>
            </h3>
            <ul className="mt-3">
                {category.items.map((item) => {
                  const isActive = segments.some(segment => item.href.includes(segment))
                  return (
                  <li 
                      key={item.href}
                      className={`pl-4 pr-3 lg:pl-0 lg:pr-0 lg:sidebar-expanded:pl-4 lg:sidebar-expanded:pr-3 py-2 rounded-lg mb-0.5 last:mb-0 transition-colors ${isActive ? 'bg-violet-500/10 dark:bg-violet-500/20 ring-1 ring-violet-500/20' : 'hover:bg-gray-100/60 dark:hover:bg-gray-700/40'}`} 
                      onClick={() => { if (!sidebarExpanded) setSidebarExpanded(true) }}
                    >
                      <SidebarLink href={item.href}>
                  <div className="flex w-full h-10 items-center lg:justify-center lg:sidebar-expanded:justify-start 2xl:justify-start gap-0 lg:sidebar-expanded:gap-3 2xl:gap-3">
                          {getIcon(item.icon, isActive)}
                          <span className={`text-sm font-medium whitespace-nowrap hidden lg:sidebar-expanded:inline 2xl:inline duration-200 ${isActive ? 'text-violet-600 dark:text-violet-300' : 'text-gray-700 dark:text-gray-200'}`}>{item.name}</span>
                  </div>
                </SidebarLink>
              </li>
                  )
                })}
            </ul>
          </div>
          ))}
          
          {/* No results message */}
          {searchQuery.trim() !== '' && filteredNavigationItems.length === 0 && (
            <div className="px-3 py-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                No navigation items found for "{searchQuery}"
                  </div>
                  </div>
          )}
          </div>
        </div>

      </div>
    </div>
  )
}
