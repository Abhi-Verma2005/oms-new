'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

export interface HomepageCaseStudy {
  id: string
  title: string
  subtitle: string
  imageSrc: string
  category: string
  isActive: boolean
  displayOrder: number
  stats: Array<{ value: string; label: string }>
  link?: string
}

export function DynamicInsightsSection() {
  const [caseStudies, setCaseStudies] = useState<HomepageCaseStudy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchCaseStudies()
  }, [])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/homepage-case-studies')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCaseStudies(data)
        setError(null)
      } else {
        console.error('Invalid data format:', data)
        setCaseStudies([])
        setError('Invalid data format received')
      }
    } catch (error) {
      console.error('Error fetching case studies:', error)
      setCaseStudies([])
      setError(error instanceof Error ? error.message : 'Failed to fetch case studies')
    } finally {
      setIsLoading(false)
    }
  }

  // Group case studies by category - with safety check
  const groupedStudies = Array.isArray(caseStudies) 
    ? caseStudies.reduce((acc, study) => {
        if (!acc[study.category]) {
          acc[study.category] = []
        }
        acc[study.category].push(study)
        return acc
      }, {} as Record<string, HomepageCaseStudy[]>)
    : {}

  const categories = Object.keys(groupedStudies)
  const filteredStudies = selectedCategory === 'all' 
    ? caseStudies 
    : groupedStudies[selectedCategory] || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Case Studies
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={fetchCaseStudies}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-gray-800/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200/60 dark:border-purple-800/60 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Case Studies
          </div>
          <h2 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Real Results from <span className="text-purple-700 dark:text-purple-300">Real Clients</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how our proven strategies drive measurable growth for businesses across industries. 
            Each case study represents real data, real results, and real success.
          </p>
        </div>

        {/* Category Filter with animated underline */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 relative">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
          >
            All Categories
            {selectedCategory === 'all' && (
              <motion.span layoutId="insights-cat-underline" className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded bg-white/80" />
            )}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
              }`}
            >
              {category}
              {selectedCategory === category && (
                <motion.span layoutId="insights-cat-underline" className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded bg-white/80" />
              )}
            </button>
          ))}
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.06, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-purple-200/60 dark:group-hover:ring-purple-800/40 transition-colors duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                  <motion.div whileHover={{ scale: 1.03 }} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img
                      src={study.imageSrc}
                      alt={study.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div>
                    <div className="text-purple-600 dark:text-purple-400 text-sm font-semibold">
                      {study.category}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {study.title}
                    </h3>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
                  {study.subtitle}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {study.stats.map((stat, statIndex) => (
                    <motion.div key={statIndex} className="text-center rounded-lg border border-gray-200 dark:border-gray-700 p-3" whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                      <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {study.link && (
                  <Link
                    href={study.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
                  >
                    View Full Case Study
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredStudies.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No case studies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedCategory === 'all' 
                ? 'No case studies are currently available.' 
                : `No case studies found in the ${selectedCategory} category.`
              }
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
