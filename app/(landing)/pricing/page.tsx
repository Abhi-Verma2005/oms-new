'use client'

import Particles from '@/components/particles'
import PricingFeatures from '../../../components/pricing-features'
import PricingCards from '../../../components/pricing-cards'
import PricingFaqs from '../../../components/pricing-faqs'
import PricingCta from '../../../components/pricing-cta'
import LandingFooter from '../../../components/landing-footer'
import { motion } from 'framer-motion'

export default function PricingPage() {
  const containerFade = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const itemFade = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const sectionReveal = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      {/* Mosaic grid background (subtle) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(120,119,198,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,119,198,0.15) 1px, transparent 1px)'
            , backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-black/30" />
      </div>
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-visible">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-[28rem] h-[28rem] -mt-32 blur-sm opacity-80">
            <Particles className="absolute inset-0 -z-10" quantity={8} staticity={25} />
          </div>
          {/* Background glow for hero */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center pb-12"
            >
              <motion.h1 variants={containerFade} className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                  Simple, transparent pricing
                </span>
              </motion.h1>
              <motion.p variants={itemFade} className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the perfect plan for your outreach needs. No hidden fees, no surprises.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[10%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingCards />
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingFeatures />
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingFaqs />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingCta />
        </motion.section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}