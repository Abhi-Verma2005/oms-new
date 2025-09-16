"use client"

import React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Check, Plus } from "lucide-react"

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
      {/* Empty state callout replacing metrics */}
      <div className="mt-4">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900 p-5 sm:p-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">You have no projects yet.</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 mt-0.5" /><span>Assign link orders to your projects.</span></li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 mt-0.5" /><span>Each project is a separate website & has its own metrics & statistics.</span></li>
              <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 mt-0.5" /><span>Add your project competitors and automatically analyze their backlinks.</span></li>
            </ul>
          </div>
          <button className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
            <Plus className="h-4 w-4" />
            <span>New project</span>
          </button>
        </div>
      </div>
    </div>
  )
}


