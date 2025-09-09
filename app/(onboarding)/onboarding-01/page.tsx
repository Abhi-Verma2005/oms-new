export const metadata = {
  title: "Tell us what's your situation - Mosaic",
  description: 'Page description',
}

import Link from 'next/link'
import Step1Form from './Step1Form'
import OnboardingHeader from '../onboarding-header'
import OnboardingImage from '../onboarding-image'
import OnboardingProgress from '../onboarding-progress'

export default function Onboarding01() {
  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative flex">

        {/* Content */}
        <div className="w-full md:w-1/2">

          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <div className="flex-1">

              <OnboardingHeader />
              <OnboardingProgress step={1} />

            </div>

            <div className="px-4 py-8">
              <div className="max-w-md mx-auto">

                <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Tell us what's your situation</h1>
                {/* Form */}
                <Step1Form />

              </div>
            </div>

          </div>

        </div>

        <OnboardingImage />

      </div>

    </main>
  )
}
