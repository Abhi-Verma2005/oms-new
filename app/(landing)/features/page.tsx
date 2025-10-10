'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, cubicBezier } from 'framer-motion'
import Particles from '../../../components/particles'
import Features02 from '../../../components/features-02'
import Features03 from '../../../components/features-03'
import Features04 from '../../../components/features-04'
import Features05 from '../../../components/features-05'
import Cta from '../../../components/cta'
import LandingFooter from '../../../components/landing-footer'

export default function FeaturesPage() {
  const easing = cubicBezier(0.22, 1, 0.36, 1)
  const containerFade = {
    hidden: { opacity: 0, y: 10 },
    show: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.04 * i, ease: easing }
    })
  }

  const staggerContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.09, delayChildren: 0.06 }
    }
  }

  const itemFade = {
    hidden: { opacity: 0, y: 8 },
    show: (i = 1) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.03 * i, ease: easing } })
  }

  const sectionReveal = {
    hidden: { opacity: 0, y: 12 },
    show: (i = 1) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.04 * i, ease: easing } })
  }

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
      <div className="">
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

          <div className="relative z-10 max-w-6xl mx-auto pt-16 sm:pt-20 lg:pt-24 md:pt-28">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="text-center pb-12"
            >
              <motion.h1 variants={containerFade} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </motion.h1>
              <motion.p variants={itemFade} className="text-base sm:text-lg md:text-[1.15rem] text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
                Discover a refined toolkit designed to streamline workflows, enhance reliability, and scale with you.
              </motion.p>
              {/* Hero supporting bullets to reduce emptiness */}
              <motion.ul variants={staggerContainer} className="flex flex-wrap justify-center gap-3 mb-8">
                {[
                  'Fast integration',
                  'Enterprise-grade security',
                  'Human-centered UX'
                ].map((item) => (
                  <motion.li key={item} variants={itemFade} className="flex items-center gap-2 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-gray-700/70 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full text-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-600" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={itemFade} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-7 md:px-8 py-3 rounded-md text-sm md:text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 transition-colors shadow-sm"
                >
                  Explore Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-7 md:px-8 py-3 rounded-md text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/40 transition-colors shadow-sm backdrop-blur-sm"
                >
                  View Pricing
                </Link>
              </motion.div>
              {/* Trusted logos row removed per request */}
            </motion.div>
          </div>
         
        </section>

        {/* Feature Highlights */}
        <section className="relative py-12 sm:py-16 lg:py-20 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 overflow-visible">
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[10%] -translate-x-1/2 -translate-y-1/2 w-[30rem] sm:w-[40rem] lg:w-[46rem] h-[30rem] sm:h-[40rem] lg:h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25, margin: '-60px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            >
              {featureHighlights.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemFade}
                  whileHover={{ y: -1 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                  className="group relative rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/90 p-4 sm:p-6 shadow-sm transition-all transform-gpu will-change-transform"
                >
                  <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-[rgba(124,58,237,0.15)] transition"></div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[rgba(124,58,237,0.10)] dark:bg-[rgba(124,58,237,0.16)] rounded-full flex items-center justify-center mb-3 sm:mb-4" style={{ color: '#7C3AED' }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Sections */}
        <motion.section
          initial="show"
          whileInView="show"
          viewport={{ once: false, amount: 0.25, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features02 />
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.25, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features03 />
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.25, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features04 />
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.25, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features05 />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.25, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Cta />
        </motion.section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
