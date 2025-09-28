'use client'

export default function PricingFaqs() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      {/* Blurred shape */}
      <div className="absolute top-0 -translate-y-1/3 left-1/2 -translate-x-1/2 ml-24 blur-2xl opacity-50 pointer-events-none -z-10" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="434" height="427">
          <defs>
            <linearGradient id="bs3-a" x1="19.609%" x2="50%" y1="14.544%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path fill="url(#bs3-a)" fillRule="evenodd" d="m410 0 461 369-284 58z" transform="matrix(1 0 0 -1 -410 427)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="py-12 md:py-20 border-t border-gray-200 dark:border-gray-700">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <div>
              <div className="inline-flex font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-200 pb-3">
                Getting started with Mosaic
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Everything you need to know
            </h2>
          </div>

          {/* Columns */}
          <div className="md:flex md:space-x-12 space-y-8 md:space-y-0">
            {/* Column */}
            <div className="w-full md:w-1/2 space-y-8">
              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">What is Mosaic Next?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Mosaic Next is a comprehensive outreach platform that helps businesses connect with the right people at the right time. We provide tools for contact management, outreach campaigns, and relationship building.
                </p>
              </div>

              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">What's an affordable alternative to Mosaic Next?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  While there are other outreach tools available, Mosaic Next offers unique features like AI-powered contact recommendations, advanced analytics, and white-label solutions that make it stand out in the market.
                </p>
              </div>

              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Can I remove the 'Powered by Mosaic Next' branding?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Our Professional and Enterprise plans include custom branding options, and our Enterprise plan offers complete white-label solutions for agencies and large organizations.
                </p>
              </div>
            </div>

            {/* Column */}
            <div className="w-full md:w-1/2 space-y-8">
              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">What kind of data can I collect from my customers?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  You can collect contact information, engagement metrics, response rates, campaign performance data, and custom fields. All data is stored securely and can be exported for analysis.
                </p>
              </div>

              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Can I use Mosaic Next for free?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  We offer a 14-day free trial for all plans. After the trial, you can choose from our Starter, Professional, or Enterprise plans based on your needs.
                </p>
              </div>

              {/* Item */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Is Mosaic Next affordable for small businesses?</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely! Our Starter plan is designed specifically for small businesses and starts at just $29/month. It includes all the essential features you need to get started with outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
