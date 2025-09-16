"use client"

import React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

function Slide({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="min-w-0 shrink-0 grow-0 basis-full pr-4">
      <div className="h-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="shrink-0 flex items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 size-8">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">{title}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {description}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export type PublishersHelpCarouselProps = { metrics?: { total: number; avgPrice: number; avgTraffic: number; avgAuthority: number } }

export default function PublishersHelpCarousel({ metrics }: PublishersHelpCarouselProps) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  )

  return (
    <div className="relative w-full max-w-[44rem]">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Quick tips</div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -mr-6">
          <Slide
            title="Start with the Basics"
            description="Pick Niche, Language, and Country. Click any pill to refine and save as a reusable view."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
          <Slide
            title="Authority & SEO"
            description="Use DA/PA/DR and Spam Score ranges. Drag sliders or type exact values."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 10H7" />
                <path d="M21 6H3" />
                <path d="M21 14H3" />
                <path d="M21 18H7" />
              </svg>
            }
          />
          <Slide
            title="Traffic Preview"
            description="Hover the Trend cell to see quick traffic charts for any site."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          />
          <Slide
            title="Add to Cart & Checkout"
            description="Click Add to Cart from the table or details panel. Use the floating Checkout to finish."
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
          />
        </div>
      </div>
      {/* Mini metrics below the carousel */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Inventory</div>
          <div className="h-16">
            <div className="h-full w-full rounded bg-gradient-to-tr from-violet-200/70 via-violet-400/30 to-transparent dark:from-violet-500/20 dark:via-violet-400/10 flex items-center justify-center text-sm font-semibold text-violet-700 dark:text-violet-300">
              50k sites
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Avg. Price</div>
          <div className="h-16">
            <div className="h-full w-full rounded bg-gradient-to-tr from-emerald-200/70 via-emerald-400/30 to-transparent dark:from-emerald-500/20 dark:via-emerald-400/10 flex items-center justify-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {typeof metrics?.avgPrice === 'number' ? `$${metrics.avgPrice.toLocaleString()}` : '-'}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-3 col-span-2">
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">Avg. Traffic • Authority</div>
          <div className="h-16 grid grid-cols-2 gap-3">
            <div className="h-full w-full rounded bg-gradient-to-tr from-blue-200/70 via-blue-400/30 to-transparent dark:from-blue-500/20 dark:via-blue-400/10 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
              {metrics && metrics.avgTraffic > 0 ? `${(metrics.avgTraffic/1_000_000).toFixed(1)}M` : '–'}
            </div>
            <div className="h-full w-full rounded bg-gradient-to-tr from-amber-200/70 via-amber-400/30 to-transparent dark:from-amber-500/20 dark:via-amber-400/10 flex items-center justify-center text-sm font-semibold text-amber-700 dark:text-amber-300">
              {metrics && metrics.avgAuthority > 0 ? metrics.avgAuthority : '–'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


