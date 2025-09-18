'use client'

import Logo from '@/components/ui/logo'
import { Linkedin, Facebook, Instagram, Twitter, Phone } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-16 w-full border-t border-gray-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-900/70">
      <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col gap-4 py-6 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/images/logo.png" alt="Logo" width={100} height={100} />
              </div>
              <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                © Copyright 2017–{year}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification purposes only.
            </div>
            <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-500 py-3">
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


