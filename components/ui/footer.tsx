'use client'

import Link from 'next/link'
import Logo from '@/components/ui/logo'
import { Linkedin, Facebook, Instagram, Twitter, Phone } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 w-full border-t border-gray-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-6 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo />
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">Made with love by the Mosaic team.</span>
              </div>
              <nav className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200">Terms of Use</Link>
                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200">Privacy Policy</Link>
                <Link href="/api-docs" className="hover:text-gray-900 dark:hover:text-gray-200">API Docs</Link>
              </nav>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800" />
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 py-3">
              <div>Copyright © {year} Outreach Mosaic. All rights reserved.</div>
              <div className="flex items-center gap-4 pr-16 md:pr-24">
                <a
                  href="https://www.linkedin.com/company/emiactech/"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/EMIACTech"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/emiactech/"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://x.com/emiactech"
                  aria-label="Twitter/X"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  title="X (Twitter)"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://api.whatsapp.com/send/?phone=919119391191&text=Hey%21+I%27m+interested+in+the+services+of+your+agency.+Shall+we+proceed%3F&type=phone_number&app_absent=0"
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  title="WhatsApp"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
      </div>
    </footer>
  )
}


