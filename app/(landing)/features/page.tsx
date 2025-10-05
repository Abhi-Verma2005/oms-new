'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Particles from '../../../components/particles'
import Features02 from '../../../components/features-02'
import Features03 from '../../../components/features-03'
import Features04 from '../../../components/features-04'
import Features05 from '../../../components/features-05'
import Cta from '../../../components/cta'
import LandingFooter from '../../../components/landing-footer'

export default function FeaturesPage() {
  const containerFade = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const staggerContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.08 }
    }
  }

  const itemFade = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const sectionReveal = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
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
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-[28rem] h-[28rem] -mt-32 blur-sm opacity-80">
            <Particles className="absolute inset-0 -z-10" quantity={8} staticity={25} />
          </div>

          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="text-center pb-12"
            >
              <motion.h1 variants={containerFade} className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </motion.h1>
              <motion.p variants={itemFade} className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
                Discover a refined toolkit designed to streamline workflows, enhance reliability, and scale with you.
              </motion.p>
              <motion.div variants={itemFade} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-7 md:px-8 py-3 rounded-md text-sm md:text-base font-medium text-white bg-violet-700 hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 transition-colors shadow-sm"
                >
                  Explore Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-7 md:px-8 py-3 rounded-md text-sm md:text-base font-medium text-gray-800 dark:text-gray-200 bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-colors shadow-sm backdrop-blur-sm"
                >
                  View Pricing
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border-t border-gray-200/60 dark:border-gray-800 overflow-visible">
          {/* Background glow for section */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[10%] -translate-x-1/2 -translate-y-1/2 w-[44rem] h-[44rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="grid md:grid-cols-3 gap-6 md:gap-8"
            >
              {featureHighlights.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemFade}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow md:hover:shadow-md transition-all"
                >
                  <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-violet-600/20 transition"></div>
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-violet-100/80 dark:bg-violet-900/40 rounded-full flex items-center justify-center mb-4 text-violet-700 dark:text-violet-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Sections */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow for section */}
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
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow for section */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features03 />
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow for section */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features04 />
        </motion.section>
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow for section */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] blur-3xl opacity-70 dark:opacity-60"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 60%)' }}
            />
          </div>
          <Features05 />
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={sectionReveal}
          className="relative overflow-visible"
        >
          {/* Background glow for section */}
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
