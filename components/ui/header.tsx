'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAppProvider } from '@/app/app-provider'

import SearchModal from '@/components/search-modal'
import Notifications from '@/components/dropdown-notifications'
import DropdownHelp from '@/components/dropdown-help'
import UserMenu from '@/components/user-menu'
import { AIChatbot } from '@/components/ai-chatbot'
import { useCart } from '@/contexts/cart-context'
import CartModal from '@/components/cart-modal'
import NavbarDropdown, { NavbarDropdownItem, NavbarDropdownSection } from '@/components/navbar-dropdown'
import Logo from '@/components/ui/logo'
import Link from 'next/link'
import { Search, ShoppingCart, LayoutDashboard, Users, ShoppingBag, Inbox, Calendar, Settings, Wrench } from 'lucide-react'

export default function Header({
  variant = 'default',
}: {
  variant?: 'default' | 'v2' | 'v3'
}) {

  const { sidebarOpen, setSidebarOpen } = useAppProvider()
  const { getTotalItems, toggleCart } = useCart()
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [showCreditHint, setShowCreditHint] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-close mobile header menu on route/query change
  useEffect(() => {
    if (!isClient) return
    if (mobileMenuOpen) setMobileMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/credits', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) setCredits(typeof data.credits === 'number' ? data.credits : null)
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => { active = false; clearInterval(id) }
  }, [])

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchModalOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isClient) return

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen) {
        const target = event.target as Element
        if (!target.closest('[data-mobile-menu]')) {
          setMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen, isClient])

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-sm lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex items-center space-x-1">
            {/* Mobile menu button */}
            {isClient && (
              <button
                data-mobile-menu=""
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 active:scale-95 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 shadow-xs"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
              <span className="sr-only">Open mobile menu</span>
                <svg className="w-6 h-6 fill-current transition-transform duration-150 will-change-transform group-active:scale-90" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="5" width="16" height="2" />
                  <rect x="4" y="11" width="16" height="2" />
                  <rect x="4" y="17" width="16" height="2" />
                </svg>
              </button>
            )}

            {/* Logo */}
            <Logo href="/publishers" />

            {/* Navigation Menu - Hidden on mobile, shown on desktop */}
            <nav className="hidden lg:flex items-center space-x-1 ml-6">
              <NavbarDropdown
                title="Dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                href="/dashboard"
              />

              <NavbarDropdown
                title="Publishers"
                icon={<Users className="w-4 h-4" />}
                href="/publishers"
              />

              <NavbarDropdown
                title="E-Commerce"
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                <NavbarDropdownItem href="/orders">
                  Orders
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/ecommerce/invoices">
                  Invoices
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/ecommerce/shop-2">
                  Shop 2
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/ecommerce/link-building-packages">
                  Link Building Packages
                </NavbarDropdownItem>
              </NavbarDropdown>

              <NavbarDropdown
                title="Inbox"
                icon={<Inbox className="w-4 h-4" />}
                href="/inbox"
              />

              <NavbarDropdown
                title="Calendar"
                icon={<Calendar className="w-4 h-4" />}
                href="/calendar"
              />

              <NavbarDropdown
                title="Settings"
                icon={<Settings className="w-4 h-4" />}
              >
                <NavbarDropdownItem href="/settings/account">
                  My Account
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/settings/notifications">
                  My Notifications
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/settings/apps">
                  Connected Apps
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/settings/plans">
                  Plans
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/settings/billing">
                  Billing & Invoices
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/settings/feedback">
                  Give Feedback
                </NavbarDropdownItem>
              </NavbarDropdown>

              <NavbarDropdown
                title="Utility"
                icon={<Wrench className="w-4 h-4" />}
              >
                <NavbarDropdownItem href="/utility/changelog">
                  Changelog
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/utility/roadmap">
                  Roadmap
                </NavbarDropdownItem>
                <NavbarDropdownItem href="/utility/faqs">
                  FAQs
                </NavbarDropdownItem>
              </NavbarDropdown>
            </nav>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-2 sm:space-x-3 relative z-30">
            {/* Credits Display */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowCreditHint(true)}
                onMouseLeave={() => setShowCreditHint(false)}
                className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-violet-300 text-sm text-gray-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-gray-200 dark:hover:bg-violet-500/10 transition-colors"
                title="Daily credits"
              >
                Credits: {credits ?? '—'}
              </button>
              {showCreditHint && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-700/60 shadow-xl">
                  <div className="font-semibold mb-1">How credits work</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>50 credits added daily.</li>
                    <li>Revealing a website costs 1 credit.</li>
                    <li>Credits reset every day.</li>
                  </ul>
                </div>
              )}
            </div>
            {/* Book a call button (compact) */}
            <a href="https://cal.com/emiactech/30min" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors" title="Book a call (coming soon)">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a1 1 0 0 1 1 .75l1 3a1 1 0 0 1-.27 1L9.91 9.09a16 16 0 0 0 5 5l1.34-1.91a1 1 0 0 1 1-.27l3 1a1 1 0 0 1 .75 1z"/>
              </svg>
              Book a call
            </a>
            <div className="relative group">
              <button
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ${searchModalOpen && 'bg-gray-200 dark:bg-gray-800'}`}
                onClick={() => { setSearchModalOpen(true) }}
                title="Search (⌘K)"
              >
                <span className="sr-only">Search</span>
                <Search className="h-4 w-4 text-gray-500/80 dark:text-gray-400/80" />
              </button>
              
              {/* Keyboard shortcut hint (positioned below to avoid browser chrome clipping) */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900/95 dark:bg-gray-700/95 text-white dark:text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-40">
                ⌘K
              </div>
              
              <SearchModal isOpen={searchModalOpen} setIsOpen={setSearchModalOpen} />
            </div>
            
            {/* Cart Button */}
            <div className="relative">
              <button
                onClick={toggleCart}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full relative"
                title="Shopping Cart"
              >
                <span className="sr-only">Shopping Cart</span>
                <ShoppingCart className="h-4 w-4 text-gray-500/80 dark:text-gray-400/80" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              {/* Cart Modal positioned relative to this button */}
              <CartModal />
            </div>
            <Notifications align="right" />
            <DropdownHelp align="right" />
            {/*  Divider */}
            <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />
            <UserMenu align="right" />

          </div>

        </div>
      </div>
      
      {/* Mobile Menu */}
      {isClient && mobileMenuOpen && (
        <div data-mobile-menu="" className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/60 shadow-lg z-40">
          <div className="px-4 py-4 space-y-2">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Pages
              </div>
              <Link href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Dashboard
              </Link>
              <Link href="/publishers" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Publishers
              </Link>
              <Link href="/orders" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Orders
              </Link>
              <Link href="/ecommerce/invoices" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Invoices
              </Link>
              <Link href="/ecommerce/shop-2" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Shop 2
              </Link>
              <Link href="/ecommerce/link-building-packages" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Link Building Packages
              </Link>
              <Link href="/inbox" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Inbox
              </Link>
              <Link href="/calendar" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Calendar
              </Link>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Settings
              </div>
              <Link href="/settings/account" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                My Account
              </Link>
              <Link href="/settings/notifications" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                My Notifications
              </Link>
              <Link href="/settings/apps" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Connected Apps
              </Link>
              <Link href="/settings/plans" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Plans
              </Link>
              <Link href="/settings/billing" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Billing & Invoices
              </Link>
              <Link href="/settings/feedback" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Give Feedback
              </Link>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Utility
              </div>
              <Link href="/utility/changelog" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Changelog
              </Link>
              <Link href="/utility/roadmap" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                Roadmap
              </Link>
              <Link href="/utility/faqs" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                FAQs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot (kept for pages that explicitly open it) */}
      <AIChatbot isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} />
    </header>
  )
}
