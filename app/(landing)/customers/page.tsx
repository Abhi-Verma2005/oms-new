'use client'

import Image from 'next/image'
import Link from 'next/link'
import Particles from '../../../components/particles'
import Customers from '../../../components/customers'
import Cta from '../../../components/cta'
import LandingFooter from '../../../components/landing-footer'
import InsightsSection from '../../../components/insights-section'

export default function CustomersPage() {
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
                  Our Customers
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                See what our customers are saying about their experience with our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200"
                >
                  Join Our Customers
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

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">10K+</div>
                <div className="text-gray-600 dark:text-gray-300">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
                <div className="text-gray-600 dark:text-gray-300">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600 dark:text-gray-300">Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-600 dark:text-gray-300">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Testimonials */}
        <Customers />

        {/* Insights Section */}
        <InsightsSection />

        {/* CTA Section */}
        <Cta />
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
