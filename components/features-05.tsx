import Particles from './particles'

export default function Features05() {
  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Purpose-built for companies",
      description: "Purpose-built for companies that require more than a simple plan with security infrastructure."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "AI-powered automation",
      description: "AI-powered to remove the burdens of tedious knowledge management and security tasks."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "24/7 support",
      description: "There's no prioritized support tiers. You can use email or live chat and you will hear back in a couple of hours."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Comprehensive documentation",
      description: "Comprehensive developer docs and a centralized support center packed with many resources."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "No hidden fees",
      description: "No upcharges—and we'd never upsell you to a higher plan or a dedicated IP to improve deliverability."
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      title: "Regular updates",
      description: "Tool training, dedicated resources, and regular updates are available for both small and large teams."
    }
  ]

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      {/* Particles animation */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
        <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="pb-12 md:pb-20">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12">
            <h2 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                Stop overpaying for software
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">There are many variations available, but the majority have suffered alteration in some form, by injected humour.</p>
          </div>

          {/* Features grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-tr from-gray-800/50 to-gray-800/10 dark:from-gray-700/50 dark:to-gray-700/10 rounded-3xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4 p-6 h-full">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong className="text-gray-900 dark:text-white font-medium">{feature.title}</strong> - {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
