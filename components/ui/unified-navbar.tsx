'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

interface UnifiedNavbarProps {
  variant?: 'landing' | 'app' | 'admin'
}

export default function UnifiedNavbar({ variant = 'landing' }: UnifiedNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const pathname = usePathname()

  // Define all available routes
  const allRoutes = {
    landing: [
      { name: "Home", link: "/" },
      { name: "About", link: "/about" },
      { name: "Features", link: "/features" },
      { name: "Pricing", link: "/pricing" },
      { name: "Case Studies", link: "/case-studies" },
      { name: "Resources", link: "/resources" },
      { name: "Contact", link: "/contact" },
      { name: "FAQ", link: "/faq" },
    ],
    app: [
      { name: "Dashboard", link: "/dashboard" },
      { name: "Campaigns", link: "/campaigns" },
      { name: "Publishers", link: "/publishers" },
      { name: "Orders", link: "/orders" },
      { name: "Settings", link: "/settings" },
    ],
    admin: [
      { name: "Admin Dashboard", link: "/admin" },
      { name: "Users", link: "/admin/users" },
      { name: "Products", link: "/admin/products" },
      { name: "Orders", link: "/admin/orders" },
      { name: "Reviews", link: "/admin/reviews" },
    ]
  }

  // Get routes based on variant
  const routes = allRoutes[variant] || allRoutes.landing

  // Main navigation items (always visible)
  const mainNavItems = routes.slice(0, 4) // Show first 4 items as main nav
  const dropdownItems = routes.slice(4) // Rest go in dropdown

  // Check if current page is active
  const isActiveRoute = (link: string) => {
    if (link === '/') return pathname === '/'
    return pathname.startsWith(link)
  }

  return (
    <Navbar className="fixed top-0 left-0 right-0 z-50 pr-2 sm:pr-0">
      <NavBody>
        <NavbarLogo />
        
        {/* Desktop Navigation */}
        <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2">
          {mainNavItems.map((item, idx) => (
            <Link
              key={`main-nav-${idx}`}
              href={item.link}
              className={`relative px-4 py-2 rounded-lg transition-colors duration-200 ${
                isActiveRoute(item.link)
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <span className="relative z-20">
                {item.name}
              </span>
            </Link>
          ))}
          
          {/* Pages Dropdown */}
          {dropdownItems.length > 0 && (
            <NavbarDropdown
              title="Pages"
              icon={<span className="sr-only">dropdown</span>}
              className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg"
            >
              <NavbarDropdownSection title={variant === 'landing' ? 'Pages' : variant === 'app' ? 'App' : 'Admin'}>
                {dropdownItems.map((item, idx) => (
                  <NavbarDropdownItem key={`dropdown-${idx}`} href={item.link}>
                    {item.name}
                  </NavbarDropdownItem>
                ))}
              </NavbarDropdownSection>
            </NavbarDropdown>
          )}
          
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Quick access links for mobile */}
          {variant === 'landing' && (
            <>
              <Link href="/case-studies" className="lg:hidden text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md">
                Case Studies
              </Link>
              <Link href="/contact" className="lg:hidden text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2 rounded-md">
                Contact
              </Link>
            </>
          )}
          
          <LandingUserMenu align="right" />
          
          {/* App access button */}
          <div className="relative">
            <NavbarButton 
              variant="primary" 
              href={variant === 'landing' ? "/publishers" : "/dashboard"}
            >
              {variant === 'landing' ? 'App' : variant === 'app' ? 'Dashboard' : 'Admin'}
            </NavbarButton>
            {variant === 'landing' && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
            )}
          </div>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
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
          {/* Main navigation items */}
          {routes.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`relative py-2 px-3 rounded-lg transition-colors duration-200 ${
                isActiveRoute(item.link)
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Mobile theme toggle and user menu */}
          <div className="flex w-full flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                href={variant === 'landing' ? "/publishers" : "/dashboard"}
              >
                {variant === 'landing' ? 'App' : variant === 'app' ? 'Dashboard' : 'Admin'}
              </NavbarButton>
              {variant === 'landing' && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
              )}
            </div>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
