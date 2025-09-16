import Image from 'next/image'

export type FeatureItem = {
  title: string
  description: string
}

const FEATURES: FeatureItem[] = [
  {
    title: '100,000+ Placement Options',
    description: 'Guest posts, home-page and inner-page links across vetted publishers.'
  },
  {
    title: 'Full SEO Metrics Included',
    description: 'DA, DR, traffic, referring domains and keywords for every site.'
  },
  {
    title: 'Multiple Payment Options',
    description: 'Stripe, PayPal, Bank Transfer, Wise, Crypto and more.'
  },
  {
    title: 'Link Tracking',
    description: 'Automated monitoring and alerts for all your backlinks.'
  },
  {
    title: 'Competitor Analysis',
    description: 'Close your link gap and stay ahead of the competition.'
  },
  {
    title: 'Multiple Accounts',
    description: 'Easily manage separate accounts for different projects and teams.'
  }
]

function FeatureCard({ title, description }: FeatureItem) {
  return (
    <div className="rounded-xl p-4 md:p-5 border bg-white text-gray-800 shadow-sm border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:backdrop-blur-sm">
      <div className="font-semibold leading-snug text-gray-900 dark:text-gray-100">{title}</div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</div>
    </div>
  )
}

export default function AuthFeatures() {
  return (
    <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
      <div className="relative h-full w-full">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-white dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-slate-950" />
        {/* Light mode soft gradients */}
        <div className="absolute inset-0 dark:hidden bg-[radial-gradient(55%_35%_at_50%_0%,rgba(139,92,246,0.10),transparent_55%),radial-gradient(40%_30%_at_100%_100%,rgba(59,130,246,0.08),transparent_55%)]" />
        {/* Dark mode gradient canvas */}
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(60%_40%_at_50%_0%,rgba(139,92,246,0.18),transparent_60%),radial-gradient(40%_30%_at_100%_100%,rgba(59,130,246,0.12),transparent_60%),#0f172a]" />

        {/* Soft light blur */}
        <div className="absolute -top-10 -left-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        {/* Content grid */}
        <div className="relative z-10 h-full w-full px-8 py-10 flex flex-col">
          <div className="grid grid-cols-2 gap-4 mt-auto">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} title={f.title} description={f.description} />
            ))}
          </div>

          {/* Sub-footer text */}
          <div className="mt-8 text-gray-500 dark:text-gray-300 text-sm">
            Trusted by growth teams worldwide
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthFeaturesMobile() {
  return (
    <div className="md:hidden mt-8">
      <div className="rounded-2xl border p-5 bg-gray-50 text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.slice(0, 4).map((f) => (
            <FeatureCard key={f.title} title={f.title} description={f.description} />
          ))}
        </div>
        <div className="mt-6 text-gray-500 dark:text-gray-300 text-xs">Trusted by growth teams worldwide</div>
      </div>
    </div>
  )
}


