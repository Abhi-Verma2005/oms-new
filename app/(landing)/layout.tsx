'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar"
import NavbarDropdown, { NavbarDropdownItem, NavbarDropdownSection } from "@/components/navbar-dropdown"
import { useAuthStore } from "@/stores/auth-store"
import ThemeToggle from "@/components/theme-toggle"
import LandingUserMenu from "@/components/landing-user-menu"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: "About", link: "/about" },
    { name: "Pricing", link: "/pricing" },
    { name: "Case Studies", link: "/case-studies" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Navigation */}
      <div className="relative flex flex-col">
        <Navbar className="fixed top-0 left-0 right-0 z-50 pr-2 sm:pr-0">
          <NavBody>
            <NavbarLogo />
            <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2">
              {navItems.map((item, idx) => (
                <a
                  key={`link-${idx}`}
                  href={item.link}
                  className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg"
                >
                  <span className="relative z-20">{item.name}</span>
                </a>
              ))}
              
              {/* Pages Dropdown - landing group only */}
              <NavbarDropdown
                title="Pages"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
                className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg"
              >
                <NavbarDropdownSection title="Landing">
                  <NavbarDropdownItem href="/about">About</NavbarDropdownItem>
                  <NavbarDropdownItem href="/pricing">Pricing</NavbarDropdownItem>
                  <NavbarDropdownItem href="/integrations">Integrations</NavbarDropdownItem>
                  <NavbarDropdownItem href="/customers">Customers</NavbarDropdownItem>
                  <NavbarDropdownItem href="/changelog">Changelog</NavbarDropdownItem>
                  <NavbarDropdownItem href="/faq">FAQ</NavbarDropdownItem>
                  <NavbarDropdownItem href="/features">Features</NavbarDropdownItem>
                </NavbarDropdownSection>
              </NavbarDropdown>
              
              <div className="ml-4">
                <ThemeToggle />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Show Case Studies shortcut on small screens */}
              <Link href="/case-studies" className="lg:hidden text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md">
                Case Studies
              </Link>
              <LandingUserMenu align="right" />
              <div className="relative">
                <NavbarButton variant="primary" href="/publishers">App</NavbarButton>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
              </div>
            </div>
          </NavBody>

          <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="mr-2">
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

            <MobileNavMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            >
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 py-2"
                >
                  <span className="block">{item.name}</span>
                </a>
              ))}
              
              {/* Mobile Pages Section - landing only */}
              <div className="w-full pt-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Pages
                </div>
                <div className="space-y-1">
                  <a href="/case-studies" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    Case Studies
                  </a>
                  <a href="/integrations" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    Integrations
                  </a>
                  <a href="/customers" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    Customers
                  </a>
                  <a href="/changelog" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    Changelog
                  </a>
                  <a href="/faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    FAQ
                  </a>
                  <a href="/features" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                    Features
                  </a>
                </div>
              </div>
              
              <div className="flex w-full flex-col gap-3 pt-2">
                <div className="flex items-center justify-center py-2">
                  <ThemeToggle />
                </div>
                <div className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <LandingUserMenu align="right" />
                </div>
                <div className="relative">
                  <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full"
                    href="/publishers"
                  >
                    App
                  </NavbarButton>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
                </div>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>
      </div>

      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  )
}
