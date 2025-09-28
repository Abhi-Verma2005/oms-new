'use client'

import Image from 'next/image'
import Link from 'next/link'
import Particles from '../../../components/particles'
import Features02 from '../../../components/features-02'
import Features03 from '../../../components/features-03'
import Features04 from '../../../components/features-04'
import Features05 from '../../../components/features-05'
import Cta from '../../../components/cta'
import LandingFooter from '../../../components/landing-footer'

export default function FeaturesPage() {
  const featureHighlights = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with our optimized infrastructure and smart caching."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Secure by Design",
      description: "Enterprise-grade security with end-to-end encryption and compliance with industry standards."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "User Friendly",
      description: "Intuitive interface designed for both beginners and power users with extensive customization options."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center pb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Discover the comprehensive set of features designed to streamline your workflow and boost productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200"
                >
                  Try Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {featureHighlights.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Sections */}
        <Features02 />
        <Features03 />
        <Features04 />
        <Features05 />

        {/* CTA Section */}
        <Cta />
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
