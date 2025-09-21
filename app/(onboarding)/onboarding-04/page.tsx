"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import OnboardingHeader from '../onboarding-header'
import OnboardingImage from '../onboarding-image'
import OnboardingProgress from '../onboarding-progress'
import Step4Form from './Step4Form'

export default function Onboarding04() {
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
              <OnboardingProgress step={4} />

            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Tell us more about your future campaigns</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">All fields are optional. This helps us tailor recommendations.</p>
                <Step4Form />

              </div>
            </div>

          </div>

        </div>

        <OnboardingImage />

      </div>

    </main>
  )
}
