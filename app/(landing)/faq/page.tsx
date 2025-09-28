'use client'

import Link from 'next/link'
import Particles from '../../../components/particles'
import LandingFooter from '../../../components/landing-footer'

export default function FaqPage() {
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
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          {/* Particles animation */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center pb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                Find answers to common questions about our platform, features, and services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/publishers"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  {category.category}
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {category.questions.map((faq, faqIndex) => (
                    <div key={faqIndex} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 transition-colors duration-200"
              >
                Contact Support
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
