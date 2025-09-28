'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Linkedin, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react'

export default function LandingFooter() {
  const year = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Integrations', href: '/integrations' },
      { name: 'API', href: '/docs' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Customers', href: '/customers' },
      { name: 'Changelog', href: '/changelog' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Status', href: '/status' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
    ],
  }

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Mosaic Next logo"
                width={32}
                height={32}
                className="dark:hidden"
              />
              <Image
                src="/images/logo_dark_mode.png"
                alt="Mosaic Next logo"
                width={32}
                height={32}
                className="hidden dark:block"
              />
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Mosaic Next
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Build authority connections on real platforms, with real traffic, with real results. 
              Trusted by Fortune 500 companies and Silicon Valley startups.
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Stay updated
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://www.linkedin.com/company/emiactech/"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/EMIACTech"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/emiactech/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/emiactech"
                aria-label="Twitter/X"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
              © {year} Mosaic Next. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                All systems operational
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                support@mosaicnext.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
