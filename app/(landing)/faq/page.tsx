'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Particles from '../../../components/particles'
import LandingFooter from '../../../components/landing-footer'

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({})
  const [searchQuery, setSearchQuery] = useState('')

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Lightweight animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const faqs = [
    {
      category: "General",
      questions: [
        {
          question: "What is Mosaic Next?",
          answer: "Mosaic Next is a comprehensive outreach and content placement platform that helps businesses build authority and drive growth through strategic content placement on high-authority platforms.\n\nWe connect you with the right people and platforms to amplify your message and establish your brand as a thought leader in your industry."
        },
        {
          question: "How does the outreach process work?",
          answer: "Our process is simple and effective:\n\n1) We analyze your brand and goals\n2) Create high-quality content tailored to your needs\n3) Reach out to relevant platforms and contacts\n4) Secure placements and monitor results\n\nWe handle everything from strategy to execution, ensuring your message reaches the right audience."
        },
        {
          question: "Do you offer a free consultation?",
          answer: "Yes! We offer free consultations to discuss your specific needs and goals.\n\nDuring the consultation, we'll analyze your current situation and provide recommendations on how our services can help you achieve your objectives. No commitment required."
        }
      ]
    },
    {
      category: "Services & Pricing",
      questions: [
        {
          question: "What services do you offer?",
          answer: "We offer comprehensive content and outreach services:\n\n• Content creation and SEO writing\n• Strategic outreach and platform placement\n• Wikipedia page creation and management\n• Backlink building and relationship management\n• Comprehensive reporting and analytics\n\nOur services are designed to build your authority and drive measurable results."
        },
        {
          question: "How do you price your services?",
          answer: "Our pricing is flexible and based on several factors:\n\n• Scope of work and content requirements\n• Target platforms and outreach complexity\n• Campaign duration and ongoing management\n\nWe offer packages for different business sizes, from startups to enterprise clients. Contact us for a customized quote that fits your budget and goals."
        },
        {
          question: "Can I submit my own content?",
          answer: "Absolutely! We welcome your content submissions and can work with your existing materials.\n\nOur team will review and optimize your content for maximum impact across our network of platforms. We can also provide suggestions for improvement to ensure the best possible results."
        }
      ]
    },
    {
      category: "Process & Timeline",
      questions: [
        {
          question: "What's the typical turnaround time?",
          answer: "Our standard turnaround is 7-14 days for content creation and placement.\n\nRush orders can be accommodated with 3-5 day delivery for urgent projects. We provide detailed timelines during the consultation phase and keep you updated throughout the entire process."
        },
        {
          question: "How do you measure success?",
          answer: "We track comprehensive metrics to measure your success:\n\n• Content placements and reach\n• Engagement metrics and audience growth\n• Traffic increases and organic growth\n• Brand mentions and authority building\n\nYou'll receive detailed reports showing the impact of our outreach efforts on your business goals."
        },
        {
          question: "Do you provide white label services?",
          answer: "Yes! We offer comprehensive white label services for agencies and partners.\n\nThis includes:\n• Custom branding and client management\n• Dedicated support and account management\n• Flexible pricing models for scalability\n\nPerfect for agencies looking to expand their service offerings."
        }
      ]
    },
    {
      category: "Support & Guarantees",
      questions: [
        {
          question: "What support options are available?",
          answer: "We offer comprehensive support through multiple channels:\n\n• Email support for detailed inquiries\n• Live chat for quick questions\n• Dedicated account managers for enterprise clients\n• Phone support for urgent matters\n\nOur team is available throughout the entire process, from initial consultation to ongoing campaign management."
        },
        {
          question: "Do you offer guarantees?",
          answer: "We guarantee quality content and professional service delivery.\n\nIf you're not satisfied with our work:\n• Free revisions until you're happy\n• Partial refunds based on our satisfaction policy\n• No questions asked refund policy\n\nWe're committed to your success and stand behind our work."
        },
        {
          question: "How quickly do you respond to support requests?",
          answer: "Our support team typically responds within 2-4 hours during business hours.\n\nFor urgent matters:\n• Priority support for enterprise clients\n• 24/7 support for critical issues\n• Dedicated support team always available\n\nWe ensure you get the help you need when you need it."
        }
      ]
    }
  ]

  // Filter FAQs based on search query
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-600/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-700/10 rounded-full blur-xl"></div>

          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center pb-12"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-800 mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequently Asked Questions
                </div>
                <h1 className="text-6xl md:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Got Questions?
                  </span>
                </h1>
                <motion.h2 
                  className="text-3xl md:text-4xl font-semibold text-gray-700 dark:text-gray-300"
                  variants={fadeInUp}
                >
                  We've got the answers
                </motion.h2>
              </motion.div>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12"
                variants={fadeInUp}
              >
                Everything you need to know about our outreach and content placement services. 
                Can't find what you're looking for? We're here to help.
              </motion.p>
              
              {/* Search Bar */}
              <motion.div 
                className="mb-12"
                variants={fadeInUp}
              >
                <div className="relative max-w-lg mx-auto">
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-12 pr-6 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-lg hover:shadow-xl"
                  />
                  <svg 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={fadeInUp}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  View Publishers
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">🔍</div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  No FAQs found
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  Try searching with different keywords or browse all categories.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
              >
                {filteredFaqs.map((category, categoryIndex) => (
                  <motion.div 
                    key={categoryIndex} 
                    className="mb-20"
                    variants={fadeInUp}
                  >
                    <motion.h2 
                      className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center"
                      variants={fadeInUp}
                    >
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {category.category}
                      </span>
                    </motion.h2>
                    
                    <div className="grid gap-6">
                      {category.questions.map((faq, faqIndex) => {
                        const key = `${categoryIndex}-${faqIndex}`
                        const isOpen = openItems[key]
                        
                        return (
                          <motion.div 
                            key={faqIndex}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-200"
                            variants={fadeInUp}
                          >
                            <button
                              className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                              onClick={() => toggleItem(categoryIndex, faqIndex)}
                              aria-expanded={isOpen}
                              aria-controls={`faq-${key}`}
                            >
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">
                                {faq.question}
                              </h3>
                              <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="flex-shrink-0"
                              >
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <svg 
                                    className="w-4 h-4 text-white" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </motion.div>
                            </button>
                            
                            <motion.div
                              initial={false}
                              animate={{ 
                                height: isOpen ? "auto" : 0,
                                opacity: isOpen ? 1 : 0
                              }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-8 pb-6">
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                  <div className="max-w-4xl">
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base break-words whitespace-pre-line">
                                      {faq.answer}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          <div className="max-w-6xl mx-auto text-center relative">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-5xl font-bold text-gray-900 dark:text-white mb-6"
                variants={fadeInUp}
              >
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Still have questions?
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto"
                variants={fadeInUp}
              >
                Can't find what you're looking for? Our support team is here to help you succeed. 
                Get personalized assistance and discover how we can help your business grow.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-6 justify-center"
                variants={fadeInUp}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-10 py-5 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Support
                </Link>
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-10 py-5 border border-gray-300 dark:border-gray-600 text-lg font-semibold rounded-2xl text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View Publishers
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
