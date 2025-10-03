'use client'

import UnifiedNavbar from "@/components/ui/unified-navbar"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Navigation */}
      <div className="relative flex flex-col">
        <UnifiedNavbar variant="landing" />
      </div>

      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-20">
        {children}
      </div>
    </div>
  )
}
