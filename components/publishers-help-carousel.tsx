"use client"

import React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { Check, Plus } from "lucide-react"
import { useState, useEffect, useCallback } from 'react'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { useProjectStore, type UserProject } from '@/stores/project-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export type PublishersHelpCarouselProps = { 
  metrics?: { total: number; avgPrice: number; avgTraffic: number; avgAuthority: number }
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  loading?: boolean
  hasCheckoutFab?: boolean
  // Suggestions controls (optional, provided by parent)
  suggestions?: string[]
  suggestionsLoading?: boolean
  suggestionsOpen?: boolean
  setSuggestionsOpen?: (open: boolean) => void
  setSuggestionsContainerRef?: (el: HTMLDivElement | null) => void
  onPickSuggestion?: (value: string) => void
}

export default function PublishersHelpCarousel({ 
  metrics, 
  searchQuery = '',
  setSearchQuery, 
  loading = false, 
  hasCheckoutFab = false,
  suggestions = [],
  suggestionsLoading = false,
  suggestionsOpen = false,
  setSuggestionsOpen,
  setSuggestionsContainerRef,
  onPickSuggestion,
}: PublishersHelpCarouselProps) {
  const [open, setOpen] = useState(false)
  const { selectedProjectId, setSelectedProject, clearProject } = useProjectStore()
  const [projects, setProjects] = useState<UserProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: true },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  )

  const fetchProjects = useCallback(() => {
    let cancelled = false
    setProjectsLoading(true)
    fetch('/api/projects')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load projects')
        const data = await r.json()
        return data?.data ?? []
      })
      .then((list) => {
        if (cancelled) return
        setProjects(list)
        if (selectedProjectId && !list.find((p: any) => p.id === selectedProjectId)) {
          clearProject()
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load projects')
      })
      .finally(() => {
        if (cancelled) return
        setProjectsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedProjectId, clearProject])

  useEffect(() => {
    const cancel = fetchProjects()
    const handler = () => { fetchProjects() }
    window.addEventListener('project:created', handler)
    return () => { cancel?.(); window.removeEventListener('project:created', handler) }
  }, [fetchProjects])

  const onSelectProject = (p: UserProject) => {
    setSelectedProject(p as any)
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Search and controls section */}
      <div className="flex-shrink-0 mb-4">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Search & Controls</div>
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative" ref={setSuggestionsContainerRef}>
            <Input
              className="h-8 text-xs w-full"
              placeholder="Search by website or URL"
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              onFocus={() => setSuggestionsOpen?.(true)}
            />
            {/* Suggestions dropdown */}
            {suggestionsOpen && (suggestionsLoading || (suggestions && suggestions.length > 0)) && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                {suggestionsLoading ? (
                  <div className="px-3 py-2 text-[11px] text-gray-500">Searching…</div>
                ) : (
                  <ul className="max-h-56 overflow-auto no-scrollbar divide-y divide-gray-100 dark:divide-gray-800/60">
                    {suggestions.map((s, idx) => (
                      <li key={`${s}-${idx}`}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors truncate"
                          title={s}
                          onClick={() => {
                            onPickSuggestion?.(s)
                            setSuggestionsOpen?.(false)
                          }}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Quick tips section - fixed height */}
      <div className="flex-shrink-0">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quick tips</div>
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
      </div>
      
      {/* Project panel - takes remaining height */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900 p-3 sm:p-4 flex flex-col gap-3 h-full">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">You have no projects yet.</div>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2"><Check className="h-3 w-3 text-emerald-500 mt-0.5" /><span>Assign link orders to your projects.</span></li>
                <li className="flex items-start gap-2"><Check className="h-3 w-3 text-emerald-500 mt-0.5" /><span>Each project is a separate website & has its own metrics & statistics.</span></li>
                <li className="flex items-start gap-2"><Check className="h-3 w-3 text-emerald-500 mt-0.5" /><span>Add your project competitors and automatically analyze their backlinks.</span></li>
              </ul>
              
              {/* Individual Purchase Option */}
              <div className="mt-4 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                <button
                  onClick={() => clearProject()}
                  className={`w-full flex items-center gap-2 text-left px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-lg transition-colors ${!selectedProjectId
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                  aria-current={!selectedProjectId ? 'true' : undefined}
                >
                  <span className={`shrink-0 inline-flex items-center justify-center size-3 rounded-full border ${!selectedProjectId ? 'border-gray-600 bg-gray-600' : 'border-gray-300 dark:border-white/10'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">Individual Purchase</div>
                    <div className="text-[10px] text-gray-500 truncate">No project assigned</div>
                  </div>
                </button>
              </div>
            </div>
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700">
              <Plus className="h-3 w-3" />
              <span>New project</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900 px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-2 flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Your projects</div>
                <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">{projects.length}</span>
              </div>
              <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-violet-700">
                <Plus className="h-3 w-3" />
                <span>New</span>
              </button>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 flex-shrink-0">Select a project to scope your actions.</div>
            {projectsLoading ? (
              <div className="space-y-1 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-[10px] text-red-600 dark:text-red-400 flex-1">{error}</div>
            ) : (
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar">
                <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {/* Unselect Project Option */}
                  <li>
                    <button
                      onClick={() => clearProject()}
                      className={`w-full flex items-center gap-2 mt-1 text-left px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-lg transition-colors ${!selectedProjectId
                        ? 'bg-gray-50 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200'
                        : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60'}`}
                      aria-current={!selectedProjectId ? 'true' : undefined}
                    >
                      <span className={`shrink-0 inline-flex items-center justify-center size-3 rounded-full border ${!selectedProjectId ? 'border-gray-600 bg-gray-600' : 'border-gray-300 dark:border-white/10'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">Individual Purchase</div>
                        <div className="text-[10px] text-gray-500 truncate">No project assigned</div>
                      </div>
                    </button>
                  </li>
                  {projects.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => onSelectProject(p)}
                        className={`w-full flex items-center gap-2 mt-1 text-left px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-lg transition-colors ${selectedProjectId === p.id
                          ? 'bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-200'
                          : 'hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/60'}`}
                        aria-current={selectedProjectId === p.id ? 'true' : undefined}
                      >
                        <span className={`shrink-0 inline-flex items-center justify-center size-3 rounded-full border ${selectedProjectId === p.id ? 'border-violet-600 bg-violet-600' : 'border-gray-300 dark:border-white/10'}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.name || p.domain}</div>
                          {p.domain ? <div className="text-[10px] text-gray-500 truncate">{p.domain}</div> : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {projects.length > 1 && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center py-0.5 mt-0.5 border-t border-gray-100 dark:border-gray-800/60">
                    Scroll to see {projects.length - 1} more project{projects.length - 1 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <NewProjectModal open={open} onOpenChange={setOpen} />
      </div>
    </div>
  )
}


