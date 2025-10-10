'use client'

import { useEffect, useState } from 'react'
import Particles from '@/components/particles'
import PricingFeatures from '../../../components/pricing-features'
import PricingCards from '../../../components/pricing-cards'
import PricingFaqs from '../../../components/pricing-faqs'
import PricingCta from '../../../components/pricing-cta'
import LandingFooter from '../../../components/landing-footer'
import { motion } from 'framer-motion'

export default function PricingPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    
    // Check immediately and on resize
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Optimized animations for mobile - ensure content is visible
  const containerFade = {
    hidden: { opacity: isMobile ? 1 : 0, y: isMobile ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: isMobile ? 0.2 : 0.4, ease: "easeOut" } }
  }

  const itemFade = {
    hidden: { opacity: isMobile ? 1 : 0, y: isMobile ? 0 : 6 },
    show: { opacity: 1, y: 0, transition: { duration: isMobile ? 0.1 : 0.3, ease: "easeOut" } }
  }

  const sectionReveal = {
    hidden: { opacity: isMobile ? 1 : 0, y: isMobile ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: isMobile ? 0.2 : 0.4, ease: "easeOut" } }
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      {/* CSS fallback to ensure content is visible on mobile */}
      <style jsx>{`
        @media (max-width: 768px) {
          [data-framer-motion] {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>
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
        <section className="relative py-16 sm:py-20 lg:py-24 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 overflow-visible">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-[20rem] sm:w-[28rem] h-[20rem] sm:h-[28rem] -mt-16 sm:-mt-32 blur-sm opacity-80">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={25} />
          </div>
          {/* Background glow for hero */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[40rem] lg:w-[50rem] h-[30rem] sm:h-[40rem] lg:h-[50rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: isMobile ? '-20px' : '-40px', amount: isMobile ? 0.1 : 0.3 }}
              className="text-center pb-8 sm:pb-12"
            >
              <motion.h1 variants={containerFade} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                  Simple, transparent pricing
                </span>
              </motion.h1>
              <motion.p variants={itemFade} className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
                Choose the perfect plan for your outreach needs. No hidden fees, no surprises.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: isMobile ? '-10px' : '-40px', amount: isMobile ? 0.1 : 0.2 }}
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
          viewport={{ once: true, margin: isMobile ? '-10px' : '-40px', amount: isMobile ? 0.1 : 0.2 }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[40rem] lg:w-[46rem] h-[30rem] sm:h-[40rem] lg:h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingFeatures />
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: isMobile ? '-10px' : '-40px', amount: isMobile ? 0.1 : 0.2 }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[40rem] lg:w-[44rem] h-[30rem] sm:h-[40rem] lg:h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <PricingFaqs />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: isMobile ? '-10px' : '-40px', amount: isMobile ? 0.1 : 0.2 }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[28rem] sm:w-[36rem] lg:w-[42rem] h-[28rem] sm:h-[36rem] lg:h-[42rem] blur-3xl opacity-70 dark:opacity-60"
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