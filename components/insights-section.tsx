'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface CaseStudyStat { value: string; label: string }
export interface CaseStudyItem {
  id: number; title: string; subtitle: string; imageSrc: string; stats: CaseStudyStat[]; link: string
}
export interface CaseStudyCategory { id: string; name: string; studies: CaseStudyItem[] }

export const caseStudiesData: CaseStudyCategory[] = [
  {
    id: 'finance-case',
    name: 'Banking & Finance',
    studies: [
      {
        id: 1, title: 'Finance SEO', subtitle: '15M Organic Visitors in 3 Months using HQ Backlinks',
        imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-protean-case-study.png',
        stats: [
          { value: '933%', label: 'Increase in organic search traffic' },
          { value: '600+', label: 'Keywords in top 3 SERP’s' }
        ],
        link: 'https://emiactech.com/emiac-clients/protean-egov-technologies/'
      },
      {
        id: 2, title: 'Finance SEO', subtitle: '300K Words Driving 73+ Top Keyword Ranks',
        imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-shriram-finance-case-study.png',
        stats: [
          { value: '300K+', label: 'Words written in 35 days' },
          { value: '73+', label: 'Loan keywords in top 3 SERP’s' }
        ],
        link: 'https://emiactech.com/emiac-clients/shriram-finance/'
      },
      {
        id: 3, title: 'Finance SEO', subtitle: '20K+ Keywords Ranked with Finance Backlinks',
        imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-axis-bank-case-study.png',
        stats: [
          { value: '162M', label: 'Monthly Visitors(Up from 148M)' },
          { value: '100+', label: 'Authority Backlinks from Finance Websites' }
        ],
        link: '#'
      },
    ],
  },
  {
    id: 'insurance-case',
    name: 'Insurance',
    studies: [
        {
            id: 1, title: 'Insurance SEO', subtitle: '82% Traffic Growth via Insurance Backlinks',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-policybazaar-case-study.png',
            stats: [
              { value: '82%', label: 'Increase in organic search traffic' },
              { value: '150+', label: 'Keywords in top 3 SERP’s' }
            ],
            link: 'https://emiactech.com/emiac-clients/policy-bazaar/'
        },
        {
            id: 2, title: 'Insurance SEO', subtitle: 'Complete Backlink Activity + SEO Guest Post Writing',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-acko-case-study.png',
            stats: [
              { value: '2 Lac+', label: 'Words written in 14 days' },
              { value: '250+', label: 'HQ Finance Backlinks' }
            ],
            link: 'https://emiactech.com/emiac-clients/acko-insurance/'
        },
        {
            id: 3, title: 'Insurance SEO', subtitle: 'Quick SEO Impact: Top Rankings + AI Visibility',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-hdfc-ergo-case-study.png',
            stats: [
              { value: '15+', label: 'Keywords in Top 3 in 30 days' },
              { value: '35+', label: 'Keywords in Google AI Overview' }
            ],
            link: 'https://emiactech.com/emiac-clients/hdfc-ergo-insurance/'
        }
    ]
  },
  {
    id: 'automobile-case',
    name: 'Automobile',
    studies: [
        {
            id: 1, title: 'Automobile SEO', subtitle: '78% Traffic Growth in Just 65 Days',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-mahindra-auto-1.png',
            stats: [
                { value: '500+', label: 'Increase in organic search traffic' },
                { value: '300-400', label: 'High-Authority Backlinks from News Sites' }
            ],
            link: 'https://emiactech.com/emiac-clients/mahindra-auto/'
        },
        {
            id: 2, title: 'Automobile SEO', subtitle: 'Scaling Royal Enfield to 8M Organic Visitors',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study-4.png',
            stats: [
                { value: '10K+', label: 'Keywords in Top 3 SERPs' },
                { value: '300K+', label: 'Words Written Monthly by Experts' }
            ],
            link: 'https://emiactech.com/emiac-clients/royal-enfield/'
        },
        {
            id: 3, title: 'Automobile SEO', subtitle: 'End-to-End SEO Campaign Driving Millions in Traffic',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/ACKO.png',
            stats: [
                { value: '71%', label: 'Growth in Organic Traffic (1.09M → 1.86M)' },
                { value: '150-200', label: 'Niche-specific Backlinks Built Monthly' }
            ],
            link: 'https://emiactech.com/emiac-clients/acko-drive/'
        }
    ]
  },
  {
    id: 'healthcare-case',
    name: 'Healthcare',
    studies: [
        {
            id: 1, title: 'Healthcare SEO', subtitle: '343% Organic Growth Through Ayurveda Content',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study-1.png',
            stats: [
                { value: '2600+', label: 'Keywords Ranked in Top 3 SERPs' },
                { value: '+348K', label: 'Monthly Organic Visitors' }
            ],
            link: 'https://emiactech.com/emiac-clients/zanducare/'
        },
        {
            id: 2, title: 'Healthcare SEO', subtitle: 'From 4K to 33K Medical Audience in 4 Months',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study.png',
            stats: [
                { value: '8X', label: 'Traffic Growth with Healthcare Content' },
                { value: '30-40', label: 'HQ Backlinks from Medical & News Sites' }
            ],
            link: 'https://emiactech.com/emiac-clients/vijaya-diagnostic-centre/'
        },
        {
            id: 3, title: 'Healthcare SEO', subtitle: 'Healthcare SEO Content and Backlinks',
            imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-sukoon-case-study.png',
            stats: [
                { value: '211%', label: 'Rise in organic search traffic' },
                { value: '10+', label: 'Keywords optimised for GEO' }
            ],
            link: '#'
        }
    ]
  },
]

export function CaseStudiesGrid({ selectedCategoryId = 'all' }: { selectedCategoryId?: string }) {
  const categories = selectedCategoryId === 'all'
    ? caseStudiesData
    : caseStudiesData.filter(c => c.id === selectedCategoryId)

  // Flatten all studies when showing "all" for a unified bento grid
  const allStudies: Array<CaseStudyItem & { categoryId: string }> = selectedCategoryId === 'all'
    ? caseStudiesData.flatMap(cat => cat.studies.map(s => ({ ...s, categoryId: cat.id })))
    : []

  // Compute bento spans: featured cards span 6 cols, others span 3 (on xl: 9-col grid)
  function getBentoColSpan(index: number): string {
    const featured = [0, 4, 9, 14] // repeatable pattern for featured positions
    const isFeatured = featured.includes(index % 15)
    // Base spans: xl uses 9 cols; sm uses 6 cols so proportions hold
    return isFeatured
      ? 'xl:col-span-3 sm:col-span-3 col-span-1'
      : 'xl:col-span-3 sm:col-span-3 col-span-1'
  }

  function getImageHeight(index: number): string {
    const featured = [0, 4, 9, 14]
    const isFeatured = featured.includes(index % 15)
    return isFeatured ? 'h-64 sm:h-72 xl:h-80' : 'h-48 sm:h-56 xl:h-56'
  }

  const isRows = selectedCategoryId === 'all'

  // ALL: unified bento grid
  if (selectedCategoryId === 'all') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-6 xl:grid-cols-9 gap-6">
        {allStudies.map((study, idx) => (
          <Link
            key={`${study.categoryId}-${study.id}`}
            href={study.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${getBentoColSpan(idx)}`}
          >
            <div className={`relative ${getImageHeight(idx)} bg-white dark:bg-gray-800/90 border-b border-gray-200/60 dark:border-gray-700/60`}
            >
              <img src={study.imageSrc} alt={study.title} className="absolute inset-0 w-full h-full object-contain p-6" />
            </div>
            <div className="p-6">
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">{study.title}</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{study.subtitle}</h4>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {study.stats.map((s, sIdx) => (
                  <div key={sIdx} className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-3">
                    <div className="text-base font-bold text-gray-900 dark:text-white">{s.value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-semibold">
                View Case Study
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  // FILTERED: per-category standard grid
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {category.studies.map((study) => (
              <Link key={study.id} href={study.link} target="_blank" rel="noopener noreferrer" className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="aspect-[16/9] bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60">
                  <img src={study.imageSrc} alt={study.title} className="w-full h-full object-contain p-4" />
                </div>
                <div className="p-6">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">{study.title}</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{study.subtitle}</h4>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {study.stats.map((s, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 p-3">
                        <div className="text-base font-bold text-gray-900 dark:text-white">{s.value}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm font-semibold">
                    View Case Study
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InsightsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('finance-case')

  const tabs: Array<{ id: string; label: string }> = [
    { id: 'finance-case', label: 'Banking & Finance' },
    { id: 'insurance-case', label: 'Insurance' },
    { id: 'automobile-case', label: 'Automobile' },
    { id: 'healthcare-case', label: 'Healthcare' },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Case Studies
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Case <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Studies</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore real-world results across Finance, Insurance, Automobile, and Healthcare.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex w-full items-center justify-center">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/60 bg-white/70 p-1 shadow-sm dark:border-gray-700/60 dark:bg-gray-900/40">
            {tabs.map((t) => {
              const isActive = activeCategory === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveCategory(t.id)}
                  className={
                    `px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ` +
                    (isActive
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow'
                      : 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white')
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <CaseStudiesGrid selectedCategoryId={activeCategory} />

        {/* Performance Metrics */}
        <div className="bg-white/60 mt-10 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Campaign Performance Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time metrics from our active outreach campaigns
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">96.8%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">2,847</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Monthly Outreach</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50,000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Connections Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">3 days</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Response Time</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
            >
              View Full Analytics
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
