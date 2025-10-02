'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Particles from '../../../components/particles'
import LandingFooter from '../../../components/landing-footer'

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({})

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
  }

  const faqs = [
    {
      category: "General",
      questions: [
        {
          question: "What is this platform?",
          answer: "Our platform is a comprehensive solution designed to streamline your workflow and boost productivity. It combines powerful features with an intuitive interface to help you achieve your goals faster and more efficiently."
        },
        {
          question: "How does it work?",
          answer: "Simply sign up, connect your tools, and start automating your processes. Our platform integrates seamlessly with your existing workflow, providing real-time insights and automated actions to keep everything running smoothly."
        },
        {
          question: "Is there a free trial?",
          answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can explore all capabilities and see how our platform can transform your workflow before making any commitment."
        }
      ]
    },
    {
      category: "Pricing & Billing",
      questions: [
        {
          question: "What are your pricing plans?",
          answer: "We offer three flexible pricing tiers: Starter ($29/month), Professional ($99/month), and Enterprise ($299/month). Each plan is designed to scale with your needs, from individual users to large organizations."
        },
        {
          question: "Can I change my plan anytime?",
          answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments to ensure you only pay for what you use."
        },
        {
          question: "Do you offer refunds?",
          answer: "We offer a 30-day money-back guarantee on all paid plans. If you're not completely satisfied with our platform, contact our support team for a full refund, no questions asked."
        }
      ]
    },
    {
      category: "Technical",
      questions: [
        {
          question: "What integrations do you support?",
          answer: "We support over 100+ popular tools including Slack, Notion, Google Workspace, Zapier, and many more. Our integration marketplace is constantly growing, and we're always adding new connections based on user feedback."
        },
        {
          question: "Is my data secure?",
          answer: "Security is our top priority. We use enterprise-grade encryption, SOC 2 compliance, and regular security audits. Your data is encrypted in transit and at rest, and we never share your information with third parties."
        },
        {
          question: "Do you have an API?",
          answer: "Yes! We provide a comprehensive REST API that allows you to integrate our platform with your custom applications. Our API documentation is extensive and includes code examples in multiple programming languages."
        }
      ]
    },
    {
      category: "Support",
      questions: [
        {
          question: "What support options are available?",
          answer: "We offer multiple support channels including email support, live chat, and a comprehensive knowledge base. Enterprise customers get dedicated account managers and priority support with faster response times."
        },
        {
          question: "How quickly do you respond to support requests?",
          answer: "Our support team typically responds within 2-4 hours during business hours. Enterprise customers receive priority support with responses within 1 hour. We also maintain a 24/7 support team for critical issues."
        },
        {
          question: "Do you provide training?",
          answer: "Yes! We offer onboarding sessions, webinars, and personalized training for teams. Our customer success team will work with you to ensure your team gets the most out of our platform from day one."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      {/* Main content with top padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-violet-500/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-violet-600/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-violet-700/10 rounded-full blur-xl"></div>

          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center pb-12"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <h1 className="text-6xl md:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
                    Got Questions?
                  </span>
                </h1>
                <motion.h2 
                  className="text-3xl md:text-4xl font-semibold text-gray-700 dark:text-gray-300"
                  variants={fadeInUp}
                >
                  Don't worry, we've got them covered
                </motion.h2>
              </motion.div>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12"
                variants={fadeInUp}
              >
                Everything you need to know about our platform, features, and services. 
                Can't find what you're looking for? We're here to help.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={fadeInUp}
              >
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Contact Support
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              {faqs.map((category, categoryIndex) => (
                <motion.div 
                  key={categoryIndex} 
                  className="mb-20"
                  variants={fadeInUp}
                >
                  <motion.h2 
                    className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center"
                    variants={fadeInUp}
                  >
                    <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
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
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                          variants={scaleIn}
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.button
                            className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                            onClick={() => toggleItem(categoryIndex, faqIndex)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                              {faq.question}
                            </h3>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="flex-shrink-0"
                            >
                              <svg 
                                className="w-5 h-5 text-gray-500 dark:text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </motion.button>
                          
                          <motion.div
                            initial={false}
                            animate={{ 
                              height: isOpen ? "auto" : 0,
                              opacity: isOpen ? 1 : 0
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6">
                              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-4xl font-bold text-gray-900 dark:text-white mb-6"
                variants={fadeInUp}
              >
                <span className="bg-gradient-to-r from-violet-600 to-violet-800 bg-clip-text text-transparent">
                  Still have questions?
                </span>
              </motion.h2>
              
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-300 mb-12"
                variants={fadeInUp}
              >
                Can't find what you're looking for? Our support team is here to help you succeed.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={fadeInUp}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Contact Support
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  View Documentation
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
