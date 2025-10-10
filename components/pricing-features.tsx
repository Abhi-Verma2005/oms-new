'use client'

import Image from 'next/image'
import Particles from './particles'

export default function PricingFeatures() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
      {/* Particles animation */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-48 sm:w-64 h-48 sm:h-64 -mt-16 sm:-mt-24">
        <Particles className="absolute inset-0 -z-10" quantity={4} staticity={30} />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center pb-8 sm:pb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Stop overpaying for software
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
            There are many variations available, but the majority have suffered alteration in some form, by injected humour.
          </p>
        </div>

        {/* Features list */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card #1 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Purpose-built for company that requires more than a <strong className="text-gray-900 dark:text-white font-medium">simple plan</strong> with security infrastructure.
              </p>
            </div>
          </div>

          {/* Card #2 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                AI-powered to <strong className="text-gray-900 dark:text-white font-medium">remove the burdens</strong> of tedious knowledge management and security tasks.
              </p>
            </div>
          </div>

          {/* Card #3 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                There's no prioritized support in Mosaic. You can use email or live chat and you will hear back in a <strong className="text-gray-900 dark:text-white font-medium">couple of hours</strong>.
              </p>
            </div>
          </div>

          {/* Card #4 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Comprehensive <strong className="text-gray-900 dark:text-white font-medium">developer docs</strong> and a centralized support center packed many resources.
              </p>
            </div>
          </div>

          {/* Card #5 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                No upcharges—and we'd never upsell you to a higher plan or a <strong className="text-gray-900 dark:text-white font-medium">dedicated IP</strong> to improve deliverability.
              </p>
            </div>
          </div>

          {/* Card #6 */}
          <div className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4 h-full">
              <svg className="shrink-0 mt-1" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path className="fill-purple-500" fillOpacity=".24" d="M10 0C4.5 0 0 4.5 0 10s4.5 10 10 10 10-4.5 10-10S15.5 0 10 0Z" />
                <path className="fill-purple-400" fillRule="nonzero" d="M13 6.586 14.414 8l-5.747 5.748-3.081-3.081L7 9.252l1.667 1.667z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Tool training, dedicated resources, and <strong className="text-gray-900 dark:text-white font-medium">regular updates</strong> are available for both small and large teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
