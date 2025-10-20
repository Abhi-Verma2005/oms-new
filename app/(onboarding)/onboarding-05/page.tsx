"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import OnboardingHeader from '../onboarding-header'
import OnboardingImage from '../onboarding-image'
import OnboardingProgress from '../onboarding-progress'

export default function Onboarding05() {
  const [companyName, setCompanyName] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/user/onboarding-profile', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCompanyName(data?.companyName || null)
        }
      } catch {}
    })()
  }, [])
  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative flex">

        {/* Content */}
        <div className="w-full md:w-1/2">

          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <div className="flex-1">

              <OnboardingHeader />
              <OnboardingProgress step={5} />

            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <div className="text-center">
                  <svg className="inline-flex w-16 h-16 fill-current mb-6" viewBox="0 0 64 64">
                    <circle className="text-green-500/20" cx="32" cy="32" r="32" />
                    <path className="text-green-700" d="M37.22 26.375a1 1 0 1 1 1.56 1.25l-8 10a1 1 0 0 1-1.487.082l-4-4a1 1 0 0 1 1.414-1.414l3.21 3.21 7.302-9.128Z" />
                  </svg>
                  <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-8">Welcome{companyName ? `, ${companyName}` : ''}! 🎉</h1>
                  <div className="flex items-center justify-center space-x-4">
                    <Link className="btn bg-violet-600 text-white hover:bg-violet-500" href="/publishers">Get Started</Link>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        <OnboardingImage />

      </div>

    </main>
  )
}


