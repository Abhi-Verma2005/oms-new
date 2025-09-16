'use client'

import Link from 'next/link'
import Logo from '@/components/ui/logo'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 border-t border-gray-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/60">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">Made with love by the Mosaic team.</span>
            </div>
            <nav className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200">Terms of Use</Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200">Privacy Policy</Link>
              <Link href="/api-docs" className="hover:text-gray-900 dark:hover:text-gray-200">API Docs</Link>
            </nav>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Copyright © {year} Outreach Mosaic. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}


