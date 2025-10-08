'use client'

import UnifiedNavbar from "@/components/ui/unified-navbar"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
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
