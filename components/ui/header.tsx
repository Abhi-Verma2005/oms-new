'use client'

import { useState, useEffect } from 'react'
import { useAppProvider } from '@/app/app-provider'

import SearchModal from '@/components/search-modal'
import Notifications from '@/components/dropdown-notifications'
import DropdownHelp from '@/components/dropdown-help'
import ThemeToggle from '@/components/theme-toggle'
import UserMenu from '@/components/user-menu'
import { AIChatbot } from '@/components/ai-chatbot'
import Link from 'next/link'
import { Bot, Search } from 'lucide-react'

export default function Header({
  variant = 'default',
}: {
  variant?: 'default' | 'v2' | 'v3'
}) {

  const { sidebarOpen, setSidebarOpen } = useAppProvider()
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false)

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

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-sm lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex">

            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => { setSidebarOpen(!sidebarOpen) }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>

          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3 relative z-30">
            {/* Quick link to Publishers */}
            <Link href="/publishers" className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-violet-300 text-gray-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-gray-200 dark:hover:bg-violet-500/10">
              Publishers
            </Link>
            {/* AI Chatbot Button */}
            <button
              onClick={() => setChatbotOpen(!chatbotOpen)}
              className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg border border-violet-300 text-gray-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-gray-200 dark:hover:bg-violet-500/10 transition-colors"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </button>
            <div className="relative group">
              <button
                className={`w-8 h-8 flex items-center justify-center hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ml-3 ${searchModalOpen && 'bg-gray-200 dark:bg-gray-800'}`}
                onClick={() => { setSearchModalOpen(true) }}
                title="Search (⌘K)"
              >
                <span className="sr-only">Search</span>
                <Search className="h-4 w-4 text-gray-500/80 dark:text-gray-400/80" />
              </button>
              
              {/* Keyboard shortcut hint */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ⌘K
              </div>
              
              <SearchModal isOpen={searchModalOpen} setIsOpen={setSearchModalOpen} />
            </div>
            <Notifications align="right" />
            <DropdownHelp align="right" />
            <ThemeToggle />
            {/*  Divider */}
            <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />
            <UserMenu align="right" />

          </div>

        </div>
      </div>
      
      {/* AI Chatbot */}
      <AIChatbot isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} />
    </header>
  )
}
