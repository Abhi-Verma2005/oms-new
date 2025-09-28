"use client"

import Image from 'next/image'
import Link from 'next/link'
import Particles from '../../../components/particles'
import LandingFooter from '../../../components/landing-footer'

export default function IntegrationsPage() {
  const tools = [
    { name: 'Ahrefs', logo: '/images/logo_ahrefs.svg' },
    { name: 'Semrush', logo: '/images/logo-semrush.svg' },
    { name: 'Slack', logo: '/images/channel-01.png' },
    { name: 'Notion', logo: '/images/channel-02.png' },
    { name: 'Zapier', logo: '/images/channel-03.png' },
    { name: 'Google Sheets', logo: '/images/applications-image-01.jpg' },
  ]

  const categories = [
    {
      title: 'Analytics & SEO',
      items: [
        'Keyword tracking',
        'Backlink monitoring',
        'Site audit sync',
        'Traffic insights',
      ],
    },
    {
      title: 'Automation',
      items: [
        'Webhook triggers',
        'Zap templates',
        'Native automations',
        'Scheduler actions',
      ],
    },
    {
      title: 'Collaboration',
      items: [
        'Slack notifications',
        'Notion databases',
        'Shared workspaces',
        'Role-based access',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-900 dark:text-white">
      <div className="pt-16">
        {/* Hero */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -z-10 w-64 h-64 -mt-24">
            <Particles className="absolute inset-0 -z-10" quantity={6} staticity={30} />
          </div>

          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 bg-clip-text text-transparent">
                Integrations
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Connect your favorite tools to streamline your workflow. Use native integrations or automate with webhooks and Zap templates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/publishers" className="inline-flex items-center justify-center px-8 py-3 rounded-md text-white bg-violet-600 hover:bg-violet-700">
                Browse Templates
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center px-8 py-3 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Logos marquee */}
        <section className="py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="overflow-hidden">
              <div className="inline-flex w-full flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                <ul className="flex animate-infinite-scroll items-center [&_img]:max-w-none [&_li]:mx-8">
                  {tools.concat(tools).map((t, i) => (
                    <li key={i}>
                      <Image src={t.logo} alt={t.name} width={120} height={40} className="object-contain opacity-80 dark:opacity-90" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Categories grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div key={cat.title} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{cat.title}</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-4xl mx-auto text-center rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800" />
            <div className="relative p-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Build powerful workflows</h2>
              <p className="text-gray-300 mb-8">Use our integrations and automations to connect data and trigger actions across your stack.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/publishers" className="inline-flex items-center justify-center px-8 py-3 rounded-md text-white bg-violet-600 hover:bg-violet-700">Start Free</Link>
                <Link href="/docs" className="inline-flex items-center justify-center px-8 py-3 rounded-md border border-white/30 text-white bg-white/10 hover:bg-white/20">Read Docs</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
