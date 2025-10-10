'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

export default function PricingCards() {
  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 100 contacts per month',
        'Basic outreach templates',
        'Email support',
        'Basic analytics',
        '1 user account'
      ],
      cta: 'Start Free Trial',
      href: '/signup',
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'Best for growing businesses and agencies',
      features: [
        'Up to 1,000 contacts per month',
        'Advanced outreach templates',
        'Priority email support',
        'Advanced analytics & reporting',
        'Up to 5 user accounts',
        'Custom branding',
        'API access'
      ],
      cta: 'Start Free Trial',
      href: '/signup',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$299',
      period: '/month',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited contacts',
        'Custom outreach templates',
        '24/7 phone & email support',
        'Advanced analytics & reporting',
        'Unlimited user accounts',
        'White-label solution',
        'Full API access',
        'Dedicated account manager'
      ],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border transition-all duration-500 ${
                plan.popular
                  ? 'border-purple-400/50 shadow-xl shadow-purple-500/10 scale-105'
                  : 'border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 ml-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full block text-center py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 shadow-lg hover:shadow-xl hover:shadow-purple-500/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
