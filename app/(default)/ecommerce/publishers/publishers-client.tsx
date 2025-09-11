"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ModalBasic from "@/components/modal-basic"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card"
import LineChart01 from "@/components/charts/line-chart-01"
import { Table, TableBody, TableCell, TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Link2,
  Clock,
  Filter as FilterIcon,
  Globe,
  Languages,
  Tag,
  DollarSign,
  Shield,
  TrendingUp,
  BarChart3,
  Layers,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { fetchSitesWithFilters, transformAPISiteToSite, type APIFilters, type Site, fetchCategoryRecommendations, type CategoryRecommendation } from "@/lib/sample-sites"
import { CartProvider, useCart } from "@/contexts/cart-context"

type Trend = "increasing" | "decreasing" | "stable"
type BacklinkNature = "do-follow" | "no-follow" | "sponsored"
type LinkPlacement = "in-content" | "author-bio" | "footer"

type Filters = {
  niche: string
  language: string
  country: string
  tool?: "Semrush" | "Ahrefs"
  daMin?: number
  daMax?: number
  paMin?: number
  paMax?: number
  drMin?: number
  drMax?: number
  spamMin?: number
  spamMax?: number
  semrushOverallTrafficMin?: number
  semrushOrganicTrafficMin?: number
  priceMin?: number
  priceMax?: number
  tatDaysMax?: number
  tatDaysMin?: number
  backlinkNature?: BacklinkNature
  backlinksAllowedMin?: number
  linkPlacement?: LinkPlacement
  permanence?: "lifetime" | "12-months"
  sampleUrl?: string
  remarkIncludes?: string
  lastPublishedAfter?: string
  outboundLinkLimitMax?: number
  guidelinesUrlIncludes?: string
  disclaimerIncludes?: string
  availability?: boolean
  trend?: Trend
}

const defaultFilters: Filters = { niche: "", language: "", country: "" }

function convertFiltersToAPI(f: Filters, searchQuery: string): APIFilters {
  const api: APIFilters = {}
  if (f.daMin !== undefined) api.domainAuthority = { ...(api.domainAuthority || {}), min: f.daMin }
  if (f.daMax !== undefined) api.domainAuthority = { ...(api.domainAuthority || {}), max: f.daMax }
  if (f.paMin !== undefined) api.pageAuthority = { ...(api.pageAuthority || {}), min: f.paMin }
  if (f.paMax !== undefined) api.pageAuthority = { ...(api.pageAuthority || {}), max: f.paMax }
  if (f.drMin !== undefined) api.domainRating = { ...(api.domainRating || {}), min: f.drMin }
  if (f.drMax !== undefined) api.domainRating = { ...(api.domainRating || {}), max: f.drMax }
  if (f.spamMin !== undefined) api.spamScore = { ...(api.spamScore || {}), min: f.spamMin }
  if (f.spamMax !== undefined) api.spamScore = { ...(api.spamScore || {}), max: f.spamMax }
  if (f.priceMin !== undefined) api.costPrice = { ...(api.costPrice || {}), min: f.priceMin }
  if (f.priceMax !== undefined) api.costPrice = { ...(api.costPrice || {}), max: f.priceMax }
  if (f.semrushOverallTrafficMin !== undefined) api.semrushTraffic = { ...(api.semrushTraffic || {}), min: f.semrushOverallTrafficMin }
  if (f.semrushOrganicTrafficMin !== undefined) api.semrushOrganicTraffic = { ...(api.semrushOrganicTraffic || {}), min: f.semrushOrganicTrafficMin }
  if (f.niche) api.niche = f.niche
  if (f.language) api.language = f.language
  if (f.country) api.webCountry = f.country
  if (f.backlinkNature) api.linkAttribute = f.backlinkNature
  if (typeof f.availability === 'boolean') api.availability = f.availability
  if (f.remarkIncludes) api.websiteRemark = f.remarkIncludes
  if (searchQuery.trim()) api.website = searchQuery.trim()
  return api
}

function FloatingFiltersDock({
  filters,
  onClearKey,
  onOpenKey,
}: {
  filters: Filters
  onClearKey: (key: keyof Filters) => void
  onOpenKey: (key: keyof Filters) => void
}) {
  const [hidden, setHidden] = React.useState<boolean>(false)
  React.useEffect(() => {
    try {
      const v = localStorage.getItem('filtersDockHidden')
      if (v) setHidden(v === '1')
    } catch {}
  }, [])
  const setHiddenPersist = (v: boolean) => {
    setHidden(v)
    try { localStorage.setItem('filtersDockHidden', v ? '1' : '0') } catch {}
  }

  const chips = React.useMemo(() => {
    const out: { key: keyof Filters; label: string }[] = []
    const add = (key: keyof Filters, label?: string, value?: unknown) => {
      if (value !== undefined && value !== '' && value !== null) out.push({ key, label: label || String(value) })
    }
    add('niche', `Niche: ${filters.niche}`, filters.niche)
    add('language', `Lang: ${filters.language}`, filters.language)
    add('country', `Country: ${filters.country}`, filters.country)
    add('daMin', `DA ≥ ${filters.daMin}`, filters.daMin)
    add('daMax', `DA ≤ ${filters.daMax}`, filters.daMax)
    add('paMin', `PA ≥ ${filters.paMin}`, filters.paMin)
    add('paMax', `PA ≤ ${filters.paMax}`, filters.paMax)
    add('drMin', `DR ≥ ${filters.drMin}`, filters.drMin)
    add('drMax', `DR ≤ ${filters.drMax}`, filters.drMax)
    add('spamMax', `Spam ≤ ${filters.spamMax}`, filters.spamMax)
    add('spamMin', `Spam ≥ ${filters.spamMin}`, filters.spamMin)
    add('semrushOverallTrafficMin', `Traffic ≥ ${filters.semrushOverallTrafficMin}`, filters.semrushOverallTrafficMin)
    add('semrushOrganicTrafficMin', `Organic ≥ ${filters.semrushOrganicTrafficMin}`, filters.semrushOrganicTrafficMin)
    add('priceMin', `$ ≥ ${filters.priceMin}`, filters.priceMin)
    add('priceMax', `$ ≤ ${filters.priceMax}`, filters.priceMax)
    add('tatDaysMin', `TAT ≥ ${filters.tatDaysMin}`, filters.tatDaysMin)
    add('tatDaysMax', `TAT ≤ ${filters.tatDaysMax}`, filters.tatDaysMax)
    add('backlinksAllowedMin', `Backlinks ≥ ${filters.backlinksAllowedMin}`, filters.backlinksAllowedMin)
    add('outboundLinkLimitMax', `Outbound ≤ ${filters.outboundLinkLimitMax}`, filters.outboundLinkLimitMax)
    add('tool', `Tool: ${filters.tool}`, filters.tool)
    add('trend', `Trend: ${filters.trend}`, filters.trend)
    add('backlinkNature', `Backlink: ${filters.backlinkNature}`, filters.backlinkNature)
    add('linkPlacement', `Placement: ${filters.linkPlacement}`, filters.linkPlacement)
    add('permanence', `Permanence: ${filters.permanence}`, filters.permanence)
    add('availability', `Available only`, filters.availability)
    return out
  }, [filters])

  const count = chips.length
  if (!count && hidden) return null

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-[60]">
      {hidden ? (
        <button
          className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-violet-100 text-violet-700 shadow-md border border-violet-200 hover:bg-violet-200 transition-colors"
          onClick={() => setHiddenPersist(false)}
          aria-label="Show filters dock"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 4h18" /><path d="M5 8h14" /><path d="M7 12h10" /><path d="M9 16h6" />
          </svg>
          <span className="text-xs font-medium">Filters ({count})</span>
        </button>
      ) : (
        <div className="max-w-[92vw] md:max-w-4xl bg-white/95 dark:bg-white/10 text-violet-800 dark:text-violet-100 rounded-2xl shadow-xl border border-violet-100 dark:border-white/15 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium pl-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3" />
              </svg>
              <span>Active Filters</span>
              <span className="opacity-60">({count})</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 h-7 rounded-full text-[11px] bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 dark:bg-white/10 dark:text-violet-100 dark:hover:bg-white/15 dark:border-white/15 transition-colors"
                onClick={() => setHiddenPersist(true)}
                aria-label="Hide filters dock"
              >
                Hide
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
            {chips.length === 0 ? (
              <span className="text-[11px] opacity-60">No filters applied</span>
            ) : chips.map(chip => (
              <span key={chip.key as string} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] bg-violet-100 text-violet-800 border border-violet-200 hover:bg-violet-200/80 dark:bg-violet-800/60 dark:text-violet-100 dark:border-violet-700 shadow-sm transition-colors">
                <button
                  className="font-medium hover:underline"
                  onClick={() => onOpenKey(chip.key)}
                >
                  {chip.label}
                </button>
                <button
                  className="ml-0.5 opacity-50 hover:opacity-100"
                  aria-label="Remove"
                  onClick={() => onClearKey(chip.key)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FiltersUI({ filters, setFilters, loading }: { filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; loading: boolean }) {
  // Saved views (localStorage)
  const [views, setViews] = useState<Array<{ id: string; name: string; filters: any }>>([])
  const [viewName, setViewName] = useState("")
  const [applyingViewId, setApplyingViewId] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<keyof Filters | null>(null)
  const [countrySearch, setCountrySearch] = useState("")
  const [nicheSearch, setNicheSearch] = useState("")
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  useEffect(() => {
    if (!nicheSearch || nicheSearch.trim().length < 2) {
      setRecommendations([])
      setCatError(null)
      return
    }
    const tid = setTimeout(async () => {
      setLoadingCats(true)
      setCatError(null)
      try {
        const recs = await fetchCategoryRecommendations(nicheSearch)
        setRecommendations(recs)
      } catch (e: any) {
        setCatError(e?.message || 'Failed to fetch')
        setRecommendations([])
      } finally {
        setLoadingCats(false)
      }
    }, 300)
    return () => clearTimeout(tid)
  }, [nicheSearch])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/views', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setViews(data.views || [])
      } catch {}
    }
    load()
  }, [])

  const persistViews = (next: Array<{ id: string; name: string; filters: any }>) => {
    setViews(next)
  }

  const saveCurrentView = async () => {
    if (loading) return
    const name = viewName.trim()
    if (!name) return
    try {
      const res = await fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, filters }) })
      if (!res.ok) return
      const refreshed = await fetch('/api/views', { cache: 'no-store' })
      const data = await refreshed.json()
      setViews(data.views || [])
      setViewName("")
    } catch {}
  }

  const applyViewById = (id: string) => {
    const v = views.find(v => v.id === id)
    if (!v) return
    setApplyingViewId(id)
    setFilters({ ...defaultFilters, ...v.filters })
    setTimeout(() => setApplyingViewId(""), 200)
  }

  const deleteViewById = async (id: string) => {
    try {
      const res = await fetch(`/api/views/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setViews(prev => prev.filter(v => v.id !== id))
        if (applyingViewId === id) setApplyingViewId("")
      }
    } catch {}
  }

  const open = (k: keyof Filters) => { if (!loading) { setActiveKey(k); setModalOpen(true) } }

  const clearKey = (k: keyof Filters) => {
    setFilters(f => {
      const val = f[k] as any
      let reset: any = ""
      if (typeof val === 'boolean') reset = undefined
      else if (typeof val === 'number') reset = undefined
      else reset = ""
      return { ...f, [k]: reset }
    })
  }

  // Dual-range slider control and helpers for min/max filters
  function RangeControl({
    label,
    minKey,
    maxKey,
    min,
    max,
    step = 1,
    formatValue = (v: number) => String(v),
  }: {
    label: string
    minKey: keyof Filters
    maxKey: keyof Filters
    min: number
    max: number
    step?: number
    formatValue?: (v: number) => string
  }) {
    const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
    const currentMin = (filters[minKey] as unknown as number) ?? min
    const currentMax = (filters[maxKey] as unknown as number) ?? max
    const low = Math.min(Math.max(currentMin, min), max)
    const high = Math.max(Math.min(currentMax, max), min)

    const setMin = (val: number) => {
      const clamped = Math.min(Math.max(val, min), high - step)
      setFilters(f => ({ ...f, [minKey]: isNaN(clamped) ? min : clamped }))
    }
    
    const setMax = (val: number) => {
      const clamped = Math.max(Math.min(val, max), low + step)
      setFilters(f => ({ ...f, [maxKey]: isNaN(clamped) ? max : clamped }))
    }

    const pct = (v: number) => ((v - min) / (max - min)) * 100

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">{label}</span>
          <span className="tabular-nums">{formatValue(low)} – {formatValue(high)}</span>
        </div>
        <div className="relative h-8 select-none">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary rounded"
            style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={low}
            onInput={(e) => setMin(Number((e.target as HTMLInputElement).value))}
            onPointerDown={() => setActiveThumb('min')}
            onPointerUp={() => setActiveThumb(null)}
            onPointerCancel={() => setActiveThumb(null)}
            className={`absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-auto cursor-pointer dual-range ${activeThumb==='min' ? 'z-30' : 'z-20'}`}
            aria-label={`${label} minimum`}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={high}
            onInput={(e) => setMax(Number((e.target as HTMLInputElement).value))}
            onPointerDown={() => setActiveThumb('max')}
            onPointerUp={() => setActiveThumb(null)}
            onPointerCancel={() => setActiveThumb(null)}
            className={`absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-auto cursor-pointer dual-range ${activeThumb==='max' ? 'z-30' : 'z-10'}`}
            aria-label={`${label} maximum`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Min</label>
            <Input
              type="number"
              value={String(low)}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Max</label>
            <Input
              type="number"
              value={String(high)}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    )
  }

  const pebbleIconMap: Partial<Record<keyof Filters, React.ReactNode>> = {
    niche: <Tag className="w-3.5 h-3.5 text-violet-600" />,
    language: <Languages className="w-3.5 h-3.5 text-violet-600" />,
    country: <Globe className="w-3.5 h-3.5 text-violet-600" />,
    priceMin: <DollarSign className="w-3.5 h-3.5 text-violet-600" />,
    daMin: <Shield className="w-3.5 h-3.5 text-violet-600" />,
    paMin: <Shield className="w-3.5 h-3.5 text-violet-600" />,
    drMin: <Shield className="w-3.5 h-3.5 text-violet-600" />,
    spamMax: <AlertTriangle className="w-3.5 h-3.5 text-violet-600" />,
    tool: <TrendingUp className="w-3.5 h-3.5 text-violet-600" />,
    semrushOverallTrafficMin: <BarChart3 className="w-3.5 h-3.5 text-violet-600" />,
    semrushOrganicTrafficMin: <BarChart3 className="w-3.5 h-3.5 text-violet-600" />,
    tatDaysMax: <Clock className="w-3.5 h-3.5 text-violet-600" />,
    trend: <TrendingUp className="w-3.5 h-3.5 text-violet-600" />,
    backlinkNature: <Link2 className="w-3.5 h-3.5 text-violet-600" />,
    linkPlacement: <Link2 className="w-3.5 h-3.5 text-violet-600" />,
    permanence: <Layers className="w-3.5 h-3.5 text-violet-600" />,
    availability: <CheckCircle className="w-3.5 h-3.5 text-violet-600" />,
  }

  const tooltipByKey: Partial<Record<keyof Filters, string>> = {
    niche: 'Filter by website topic (e.g., Technology, Health, Finance) ',
    language: 'Filter by primary language of the website',
    country: 'Filter by website country for geo‑targeted content',
    daMin: 'Minimum Moz Domain Authority',
    paMin: 'Minimum Moz Page Authority',
    drMin: 'Minimum Ahrefs Domain Rating',
    spamMax: 'Maximum Spam Score (lower is better)',
    tool: 'Choose SEO tool for metrics (Semrush or Ahrefs)',
    semrushOverallTrafficMin: 'Minimum estimated monthly overall traffic (Semrush)',
    semrushOrganicTrafficMin: 'Minimum estimated monthly organic traffic (Semrush)',
    trend: 'Traffic trend: increasing, stable, or decreasing',
    priceMin: 'Price range filter for publishing',
    tatDaysMax: 'Maximum turnaround time in days',
    backlinkNature: 'Backlink attribute: do‑follow, no‑follow, or sponsored',
    linkPlacement: 'Placement type: in‑content, author bio, or footer',
    permanence: 'How long the link remains (lifetime or 12 months)',
  }

  const pebble = (label: string, key: keyof Filters) => {
    const hasValue = filters[key] !== undefined && filters[key] !== "" && filters[key] !== null
    return (
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={() => open(key)}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-200 hover:scale-105 ${
            hasValue 
              ? "bg-violet-600 text-white border-violet-600 shadow-md" 
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          id={`filter-pebble-${String(key)}`}
          data-filter-key={String(key)}
        >
          {pebbleIconMap[key]}
          <span>{label}</span>
          {hasValue ? <span className="ml-0.5 opacity-70">•</span> : null}
        </button>
        {/* Tooltip */}
        {tooltipByKey[key] && (
          <div className="pointer-events-none absolute left-0 -top-9 ml-1 whitespace-nowrap px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[120]">
            <div className="font-medium mb-0.5">{label}</div>
            <div className="text-gray-300">{tooltipByKey[key]}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    )
  }

  // Grouped filter pebbles (compact layout like OMS filter-page)
  type FilterPebble = {
    key: keyof Filters
    label: string
    category: 'basic' | 'authority' | 'traffic' | 'publishing'
  }

  const filterPebbles: FilterPebble[] = [
    // Basic
    { key: 'niche', label: 'Niche', category: 'basic' },
    { key: 'language', label: 'Language', category: 'basic' },
    { key: 'country', label: 'Country', category: 'basic' },

    // Authority & SEO
    { key: 'daMin', label: 'Domain Authority', category: 'authority' },
    { key: 'paMin', label: 'Page Authority', category: 'authority' },
    { key: 'drMin', label: 'Domain Rating', category: 'authority' },
    { key: 'spamMax', label: 'Spam Score', category: 'authority' },
    { key: 'tool', label: 'SEO Tool', category: 'authority' },

    // Traffic & Performance
    { key: 'semrushOverallTrafficMin', label: 'Overall Traffic', category: 'traffic' },
    { key: 'semrushOrganicTrafficMin', label: 'Organic Traffic', category: 'traffic' },
    { key: 'trend', label: 'Traffic Trend', category: 'traffic' },

    // Publishing Details
    { key: 'priceMin', label: 'Price Range', category: 'publishing' },
    { key: 'tatDaysMax', label: 'TAT Days', category: 'publishing' },
    { key: 'backlinkNature', label: 'Backlink Nature', category: 'publishing' },
    { key: 'linkPlacement', label: 'Link Placement', category: 'publishing' },
    { key: 'permanence', label: 'Permanence', category: 'publishing' },
  ]

  const categoryIcons = {
    basic: <FilterIcon className="w-4 h-4" />,
    authority: <Shield className="w-4 h-4" />,
    traffic: <BarChart3 className="w-4 h-4" />,
    publishing: <Clock className="w-4 h-4" />,
  }

  const categoryLabels = {
    basic: 'Basic Info',
    authority: 'Authority & SEO',
    traffic: 'Traffic & Performance',
    publishing: 'Publishing Details',
  }

  const groupedPebbles = React.useMemo(() => {
    const groups: Record<string, FilterPebble[]> = {}
    for (const p of filterPebbles) {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    }
    return groups
  }, [])

  const renderModalBody = () => {
    if (!activeKey) return null
    switch (activeKey) {
      case 'country':
        return (
          <div className="p-4 space-y-2">
            <Select value={filters.country || undefined} onValueChange={(v) => setFilters(f => ({ ...f, country: v === '__all__' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="p-0 max-h-72 overflow-hidden">
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Search countries"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                  />
                </div>
                <SelectGroup>
                  <SelectItem value="__all__">All countries</SelectItem>
                  {[
                    "United States","United Kingdom","Canada","India","Germany","France","Spain","Australia","Netherlands","Brazil","Italy","Japan","China","Singapore","United Arab Emirates","Mexico","South Africa","New Zealand","Ireland","Sweden"
                  ]
                    .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                    .map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )
      case 'language':
  return (
          <div className="p-4 space-y-2">
            <Input placeholder="Filter languages" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
            <Select value={filters.language || undefined} onValueChange={(v) => setFilters(f => ({ ...f, language: v === '__all__' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Languages</SelectLabel>
                  <SelectItem value="__all__">All languages</SelectItem>
                  {["English","Spanish","French","German","Italian","Portuguese","Dutch","Russian","Chinese","Japanese"].filter(l => l.toLowerCase().includes(countrySearch.toLowerCase())).map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
        </div>
        )
      case 'niche':
        return (
          <div className="p-4 space-y-2">
            <Input placeholder="Enter niche" value={filters.niche} onChange={(e) => { setFilters(f => ({ ...f, niche: e.target.value })); setNicheSearch(e.target.value) }} />
            <div className="max-h-48 overflow-auto border border-gray-200 dark:border-gray-700/60 rounded p-2">
              {loadingCats ? <div className="text-sm">Loading…</div> : catError ? <div className="text-sm text-red-500">{catError}</div> : recommendations.length ? recommendations.map(r => (
                <button key={r.category} className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setFilters(f => ({ ...f, niche: r.category })); setModalOpen(false) }}>{r.category}</button>
              )) : <div className="text-sm text-gray-500">Type at least 2 characters</div>}
            </div>
          </div>
        )
      case 'priceMin':
      case 'priceMax':
      case 'daMin':
      case 'daMax':
      case 'paMin':
      case 'paMax':
      case 'drMin':
      case 'drMax':
      case 'spamMin':
      case 'spamMax':
      case 'tatDaysMin':
      case 'tatDaysMax': {
        const cfg = (key => {
          if (key === 'priceMin' || key === 'priceMax') return { label: 'Price ($)', minKey: 'priceMin', maxKey: 'priceMax', min: 0, max: 5000, step: 10, fmt: (v: number) => `$${v}` }
          if (key === 'daMin' || key === 'daMax') return { label: 'Domain Authority', minKey: 'daMin', maxKey: 'daMax', min: 0, max: 100, step: 1 }
          if (key === 'paMin' || key === 'paMax') return { label: 'Page Authority', minKey: 'paMin', maxKey: 'paMax', min: 0, max: 100, step: 1 }
          if (key === 'drMin' || key === 'drMax') return { label: 'Domain Rating', minKey: 'drMin', maxKey: 'drMax', min: 0, max: 100, step: 1 }
          if (key === 'spamMin' || key === 'spamMax') return { label: 'Spam Score', minKey: 'spamMin', maxKey: 'spamMax', min: 0, max: 10, step: 1 }
          return { label: 'Turnaround (days)', minKey: 'tatDaysMin', maxKey: 'tatDaysMax', min: 0, max: 60, step: 1 }
        })(activeKey)
        const lo = (filters as any)[cfg.minKey] ?? cfg.min
        const hi = (filters as any)[cfg.maxKey] ?? cfg.max
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">{cfg.label}</span>
              <span className="tabular-nums">{cfg.fmt ? cfg.fmt(lo) : lo} – {cfg.fmt ? cfg.fmt(hi) : hi}</span>
            </div>
            <Slider
              min={cfg.min}
              max={cfg.max}
              value={[lo, hi]}
              onValueChange={(vals: number[]) => {
                if (loading) return
                const minV = vals[0] as number
                const maxV = vals[1] as number
                setFilters(f => ({ ...f, [cfg.minKey]: minV, [cfg.maxKey]: maxV }))
              }}
            />
          </div>
        )
      }
      case 'semrushOverallTrafficMin': {
        const lo = filters.semrushOverallTrafficMin ?? 0
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">Overall Traffic (min)</span>
              <span className="tabular-nums">{(0/1000000).toFixed(1)}M – {(10000000/1000000).toFixed(1)}M</span>
            </div>
            <Slider
              min={0}
              max={10000000}
              value={[lo]}
              onValueChange={(vals: number[]) => {
                if (loading) return
                setFilters(f => ({ ...f, semrushOverallTrafficMin: vals[0] as number }))
              }}
            />
          </div>
        )
      }
      case 'semrushOrganicTrafficMin': {
        const lo = filters.semrushOrganicTrafficMin ?? 0
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">Organic Traffic (min)</span>
              <span className="tabular-nums">{(0/1000000).toFixed(1)}M – {(10000000/1000000).toFixed(1)}M</span>
            </div>
            <Slider
              min={0}
              max={10000000}
              value={[lo]}
              onValueChange={(vals: number[]) => {
                if (loading) return
                setFilters(f => ({ ...f, semrushOrganicTrafficMin: vals[0] as number }))
              }}
            />
          </div>
        )
      }
      case 'backlinksAllowedMin':
      case 'outboundLinkLimitMax':
        return (
          <div className="p-4">
            <Input type="number" placeholder="Enter value" value={String((filters as any)[activeKey] ?? "")} onChange={(e) => setFilters(f => ({ ...f, [activeKey]: e.target.value === '' ? undefined : Number(e.target.value) }))} />
          </div>
        )
      case 'availability':
        return (
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm">Show only available</div>
            <Checkbox checked={filters.availability ?? false} onCheckedChange={(checked) => setFilters(f => ({ ...f, availability: Boolean(checked) }))} />
          </div>
        )
      case 'trend':
        return (
          <div className="p-4">
            <Select value={filters.trend || undefined} onValueChange={(v) => setFilters(f => ({ ...f, trend: v === 'none' ? undefined : (v as Trend) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select trend" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="increasing">Increasing</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="decreasing">Decreasing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'backlinkNature':
        return (
          <div className="p-4">
            <Select value={filters.backlinkNature || undefined} onValueChange={(v) => setFilters(f => ({ ...f, backlinkNature: v === 'none' ? undefined : (v as BacklinkNature) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select backlink nature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="do-follow">Do-Follow</SelectItem>
                <SelectItem value="no-follow">No-Follow</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'linkPlacement':
        return (
          <div className="p-4">
            <Select value={filters.linkPlacement || undefined} onValueChange={(v) => setFilters(f => ({ ...f, linkPlacement: v === 'none' ? undefined : (v as LinkPlacement) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select link placement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="in-content">In-content</SelectItem>
                <SelectItem value="author-bio">Author Bio</SelectItem>
                <SelectItem value="footer">Footer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'permanence':
        return (
          <div className="p-4">
            <Select value={filters.permanence || undefined} onValueChange={(v) => setFilters(f => ({ ...f, permanence: v === 'none' ? undefined : (v as any) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select permanence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
                <SelectItem value="12-months">12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'tool':
        return (
          <div className="p-4">
            <Select value={filters.tool || undefined} onValueChange={(v) => setFilters(f => ({ ...f, tool: v === 'none' ? undefined : (v as any) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select SEO tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="Semrush">Semrush</SelectItem>
                <SelectItem value="Ahrefs">Ahrefs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      default:
        return <div className="p-4 text-sm text-gray-600">Not implemented</div>
    }
  }

  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = []
    const add = (key: keyof Filters, label?: string, value?: unknown) => {
      if (value !== undefined && value !== '' && value !== null) chips.push({ key, label: label || String(value) })
    }
    add('niche', `Niche: ${filters.niche}`, filters.niche)
    add('language', `Lang: ${filters.language}`, filters.language)
    add('country', `Country: ${filters.country}`, filters.country)
    add('daMin', `DA ≥ ${filters.daMin}`, filters.daMin)
    add('daMax', `DA ≤ ${filters.daMax}`, filters.daMax)
    add('paMin', `PA ≥ ${filters.paMin}`, filters.paMin)
    add('paMax', `PA ≤ ${filters.paMax}`, filters.paMax)
    add('drMin', `DR ≥ ${filters.drMin}`, filters.drMin)
    add('drMax', `DR ≤ ${filters.drMax}`, filters.drMax)
    add('spamMax', `Spam ≤ ${filters.spamMax}`, filters.spamMax)
    add('spamMin', `Spam ≥ ${filters.spamMin}`, filters.spamMin)
    add('semrushOverallTrafficMin', `Traffic ≥ ${filters.semrushOverallTrafficMin}`, filters.semrushOverallTrafficMin)
    add('semrushOrganicTrafficMin', `Organic ≥ ${filters.semrushOrganicTrafficMin}`, filters.semrushOrganicTrafficMin)
    add('priceMin', `$ ≥ ${filters.priceMin}`, filters.priceMin)
    add('priceMax', `$ ≤ ${filters.priceMax}`, filters.priceMax)
    add('tatDaysMin', `TAT ≥ ${filters.tatDaysMin}`, filters.tatDaysMin)
    add('tatDaysMax', `TAT ≤ ${filters.tatDaysMax}`, filters.tatDaysMax)
    add('backlinksAllowedMin', `Backlinks ≥ ${filters.backlinksAllowedMin}`, filters.backlinksAllowedMin)
    add('outboundLinkLimitMax', `Outbound ≤ ${filters.outboundLinkLimitMax}`, filters.outboundLinkLimitMax)
    add('tool', `Tool: ${filters.tool}`, filters.tool)
    add('trend', `Trend: ${filters.trend}`, filters.trend)
    add('backlinkNature', `Backlink: ${filters.backlinkNature}`, filters.backlinkNature)
    add('linkPlacement', `Placement: ${filters.linkPlacement}`, filters.linkPlacement)
    add('permanence', `Permanence: ${filters.permanence}`, filters.permanence)
    add('availability', `Available only`, filters.availability)
    return chips
  }, [filters])

  return (
    <Card className="mb-4 bg-white dark:bg-gray-800">
      <UICardHeader className="pb-1">
        <UICardTitle className="text-base">Filters</UICardTitle>
      </UICardHeader>
      <CardContent className="pt-1">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-violet-600" />
          <h2 className="text-sm font-medium">Refine Results</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Apply saved view */}
          <Select value={applyingViewId || undefined} onValueChange={(v) => { if (v === '__none__') { setApplyingViewId(""); return } applyViewById(v) }}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder={views.length ? 'Apply saved view' : 'No saved views'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Saved Views</SelectLabel>
                <SelectItem value="__none__">None</SelectItem>
                {views.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* Save as view */}
          <Input className="h-8 text-xs w-48" placeholder="Save as view..." value={viewName} onChange={(e) => setViewName(e.target.value)} disabled={loading} />
          <Button className="h-8 inline-flex items-center gap-1.5 text-xs px-3" onClick={saveCurrentView} disabled={loading || !viewName.trim()}>
            <CheckCircle className="w-3 h-3" />
            Save
          </Button>
          <Button variant="outline" className="h-8 inline-flex items-center gap-1.5 text-xs px-3" onClick={() => setFilters(defaultFilters)} disabled={loading}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </Button>
          <Button className="h-8 text-xs px-3" variant="secondary" onClick={() => setFilters(defaultFilters)} disabled={loading}>Reset All</Button>
        </div>
      </div>

      {/* Grouped filter pebbles */}
      <div className="space-y-2">
        {Object.entries(groupedPebbles).map(([category, pebbles]) => (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {categoryIcons[category as keyof typeof categoryIcons]}
              <span className="font-medium">{categoryLabels[category as keyof typeof categoryLabels]}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pebbles.map(p => (
                <span key={p.key}>{pebble(p.label, p.key)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeChips.map(chip => (
            <button key={chip.key as string} onClick={() => open(chip.key)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs bg-violet-600 text-white border border-violet-600 hover:bg-violet-700 transition-all duration-200 hover:scale-105">
              <span>{chip.label}</span>
              <span onClick={(e) => { e.stopPropagation(); clearKey(chip.key) }} aria-label="Remove" className="opacity-70 hover:opacity-100">✕</span>
            </button>
          ))}
        </div>
      )}

      <ModalBasic title={activeKey ? `Filter: ${String(activeKey)}` : 'Filter'} isOpen={modalOpen} setIsOpen={setModalOpen}>
        {renderModalBody()}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700/60 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={() => setModalOpen(false)} disabled={loading}>Apply</Button>
        </div>
      </ModalBasic>
      </CardContent>
    </Card>
  )
}

function ResultsTable({ sites, loading, sortBy, setSortBy }: { sites: Site[]; loading: boolean; sortBy: 'relevance' | 'nameAsc' | 'priceLow' | 'authorityHigh'; setSortBy: (v: 'relevance' | 'nameAsc' | 'priceLow' | 'authorityHigh') => void }) {
  const { addItem, removeItem, isItemInCart } = useCart()
  const [rowLevel, setRowLevel] = useState<1 | 2 | 3 | 4>(4)
  const rowPaddingByLevel: Record<1|2|3|4, string> = { 1: 'py-2.5', 2: 'py-3.5', 3: 'py-4.5', 4: 'py-5.5' }
  const [rowsOpen, setRowsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  // Column visibility controller (modeled after OMS filter-page)
  type ColumnKey =
    | 'name'
    | 'niche'
    | 'countryLang'
    | 'authority'
    | 'spam'
    | 'price'
    | 'trend'
    | 'cart'
    | 'website'
    | 'traffic'
    | 'organicTraffic'
    | 'authorityScore'
    | 'availability'
    | 'sampleUrl'
    | 'lastPublished'
    | 'outboundLimit'
    | 'backlinkNature'
    | 'backlinksAllowed'
    | 'wordLimit'
    | 'tatDays'
    | 'linkPlacement'
    | 'permanence'
    | 'order'
  
  // Default visible columns matching OMS data page (8 columns)
  const defaultVisibleColumns: ColumnKey[] = ['name', 'niche', 'countryLang', 'authority', 'spam', 'price', 'trend', 'cart']
  
  const columnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'name', label: 'Website' },
    { key: 'niche', label: 'Niche' },
    { key: 'countryLang', label: 'Country/Lang' },
    { key: 'authority', label: 'Authority' },
    { key: 'spam', label: 'Spam' },
    { key: 'price', label: 'Price' },
    { key: 'trend', label: 'Trend' },
    { key: 'cart', label: 'Cart' },
    { key: 'traffic', label: 'Traffic' },
    { key: 'organicTraffic', label: 'Organic' },
    { key: 'authorityScore', label: 'Authority Score' },
    { key: 'availability', label: 'Availability' },
    { key: 'sampleUrl', label: 'Sample URL' },
    { key: 'lastPublished', label: 'Last Published' },
    { key: 'outboundLimit', label: 'Outbound Limit' },
    { key: 'backlinkNature', label: 'Backlink Nature' },
    { key: 'backlinksAllowed', label: 'Backlinks Allowed' },
    { key: 'wordLimit', label: 'Word Limit' },
    { key: 'tatDays', label: 'TAT (days)' },
    { key: 'linkPlacement', label: 'Placement' },
    { key: 'permanence', label: 'Permanence' },
    { key: 'order', label: 'Order' },
  ]
  const allKeys = useMemo(() => columnDefs.map(c => c.key), [])
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(defaultVisibleColumns)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const columnsRef = useRef<HTMLDivElement | null>(null)
  const toggleColumn = (key: ColumnKey) => setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  const showAllColumns = () => setVisibleColumns(allKeys)
  const hideAllColumns = () => setVisibleColumns([])
  const resetColumns = () => setVisibleColumns(defaultVisibleColumns)
  const rightAligned = useMemo(() => new Set<ColumnKey>([
    'price','traffic','organicTraffic','authorityScore','outboundLimit','backlinksAllowed','wordLimit','tatDays'
  ]), [])
  const centerAligned = useMemo(() => new Set<ColumnKey>(['spam']), [])
  // Close Columns dropdown on outside click or Escape
  useEffect(() => {
    if (!columnsOpen) return
    const onDown = (e: MouseEvent) => {
      const el = columnsRef.current
      if (el && !el.contains(e.target as Node)) setColumnsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setColumnsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [columnsOpen])

  const renderCell = (key: ColumnKey, s: Site) => {
    switch (key) {
      case 'name':
        return (
          <div className="font-medium">
            <a href={s.url} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 underline" onClick={(e) => e.stopPropagation()}>{s.name}</a>
            {rowLevel >= 2 && (<div className="text-xs text-gray-500">{s.url.replace(/^https?:\/\//, "")}</div>)}
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Category:</span> {s.category}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Language:</span> {s.language}</div>)}
          </div>
        )
      case 'niche':
        return (
          <div>
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {s.niche.split(',').map(n => n.trim()).filter(Boolean).map((n, idx) => (
                <span key={`${n}-${idx}`} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-600">{n}</span>
              ))}
            </div>
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Type:</span> {s.category}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Country:</span> {s.country}</div>)}
          </div>
        )
      case 'countryLang':
        return (<div className="text-sm">{s.country} • <span className="text-xs">{s.language}</span></div>)
      case 'authority':
        return (
          <>
            {s.da}/{s.pa}/{s.dr}
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">DA:</span> {s.da}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">PA:</span> {s.pa} <span className="text-gray-400">| DR:</span> {s.dr}</div>)}
          </>
        )
      case 'spam':
        return (
          <div className="inline-flex items-center gap-2 justify-center w-full">
            <span className="tabular-nums">{s.spamScore}%</span>
            {(() => {
              const risk = s.spamScore <= 3 ? 'Low' : s.spamScore <= 6 ? 'Medium' : 'High'
              if (risk === 'High') return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> High
                </span>
              )
              if (risk === 'Medium') return (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">Medium</span>
              )
              return (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">Low</span>
              )
            })()}
          </div>
        )
      case 'price':
        return (
          <>
            <span className="font-medium tabular-nums">{"$"}{s.publishing.price.toLocaleString()}</span>
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Base:</span> ${s.publishing.price}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">With Content:</span> ${s.publishing.priceWithContent}</div>)}
          </>
        )
      case 'trend':
        return (
          <div className="group relative inline-flex items-center gap-1.5 text-sm">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">{s.toolScores.trafficTrend || 'stable'}</span>
            {/* Hover panel with mini charts */}
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 w-80 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity p-3 z-[5000] max-h-64 overflow-auto">
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">Overall Traffic</div>
                  <LineChart01
                    width={260}
                    height={60}
                    data={{
                      labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                      datasets: [
                        {
                          data: Array.from({ length: 12 }, () =>
                            Math.max(1000, (s.toolScores.semrushOverallTraffic / 12) * (0.7 + Math.random() * 0.6))
                          ),
                          borderColor: '#7c3aed',
                          fill: true,
                        },
                      ],
                    }}
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">Organic Traffic</div>
                  <LineChart01
                    width={260}
                    height={60}
                    data={{
                      labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                      datasets: [
                        {
                          data: Array.from({ length: 12 }, () =>
                            Math.max(1000, (s.toolScores.semrushOrganicTraffic / 12) * (0.7 + Math.random() * 0.6))
                          ),
                          borderColor: '#22c55e',
                          fill: true,
                        },
                      ],
                    }}
                  />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-0.5">Semrush Authority</div>
                  <LineChart01
                    width={260}
                    height={60}
                    data={{
                      labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                      datasets: [
                        {
                          data: Array.from({ length: 12 }, () => Math.max(1, s.toolScores.semrushAuthority * (0.7 + Math.random() * 0.6))),
                          borderColor: '#6366f1',
                          fill: true,
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 'cart':
        return (
          <>
            {isItemInCart(s.id) ? (
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500" onClick={(e) => { e.stopPropagation() }}>In Cart</Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); removeItem(s.id) }}>Remove</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); addItem(s) }}>Add to Cart</Button>
            )}
          </>
        )
      case 'website':
        return (
          <div className="font-medium">
            <a href={s.url} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 underline" onClick={(e) => e.stopPropagation()}>{s.name}</a>
            {rowLevel >= 2 && (<div className="text-xs text-gray-500">{s.url.replace(/^https?:\/\//, "")}</div>)}
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Category:</span> {s.category}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Language:</span> {s.language}</div>)}
          </div>
        )
      case 'traffic':
        return (
          <>
            <span className="tabular-nums">{(s.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M</span>
            {rowLevel >= 2 && (<div className="text-xs text-gray-500">overall</div>)}
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Organic:</span> {(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Authority:</span> {s.toolScores.semrushAuthority}</div>)}
          </>
        )
      case 'organicTraffic':
        return (<span className="tabular-nums">{(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</span>)
      case 'authorityScore':
        return (<span className="tabular-nums">{s.toolScores.semrushAuthority}</span>)
      case 'availability':
        return s.additional.availability ? (<Badge variant="secondary">Available</Badge>) : (<Badge variant="outline">Unavailable</Badge>)
      case 'sampleUrl':
        return s.quality?.sampleUrl ? (
          <a className="text-violet-600 hover:text-violet-700 underline" href={s.quality.sampleUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View</a>
        ) : (<span className="text-gray-400">-</span>)
      case 'lastPublished':
        return s.quality?.lastPublished || 'Unknown'
      case 'outboundLimit':
        return (<span className="tabular-nums">{s.quality?.outboundLinkLimit ?? '-'}</span>)
      case 'backlinkNature':
        return (
          <div className="inline-flex items-center gap-1.5 text-sm">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{s.publishing.backlinkNature}</span>
          </div>
        )
      case 'backlinksAllowed':
        return (<span className="tabular-nums">{s.publishing.backlinksAllowed}</span>)
      case 'wordLimit':
        return (<span className="tabular-nums">{s.publishing.wordLimit ?? '-'}</span>)
      case 'tatDays':
        return (
          <div className={`inline-flex items-center gap-1.5 ${rightAligned.has('tatDays') ? 'justify-end' : ''}`}>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="tabular-nums">{s.publishing.tatDays}</span>
          </div>
        )
      case 'linkPlacement':
        return s.publishing.linkPlacement ?? '-'
      case 'permanence':
        return s.publishing.permanence ?? '-'
      case 'order':
        return null
      default:
        return null
    }
  }

  if (loading) return <Card className="p-6 bg-white dark:bg-gray-800">Loading…</Card>
  return (
          <Card className="bg-white dark:bg-gray-800">
      <header className="px-4 py-1.5 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm tracking-tight">All Publishers <span className="text-gray-400 dark:text-gray-500 font-medium">{sites.length}</span></h2>
        <div className="flex items-center gap-1.5">
          <Popover open={rowsOpen} onOpenChange={setRowsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs inline-flex items-center gap-1.5 px-2">
              <span>Rows: {rowLevel === 1 ? 'Short' : rowLevel === 2 ? 'Medium' : rowLevel === 3 ? 'Tall' : 'Extra Tall'}</span>
              <svg className={`w-3 h-3 transition-transform ${rowsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 bg-white dark:bg-gray-800 border-[0.5px] border-gray-200 dark:border-white/10">
            <div className="space-y-1">
              {[1,2,3,4].map((lvl) => (
                <button key={lvl} className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${rowLevel===lvl ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`} onClick={() => setRowLevel(lvl as 1|2|3|4)}>
                  {lvl===1?'Short':lvl===2?'Medium':lvl===3?'Tall':'Extra Tall'}
                </button>
              ))}
            </div>
          </PopoverContent>
          </Popover>
          <div className="relative" ref={columnsRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs inline-flex items-center gap-1.5 px-2"
              onClick={() => setColumnsOpen(o => !o)}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="4" width="5" height="16" rx="1" />
                <rect x="10" y="4" width="5" height="16" rx="1" />
                <rect x="17" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Columns</span>
              <svg className={`w-3 h-3 transition-transform ${columnsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </Button>
            {columnsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border-[0.5px] border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50">
                <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <button className="text-[10px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={showAllColumns}>Show all</button>
                  <button className="text-[10px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={resetColumns}>Reset</button>
                  <button className="text-[10px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={hideAllColumns}>Hide all</button>
                </div>
                <div className="max-h-48 overflow-auto py-1">
                  {columnDefs.map(col => (
                    <label key={col.key} className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer select-none">
                      <Checkbox
                        checked={visibleColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <span>{col.label}</span>
                      {visibleColumns.includes(col.key) ? (
                        <svg className="w-3 h-3 text-green-500 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-gray-400 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.94" />
                          <path d="M1 1l22 22" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
                {visibleColumns.length !== allKeys.length && (
                  <div className="px-2 py-1.5 text-[10px] text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60">
                    Showing {visibleColumns.length} of {allKeys.length} columns
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="nameAsc">Name: A → Z</SelectItem>
                <SelectItem value="priceLow">Price: Low → High</SelectItem>
                <SelectItem value="authorityHigh">Authority: High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
            <div className="overflow-x-auto">
              <Table className="dark:text-gray-300">
                <UITableHeader>
                  <TableRow className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 border-t border-b border-gray-100 dark:border-gray-700/60">
                    {columnDefs.map(col => (
                      visibleColumns.includes(col.key) ? (
                        <TableHead key={col.key} className={`px-5 py-3 whitespace-nowrap ${rightAligned.has(col.key) ? 'text-right' : centerAligned.has(col.key) ? 'text-center' : 'text-left'}`}>
                          <div className="inline-flex items-center gap-2">
                            <span>{col.label}</span>
                            {col.key === 'trend' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">Hover for charts</span>
                            )}
                          </div>
                        </TableHead>
                      ) : null
                    ))}
                  </TableRow>
                </UITableHeader>
                <TableBody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
            {sites.length === 0 ? (
              <TableRow><TableCell className="px-5 py-6" colSpan={visibleColumns.length || 1}>No results</TableCell></TableRow>
            ) : sites.map(s => (
              <TableRow key={s.id} className={`${rowPaddingByLevel[rowLevel]} cursor-pointer odd:bg-gray-50/40 dark:odd:bg-gray-800/20`} onClick={() => { setSelectedSite(s); setDetailsOpen(true) }}>
                {columnDefs.map(col => (
                  visibleColumns.includes(col.key) ? (
                    <TableCell key={col.key}
                      className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has(col.key) ? 'text-right' : centerAligned.has(col.key) ? 'text-center' : 'text-left'}`}
                    >
                      {renderCell(col.key, s)}
                </TableCell>
                  ) : null
                ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogContent className="max-w-7xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-950 p-0 overflow-hidden text-[13px]">
                <DialogHeader className="sticky top-0 z-20 px-6 py-5 border-b border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                  <DialogTitle className="flex items-start justify-between gap-4">
                    {selectedSite ? (
                      <div className="min-w-0">
                        <div className="text-lg sm:text-xl font-semibold tracking-tight truncate">{selectedSite.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedSite.url}</div>
                      </div>
                    ) : (
                      <span>Site Details</span>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {selectedSite && (
                  <div className="flex flex-col max-h-[80vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-6 overflow-y-auto">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">URL</span>
                            <span className="font-medium truncate ml-3"><a href={selectedSite.url} className="text-violet-600 hover:text-violet-700 underline" target="_blank" rel="noreferrer">{selectedSite.url}</a></span>
                      </div>
                          <div className="flex items-start justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 mt-0.5">Niche</span>
                            <span className="ml-3 inline-flex flex-wrap gap-1.5 max-w-[18rem] justify-end">
                              {selectedSite.niche.split(',').map(n => n.trim()).filter(Boolean).map((n, idx) => (
                                <span key={`${n}-${idx}`} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
                                  {n}
                                </span>
                              ))}
                            </span>
                      </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Category</span>
                            <span className="font-medium ml-3">{selectedSite.category}</span>
                      </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Language</span>
                            <span className="font-medium ml-3">{selectedSite.language}</span>
                      </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Country</span>
                            <span className="font-medium ml-3">{selectedSite.country}</span>
                      </div>
                      </div>
                    </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Authority Metrics</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Domain Authority</span><span className="font-semibold tabular-nums">{selectedSite.da}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Page Authority</span><span className="font-semibold tabular-nums">{selectedSite.pa}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Domain Rating</span><span className="font-semibold tabular-nums">{selectedSite.dr}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Spam Score</span><span className="font-semibold tabular-nums">{selectedSite.spamScore}%</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Data</div>
                        <div className="space-y-2.5">
                          <div className="group flex items-center justify-between text-xs relative">
                            <span className="text-gray-600 dark:text-gray-400">Semrush Authority</span>
                            <span className="font-semibold tabular-nums">{selectedSite.toolScores.semrushAuthority}</span>
                            <div className="pointer-events-none absolute right-0 top-full mt-2 w-72 h-40 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity max-w-[calc(100vw-2rem)]">
                              <div className="p-2 h-full">
                                <LineChart01
                                  width={300}
                                  height={120}
                                  data={{
                                    labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                                    datasets: [
                                      {
                                        data: Array.from({ length: 12 }, () => Math.max(1, selectedSite.toolScores.semrushAuthority * (0.7 + Math.random() * 0.6))),
                                        borderColor: '#7c3aed',
                                        fill: true,
                                      },
                                    ],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="group flex items-center justify-between text-xs relative">
                            <span className="text-gray-600 dark:text-gray-400">Overall Traffic</span>
                            <span className="font-semibold tabular-nums">{(selectedSite.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M</span>
                            <div className="pointer-events-none absolute right-0 top-full mt-2 w-72 h-40 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity max-w-[calc(100vw-2rem)]">
                              <div className="p-2 h-full">
                                <LineChart01
                                  width={300}
                                  height={120}
                                  data={{
                                    labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                                    datasets: [
                                      {
                                        data: Array.from({ length: 12 }, () =>
                                          Math.max(1000, (selectedSite.toolScores.semrushOverallTraffic / 12) * (0.7 + Math.random() * 0.6))
                                        ),
                                        borderColor: '#7c3aed',
                                        fill: true,
                                      },
                                    ],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="group flex items-center justify-between text-xs relative">
                            <span className="text-gray-600 dark:text-gray-400">Organic Traffic</span>
                            <span className="font-semibold tabular-nums">{(selectedSite.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</span>
                            <div className="pointer-events-none absolute right-0 top-full mt-2 w-72 h-40 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity max-w-[calc(100vw-2rem)]">
                              <div className="p-2 h-full">
                                <LineChart01
                                  width={300}
                                  height={120}
                                  data={{
                                    labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                                    datasets: [
                                      {
                                        data: Array.from({ length: 12 }, () =>
                                          Math.max(1000, (selectedSite.toolScores.semrushOrganicTraffic / 12) * (0.7 + Math.random() * 0.6))
                                        ),
                                        borderColor: '#22c55e',
                                        fill: true,
                                      },
                                    ],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Traffic Trend</span><span className="font-semibold capitalize">{selectedSite.toolScores.trafficTrend}</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Publishing Details</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Price</span><span className="font-semibold tabular-nums">${selectedSite.publishing.price.toLocaleString()}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Price with Content</span><span className="font-semibold tabular-nums">${selectedSite.publishing.priceWithContent}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Word Limit</span><span className="font-semibold tabular-nums">{selectedSite.publishing.wordLimit}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">TAT Days</span><span className="font-semibold tabular-nums">{selectedSite.publishing.tatDays}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Backlink Nature</span><span className="font-semibold">{selectedSite.publishing.backlinkNature}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Link Placement</span><span className="font-semibold">{selectedSite.publishing.linkPlacement}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Permanence</span><span className="font-semibold">{selectedSite.publishing.permanence}</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Quality Metrics</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Sample URL</span><span className="font-semibold">{selectedSite.quality?.sampleUrl ? <a className="text-violet-600 hover:text-violet-700 underline" href={selectedSite.quality.sampleUrl} target="_blank" rel="noreferrer">View</a> : '-'}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Last Published</span><span className="font-semibold tabular-nums">{selectedSite.quality?.lastPublished}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Outbound Link Limit</span><span className="font-semibold tabular-nums">{selectedSite.quality?.outboundLinkLimit}</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Info</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Disclaimer</span><span className="font-semibold">{selectedSite.additional.disclaimer || '-'}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Availability</span><span className="font-semibold">{selectedSite.additional.availability ? 'Available' : 'Unavailable'}</span></div>
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Remark</span><span className="font-semibold">{selectedSite.quality?.remark || '-'}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                      {isItemInCart(selectedSite.id) ? (
                        <>
                          <Button className="bg-violet-600 text-white hover:bg-violet-500" onClick={() => { /* keep as visual state */ }}>{'In Cart'}</Button>
                          <Button variant="outline" onClick={() => removeItem(selectedSite.id)}>Remove from Cart</Button>
                        </>
                      ) : (
                        <Button className="bg-violet-600 text-white hover:bg-violet-500" onClick={() => addItem(selectedSite)}>Add to Cart</Button>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </Card>
  )
}

export default function PublishersClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  function HeaderCheckout() {
    const { getTotalItems } = useCart()
    const count = getTotalItems()
    if (count <= 0) return null
    return (
      <>
        {/* Inline checkout button (subtle purple) */}
        <Button asChild className="h-8 text-xs px-3 bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500">
          <a href="/checkout">Checkout ({count})</a>
        </Button>
        {/* Floating persistent checkout button for long lists */}
        <Button
          asChild
          className="fixed bottom-5 right-5 z-50 h-10 px-4 rounded-full shadow-lg bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          <a href="/checkout" aria-label={`Checkout (${count})`}>
            Checkout ({count})
          </a>
        </Button>
      </>
    )
  }

  const parseFiltersFromParams = React.useCallback((sp: URLSearchParams): Filters => {
    const getNum = (k: string) => {
      const v = sp.get(k)
      if (v === null || v === "") return undefined
      const n = Number(v)
      return isNaN(n) ? undefined : n
    }
    const getStr = (k: string) => sp.get(k) || ""
    const getOptStr = (k: string): string | undefined => {
      const v = sp.get(k)
      return v && v !== "" ? v : undefined
    }
    const getBool = (k: string) => {
      const v = sp.get(k)
      if (v === null) return undefined
      return v === "1" || v === "true"
    }
    const parsed: Filters = {
      niche: getStr('niche'),
      language: getStr('language'),
      country: getStr('country'),
      tool: getOptStr('tool') as any,
      daMin: getNum('daMin'),
      daMax: getNum('daMax'),
      paMin: getNum('paMin'),
      paMax: getNum('paMax'),
      drMin: getNum('drMin'),
      drMax: getNum('drMax'),
      spamMin: getNum('spamMin'),
      spamMax: getNum('spamMax'),
      semrushOverallTrafficMin: getNum('semrushOverallTrafficMin'),
      semrushOrganicTrafficMin: getNum('semrushOrganicTrafficMin'),
      priceMin: getNum('priceMin'),
      priceMax: getNum('priceMax'),
      tatDaysMax: getNum('tatDaysMax'),
      tatDaysMin: getNum('tatDaysMin'),
      backlinkNature: getOptStr('backlinkNature') as any,
      backlinksAllowedMin: getNum('backlinksAllowedMin'),
      linkPlacement: getOptStr('linkPlacement') as any,
      permanence: getOptStr('permanence') as any,
      sampleUrl: getStr('sampleUrl') || undefined,
      remarkIncludes: getStr('remarkIncludes') || undefined,
      lastPublishedAfter: getStr('lastPublishedAfter') || undefined,
      outboundLinkLimitMax: getNum('outboundLinkLimitMax'),
      guidelinesUrlIncludes: getStr('guidelinesUrlIncludes') || undefined,
      disclaimerIncludes: getStr('disclaimerIncludes') || undefined,
      availability: getBool('availability'),
      trend: getOptStr('trend') as any,
    }
    return { ...defaultFilters, ...parsed }
  }, [])

  const [filters, setFilters] = useState<Filters>(() => parseFiltersFromParams(new URLSearchParams(searchParams?.toString() || "")))
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('q') || "")
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'nameAsc' | 'priceLow' | 'authorityHigh'>('relevance')
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPostedQueryRef = useRef<string>("")

  const fetchData = async (apiFilters: APIFilters = {}, skipLoading = false) => {
    if (loading && !skipLoading) return
    if (!skipLoading) setLoading(true)
    setError(null)
    try {
      const apiSites = await fetchSitesWithFilters(apiFilters)
      const transformed = apiSites.map(transformAPISiteToSite)
      setSites(transformed)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
      setSites([])
    } finally {
      if (!skipLoading) setLoading(false)
    }
  }

  const debouncedFetch = useCallback((apiFilters: APIFilters, delay = 400) => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    fetchTimeoutRef.current = setTimeout(() => { fetchData(apiFilters) }, delay)
  }, [])

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const apiFilters = convertFiltersToAPI(filters, searchQuery)
    debouncedFetch(apiFilters, 500)
  }, [filters, searchQuery, debouncedFetch])

  // Keep URL params in sync with filters and search query
  useEffect(() => {
    const sp = new URLSearchParams()
    const setIf = (k: string, v: unknown) => {
      if (v === undefined || v === null) return
      if (typeof v === 'string' && v.trim() === '') return
      sp.set(k, String(v))
    }
    setIf('q', searchQuery)
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      if (typeof v === 'string' && v.trim() === '') return
      if (typeof v === 'boolean') {
        if (v) sp.set(k, '1')
        return
      }
      setIf(k, v as any)
    })
    const qs = sp.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    router.replace(url, { scroll: false })
  }, [filters, searchQuery, pathname, router])

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sites
    return sites.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
  }, [sites, searchQuery])

  const displayedSites = useMemo(() => {
    const arr = [...results]
    switch (sortBy) {
      case 'nameAsc':
        arr.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'priceLow':
        arr.sort((a, b) => (a.publishing.price || 0) - (b.publishing.price || 0))
        break
      case 'authorityHigh':
        arr.sort((a, b) => (b.da + b.pa + b.dr) - (a.da + a.pa + a.dr))
        break
      default:
        break
    }
    return arr
  }, [results, sortBy])

  // Save interest only if, after a short delay, results remain zero for a meaningful query
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 3) return
    if (lastPostedQueryRef.current === q) return

    const timeoutId = setTimeout(async () => {
      // Re-check latest state after delay to avoid saving transient/noisy queries
      const latestQuery = searchQuery.trim()
      const stillSameQuery = latestQuery === q
      const stillLoading = loading
      const stillZeroResults = results.length === 0
      if (!stillSameQuery || stillLoading || !stillZeroResults) return
      try {
        const controller = new AbortController()
        const apiFilters = convertFiltersToAPI(filters, latestQuery)
        await fetch('/api/search-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: latestQuery, filters: apiFilters }),
          signal: controller.signal,
        })
        lastPostedQueryRef.current = latestQuery
      } catch {}
    }, 1200)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchQuery, results.length, loading, filters])

  return (
    <CartProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[96rem] mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-4">
          <h1 className="text-xl md:text-2xl text-foreground font-bold">Publishers</h1>
          <div className="flex items-center gap-2">
            <Input className="h-8 text-xs w-56" placeholder="Search by website or URL" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Button variant="outline" className="h-8 text-xs px-3" onClick={() => { if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current); fetchData(convertFiltersToAPI(filters, searchQuery)) }} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
            <Button className="h-8 text-xs px-3" variant="secondary" onClick={() => { setFilters(defaultFilters); setSearchQuery(""); router.replace(pathname, { scroll: false }) }}>Reset</Button>
            <HeaderCheckout />
          </div>
        </div>

        <FiltersUI filters={filters} setFilters={setFilters} loading={loading} />

        {error && <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">{error}</div>}

        <ResultsTable sites={displayedSites} loading={loading} sortBy={sortBy} setSortBy={(v) => setSortBy(v)} />

        {/* Floating Filters Dock */}
        <FloatingFiltersDock
          filters={filters}
          onClearKey={(k) => {
            setFilters(f => {
              const current = (f as any)[k]
              let reset: any = ""
              if (typeof current === 'boolean') reset = undefined
              else if (typeof current === 'number') reset = undefined
              else reset = ""
              return { ...f, [k]: reset }
            })
          }}
          onOpenKey={(k) => {
            const el = document.getElementById(`filter-pebble-${String(k)}`)
            if (el) {
              el.click()
              // If the original filters header scrolled off, scroll into view softly
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }}
        />
      </div>
    </CartProvider>
  )
}




