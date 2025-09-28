'use client'

import Particles from '@/components/particles'
import PricingFeatures from '../../../components/pricing-features'
import PricingCards from '../../../components/pricing-cards'
import PricingFaqs from '../../../components/pricing-faqs'
import PricingCta from '../../../components/pricing-cta'
import LandingFooter from '../../../components/landing-footer'

export default function PricingPage() {
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
                  Simple, transparent pricing
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the perfect plan for your outreach needs. No hidden fees, no surprises.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Features Section */}
        <PricingFeatures />

        {/* FAQ Section */}
        <PricingFaqs />

        {/* CTA Section */}
        <PricingCta />
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}