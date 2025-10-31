"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card"
import LineChart01 from "@/components/charts/line-chart-01"
import DoughnutChart from "@/components/charts/doughnut-chart"
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
  RefreshCw,
  Bot
} from "lucide-react"
import { fetchSitesWithFilters, transformAPISiteToSite, type APIFilters, type Site, fetchCategoryRecommendations, type CategoryRecommendation } from "@/lib/sample-sites"
import PaginationPublishers from "@/components/pagination-publishers"
import { useCart } from "@/contexts/cart-context"
import { useWishlist } from "@/contexts/wishlist-context"
import { useSearchToChatStore } from '@/stores/search-to-chat-store'
import { useAIChatUtils } from '@/lib/ai-chat-utils'
import { Flag } from "@/components/ui/flag"
import { AhrefsIcon, SemrushIcon, MozIcon } from "@/components/ui/brand-icons"
import dynamic from "next/dynamic"
const PublishersHelpCarousel = dynamic(() => import("@/components/publishers-help-carousel"), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 dark:bg-gray-900 animate-pulse rounded-lg" />
})
import { ProjectSelector } from '@/components/projects/project-selector'
import ProjectToggleCompact from '@/components/projects/project-toggle-compact'
import { useActivityLogger } from '@/lib/user-activity-client'
import { useProjectStore } from '@/stores/project-store'
import { useFilterStore, type Filters as StoreFilters } from '@/stores/filter-store'
import ModalBasic from '@/components/modal-basic'
import { useResizableLayout } from '@/components/resizable-layout'
import { useLayout } from '@/contexts/LayoutContext'

type Trend = "increasing" | "decreasing" | "stable"
type BacklinkNature = "do-follow" | "no-follow" | "sponsored"
type LinkPlacement = "in-content" | "author-bio" | "footer"

type Filters = {
  niche?: string
  language?: string
  country?: string
  tool?: string
  daMin?: number
  daMax?: number
  paMin?: number
  paMax?: number
  drMin?: number
  drMax?: number
  spamMin?: number
  spamMax?: number
  semrushOverallTrafficMin?: number
  semrushOverallTrafficMax?: number
  semrushOrganicTrafficMin?: number
  semrushOrganicTrafficMax?: number
  priceMin?: number
  priceMax?: number
  tatDaysMax?: number
  tatDaysMin?: number
  backlinkNature?: string
  backlinksAllowedMin?: number
  linkPlacement?: string
  permanence?: string
  sampleUrl?: string
  remarkIncludes?: string
  lastPublishedAfter?: string
  outboundLinkLimitMax?: number
  guidelinesUrlIncludes?: string
  disclaimerIncludes?: string
  availability?: boolean
  trend?: string
}

const defaultFilters: Filters = {
  niche: "",
  language: "",
  country: "",
  tool: undefined,
  daMin: undefined,
  daMax: undefined,
  paMin: undefined,
  paMax: undefined,
  drMin: undefined,
  drMax: undefined,
  spamMin: undefined,
  spamMax: undefined,
  semrushOverallTrafficMin: undefined,
  semrushOverallTrafficMax: undefined,
  semrushOrganicTrafficMin: undefined,
  semrushOrganicTrafficMax: undefined,
  priceMin: undefined,
  priceMax: undefined,
  tatDaysMax: undefined,
  tatDaysMin: undefined,
  backlinkNature: undefined,
  backlinksAllowedMin: undefined,
  linkPlacement: undefined,
  permanence: undefined,
  sampleUrl: undefined,
  remarkIncludes: undefined,
  lastPublishedAfter: undefined,
  outboundLinkLimitMax: undefined,
  guidelinesUrlIncludes: undefined,
  disclaimerIncludes: undefined,
  availability: undefined,
  trend: undefined
}

function convertFiltersToAPI(f: Filters, searchQuery: string, page: number = 1, limit: number = 8): APIFilters {
  const api: APIFilters = {}
  if (f.daMin !== undefined) api.domainAuthority = { ...(api.domainAuthority || {}), min: f.daMin }
  if (f.daMax !== undefined) api.domainAuthority = { ...(api.domainAuthority || {}), max: f.daMax }
  if (f.paMin !== undefined) api.pageAuthority = { ...(api.pageAuthority || {}), min: f.paMin }
  if (f.paMax !== undefined) api.pageAuthority = { ...(api.pageAuthority || {}), max: f.paMax }
  if (f.drMin !== undefined) api.domainRating = { ...(api.domainRating || {}), min: f.drMin }
  if (f.drMax !== undefined) api.domainRating = { ...(api.domainRating || {}), max: f.drMax }
  if (f.spamMin !== undefined) api.spamScore = { ...(api.spamScore || {}), min: f.spamMin }
  if (f.spamMax !== undefined) api.spamScore = { ...(api.spamScore || {}), max: f.spamMax }
  // Use sellingPrice for filtering, since UI displays publishing.price (selling price)
  if (f.priceMin !== undefined) api.sellingPrice = { ...(api.sellingPrice || {}), min: f.priceMin }
  if (f.priceMax !== undefined) api.sellingPrice = { ...(api.sellingPrice || {}), max: f.priceMax }
  if (f.semrushOverallTrafficMin !== undefined) api.semrushTraffic = { ...(api.semrushTraffic || {}), min: f.semrushOverallTrafficMin }
  if (f.semrushOverallTrafficMax !== undefined) api.semrushTraffic = { ...(api.semrushTraffic || {}), max: f.semrushOverallTrafficMax }
  if (f.semrushOrganicTrafficMin !== undefined) api.semrushOrganicTraffic = { ...(api.semrushOrganicTraffic || {}), min: f.semrushOrganicTrafficMin }
  if (f.semrushOrganicTrafficMax !== undefined) api.semrushOrganicTraffic = { ...(api.semrushOrganicTraffic || {}), max: f.semrushOrganicTrafficMax }
  if (f.niche) api.niche = f.niche
  if (f.language) api.language = f.language
  if (f.country) api.webCountry = f.country
  if (f.backlinkNature) api.linkAttribute = f.backlinkNature
  if (typeof f.availability === 'boolean') api.availability = f.availability
  if (f.remarkIncludes) api.websiteRemark = f.remarkIncludes
  // Do not filter by website via search query anymore; clicking a recommendation opens details modal
  
  // Add pagination parameters
  api.page = page
  api.limit = limit
  api.offset = (page - 1) * limit
  
  try {
    if (typeof window !== 'undefined' && (window as any).__DEBUG_PUBLISHERS) {
      console.log('🧭 PUBLISHERS: convertFiltersToAPI', { in: { f, searchQuery, page, limit }, out: api })
    }
  } catch {}

  return api
}


function FiltersUI({ 
  filters, 
  setFilters, 
  loading, 
  onRefresh,
  onApplyDraft
}: { 
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  loading: boolean
  onRefresh: () => void
  onApplyDraft: (draft: Filters) => void
}) {
  const { log } = useActivityLogger()
  const [lastLogged, setLastLogged] = useState<any>(null)
  const skipNextFiltersEffect = useRef(false);
  // debounce logging of filter changes
  useEffect(() => {
    if (skipNextFiltersEffect.current) {
      skipNextFiltersEffect.current = false;
      return;
    }
    if (applyingViewId) setApplyingViewId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  // Saved views (loaded on demand)
  const [views, setViews] = useState<Array<{ id: string; name: string; filters: any }>>([])
  const [viewName, setViewName] = useState("")
  const [applyingViewId, setApplyingViewId] = useState("")
  const [loadingViews, setLoadingViews] = useState(false)
  const [viewsLoaded, setViewsLoaded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<keyof Filters | null>(null)
  // Keep draft changes local to the modal until Apply is clicked
  const [draftFilters, setDraftFilters] = useState<Filters>(filters)
  // Track manual Apply to control loading behavior
  const manualApplyRef = React.useRef(false)
  const [countrySearch, setCountrySearch] = useState("")
  const [nicheSearch, setNicheSearch] = useState("")
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)

  useEffect(() => {
    // If a view is selected and filters are updated, clear the view
    if (applyingViewId) {
      setApplyingViewId("");
    }
    // Deliberately omit setApplyingViewId from deps: it's stable from useState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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

  // Project selection for scoping views
  const { selectedProjectId: selectedProjectIdForViews } = useProjectStore()

  // Load views on demand when dropdown is opened
  const loadViews = async (forceRefresh = false) => {
    if ((viewsLoaded && !forceRefresh) || loadingViews) return
    setLoadingViews(true)
    try {
      console.log('Loading views from API...', forceRefresh ? '(forced refresh)' : '')
      const res = await fetch(`/api/views?projectId=${encodeURIComponent(selectedProjectIdForViews || 'individual')}` as any, { cache: 'no-store' })
      console.log('Views API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Views API response data:', data)
        setViews(data.views || [])
        setViewsLoaded(true)
      } else {
        console.log('Views API error:', res.status, res.statusText)
      }
    } catch (error) {
      console.log('Views API fetch error:', error)
    }
    finally {
      setLoadingViews(false)
    }
  }

  // Refresh views when the selected project changes to prevent showing another project's views
  useEffect(() => {
    setViews([])
    setViewsLoaded(false)
    setApplyingViewId("")
    loadViews(true)
  }, [selectedProjectIdForViews])

  const persistViews = (next: Array<{ id: string; name: string; filters: any }>) => {
    setViews(next)
  }

  const saveCurrentView = async () => {
    if (loading) return
    const name = viewName.trim()
    if (!name) return
    try {
      const res = await fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, filters, projectId: selectedProjectIdForViews || 'individual' }) })
      if (!res.ok) return
      
      // Force refresh views after saving
      await loadViews(true)
      setViewName("")
    } catch {}
  }

  const applyViewById = (id: string) => {
    const v = views.find(v => v.id === id)
    if (!v) return
    setApplyingViewId(id)
    skipNextFiltersEffect.current = true; // <- mark this update as "view apply"
    setFilters({ ...defaultFilters, ...v.filters })
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('applyFilters'))
      setApplyingViewId("")
    }, 50)
  }

  const deleteViewById = async (id: string) => {
    try {
      const res = await fetch(`/api/views/${id}`, { method: 'DELETE' })
      if (res.ok) {
        // Force refresh views after deletion
        await loadViews(true)
        if (applyingViewId === id) setApplyingViewId("")
      }
    } catch {}
  }

  const open = (k: keyof Filters) => {
    if (!loading) {
      setActiveKey(k)
      // Initialize draft from current filters each time modal opens
      setDraftFilters(filters)
      setModalOpen(true)
    }
  }

  const clearKey = (k: keyof Filters) => {
    const val = filters[k] as any
    let reset: any = ""
    if (typeof val === 'boolean') reset = undefined
    else if (typeof val === 'number') reset = undefined
    else reset = ""
    const updatedFilters = { ...filters, [k]: reset }
    setFilters(updatedFilters)
    // Trigger refetch with the new filters immediately
    onApplyDraft(updatedFilters)
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
      setFilters({ ...filters, [minKey]: isNaN(clamped) ? min : clamped })
    }
    
    const setMax = (val: number) => {
      const clamped = Math.max(Math.min(val, max), low + step)
      setFilters({ ...filters, [maxKey]: isNaN(clamped) ? max : clamped })
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
    // Use brand icons where possible
    daMin: <MozIcon className="w-3.5 h-3.5" />,
    paMin: <MozIcon className="w-3.5 h-3.5" />,
    drMin: <AhrefsIcon className="w-3.5 h-3.5" />,
    spamMax: <AlertTriangle className="w-3.5 h-3.5 text-violet-600" />,
    tool: (
      <span className="inline-flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
        <SemrushIcon className="w-3 h-3" />
        <AhrefsIcon className="w-3 h-3" />
        <MozIcon className="w-3 h-3" />
      </span>
    ),
    // Semrush provides these traffic metrics
    semrushOverallTrafficMin: <SemrushIcon className="w-3.5 h-3.5" />,
    semrushOrganicTrafficMin: <SemrushIcon className="w-3.5 h-3.5" />,
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
    daMin: 'Minimum Domain Authority (Moz)',
    paMin: 'Minimum Page Authority (Moz)',
    drMin: 'Minimum Domain Rating (Ahrefs)',
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
    const [isHovered, setIsHovered] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)

    const updateTooltipPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 8
        })
      }
    }

    useEffect(() => {
      if (isHovered) {
        updateTooltipPosition()
        const handleScroll = () => updateTooltipPosition()
        const handleResize = () => updateTooltipPosition()
        
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleResize)
        
        return () => {
          window.removeEventListener('scroll', handleScroll, true)
          window.removeEventListener('resize', handleResize)
        }
      }
    }, [isHovered])

    return (
      <>
        <div className="relative group inline-block">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => open(key)}
            disabled={loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
        </div>
        
        {/* Portal-based Tooltip */}
        {tooltipByKey[key] && isHovered && typeof document !== 'undefined' && createPortal(
          <div 
            className="pointer-events-none fixed whitespace-nowrap px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white shadow-lg z-[9999] transition-opacity"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="font-medium mb-0.5">{label}</div>
            <div className="text-gray-300">{tooltipByKey[key]}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>,
          document.body
        )}
      </>
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
    { key: 'semrushOverallTrafficMin', label: 'Semrush Traffic', category: 'traffic' },
    { key: 'semrushOrganicTrafficMin', label: 'Semrush Organic Traffic', category: 'traffic' },
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
            <Select value={draftFilters.country || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, country: v === '__all__' ? '' : v })}>
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
            <Select value={draftFilters.language || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, language: v === '__all__' ? '' : v })}>
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
            <Input placeholder="Enter niche" value={draftFilters.niche || ''} onChange={(e) => { setDraftFilters({ ...draftFilters, niche: e.target.value }); setNicheSearch(e.target.value) }} />
            <div className="max-h-48 overflow-auto no-scrollbar border border-gray-200 dark:border-gray-700/60 rounded p-2">
              {loadingCats ? <div className="text-sm">Loading…</div> : catError ? <div className="text-sm text-red-500">{catError}</div> : recommendations.length ? recommendations.map(r => (
                <button key={r.category} className="block w-full text-left text-sm px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setDraftFilters({ ...draftFilters, niche: r.category }); }}>{r.category}</button>
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
        const lo = (draftFilters as any)[cfg.minKey] ?? cfg.min
        const hi = (draftFilters as any)[cfg.maxKey] ?? cfg.max
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
                setDraftFilters({ ...draftFilters, [cfg.minKey]: minV, [cfg.maxKey]: maxV })
              }}
            />
          </div>
        )
      }
      case 'semrushOverallTrafficMin':
      case 'semrushOverallTrafficMax': {
        const lo = draftFilters.semrushOverallTrafficMin ?? 0
        const hi = draftFilters.semrushOverallTrafficMax ?? 10000000
        const fmt = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">Semrush Traffic</span>
              <span className="tabular-nums">{fmt(lo)} – {fmt(hi)}</span>
            </div>
            <Slider
              min={0}
              max={10000000}
              value={[lo, hi]}
              onValueChange={(vals: number[]) => {
                if (loading) return
                const minV = vals[0] as number
                const maxV = vals[1] as number
                setDraftFilters({ ...draftFilters, semrushOverallTrafficMin: minV, semrushOverallTrafficMax: maxV })
              }}
            />
          </div>
        )
      }
      case 'semrushOrganicTrafficMin':
      case 'semrushOrganicTrafficMax': {
        const lo = draftFilters.semrushOrganicTrafficMin ?? 0
        const hi = draftFilters.semrushOrganicTrafficMax ?? 10000000
        const fmt = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">Semrush Organic Traffic</span>
              <span className="tabular-nums">{fmt(lo)} – {fmt(hi)}</span>
            </div>
            <Slider
              min={0}
              max={10000000}
              value={[lo, hi]}
              onValueChange={(vals: number[]) => {
                if (loading) return
                const minV = vals[0] as number
                const maxV = vals[1] as number
                setDraftFilters({ ...draftFilters, semrushOrganicTrafficMin: minV, semrushOrganicTrafficMax: maxV })
              }}
            />
          </div>
        )
      }
      case 'backlinksAllowedMin':
      case 'outboundLinkLimitMax':
        return (
          <div className="p-4">
            <Input type="number" placeholder="Enter value" value={String((draftFilters as any)[activeKey] ?? "")} onChange={(e) => setDraftFilters({ ...draftFilters, [activeKey]: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        )
      case 'availability':
        return (
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm">Show only available</div>
            <Checkbox checked={draftFilters.availability ?? false} onCheckedChange={(checked) => setDraftFilters({ ...draftFilters, availability: Boolean(checked) })} />
          </div>
        )
      case 'trend':
        return (
          <div className="p-4">
            <Select value={draftFilters.trend || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, trend: v === 'none' ? undefined : v })}>
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
            <Select value={draftFilters.backlinkNature || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, backlinkNature: v === 'none' ? undefined : (v as BacklinkNature) })}>
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
            <Select value={draftFilters.linkPlacement || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, linkPlacement: v === 'none' ? undefined : (v as LinkPlacement) })}>
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
            <Select value={draftFilters.permanence || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, permanence: v === 'none' ? undefined : (v as any) })}>
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
            <Select value={draftFilters.tool || undefined} onValueChange={(v) => setDraftFilters({ ...draftFilters, tool: v === 'none' ? undefined : (v as any) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select SEO tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Any</SelectItem>
                <SelectItem value="Semrush">
                  <div className="flex items-center gap-2">
                    <SemrushIcon className="h-4" />
                    Semrush
                  </div>
                </SelectItem>
                <SelectItem value="Ahrefs">
                  <div className="flex items-center gap-2">
                    <AhrefsIcon className="h-4" />
                    Ahrefs
                  </div>
                </SelectItem>
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
    add('semrushOverallTrafficMin', `Semrush Traffic ≥ ${filters.semrushOverallTrafficMin}`, filters.semrushOverallTrafficMin)
    add('semrushOverallTrafficMax', `Semrush Traffic ≤ ${filters.semrushOverallTrafficMax}`, filters.semrushOverallTrafficMax)
    add('semrushOrganicTrafficMin', `Semrush Organic ≥ ${filters.semrushOrganicTrafficMin}`, filters.semrushOrganicTrafficMin)
    add('semrushOrganicTrafficMax', `Semrush Organic ≤ ${filters.semrushOrganicTrafficMax}`, filters.semrushOrganicTrafficMax)
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
    <>
      <Card className="mb-3 sm:mb-4 bg-white dark:bg-gray-800 h-full flex flex-col overflow-hidden">
        <UICardHeader className="pb-1 flex-shrink-0 px-3 sm:px-6">
          <UICardTitle className="text-sm sm:text-base">Filters</UICardTitle>
        </UICardHeader>
        <CardContent className="pt-1 flex-1 flex flex-col overflow-hidden px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-3.5 gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {/* Apply saved view */}
          <Select 
            value={applyingViewId || undefined} 
            onValueChange={(v) => { if (v === '__none__') { setApplyingViewId(""); return } applyViewById(v) }}
            onOpenChange={(open) => {
              if (open && !viewsLoaded) {
                loadViews()
              }
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-48 text-xs">
              <SelectValue placeholder={
                loadingViews ? 'Loading views...' : 
                views.length ? 'Apply saved view' : 
                viewsLoaded ? 'No saved views' : 'Apply saved view'
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Saved Views</SelectLabel>
                <SelectItem value="__none__">None</SelectItem>
                {loadingViews ? (
                  <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                ) : (
                  views.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* Save as view */}
          <Input className="h-8 text-xs w-full sm:w-48" placeholder="Save as view..." value={viewName} onChange={(e) => setViewName(e.target.value)} disabled={loading} />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button className="h-8 inline-flex items-center gap-1.5 text-xs px-2 sm:px-3 flex-1 sm:flex-none" onClick={saveCurrentView} disabled={loading || !viewName.trim()}>
              <CheckCircle className="w-3 h-3" />
              Save
            </Button>
            <Button 
              variant="outline" 
              className="h-8 inline-flex items-center gap-1.5 text-xs px-2 sm:px-3 flex-1 sm:flex-none" 
              onClick={onRefresh} 
              disabled={loading}
            >
              <RefreshCw className="w-3 h-3" />
              Apply Filters
            </Button>
            <Button 
              className="h-8 text-xs px-2 sm:px-3 flex-1 sm:flex-none bg-[#755FF8] text-white hover:bg-[#755FF8]/80" 
              variant="secondary" 
              onClick={() => {
                setFilters(defaultFilters)
                // Reset search query via custom event
                window.dispatchEvent(new CustomEvent('resetSearchQuery'))
                // Trigger refetch with empty filters after a short delay
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('applyFilters'))
                }, 100)
              }} 
              disabled={loading}
            >
              Reset All
            </Button>
            </div>
          </div>
        </div>

      {/* Grouped filter pebbles - takes remaining space */}
      <div className="space-y-2 sm:space-y-3 flex-1 overflow-hidden">
          {Object.entries(groupedPebbles).map(([category, pebbles]) => (
            <div key={category} className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                {categoryIcons[category as keyof typeof categoryIcons]}
                <span className="font-medium">{categoryLabels[category as keyof typeof categoryLabels]}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 overflow-hidden">
                {pebbles.map(p => (
                  <span key={p.key}>{pebble(p.label, p.key)}</span>
                ))}
              </div>
            </div>
          ))}
      </div>

      {activeChips.length > 0 && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 flex-shrink-0">
          {activeChips.map(chip => (
            <button key={chip.key as string} onClick={() => open(chip.key)} className="inline-flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1 text-xs bg-violet-600 text-white border border-violet-600 hover:bg-violet-700 transition-all duration-200 hover:scale-105">
              <span>{chip.label}</span>
              <span onClick={(e) => { e.stopPropagation(); clearKey(chip.key) }} aria-label="Remove" className="opacity-70 hover:opacity-100">✕</span>
            </button>
          ))}
        </div>
      )}
        </CardContent>
      </Card>

      <ModalBasic title={activeKey ? `Filter: ${String(activeKey)}` : 'Filter'} isOpen={modalOpen} setIsOpen={setModalOpen}>
        {renderModalBody()}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-700/60 flex flex-col sm:flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={loading} className="w-full sm:w-auto">Cancel</Button>
          <Button 
            className="bg-violet-600 text-white hover:bg-violet-500 w-full sm:w-auto" 
            onClick={() => {
              // Avoid unnecessary global updates if nothing changed
              const same = JSON.stringify(filters) === JSON.stringify(draftFilters)
              if (!same) setFilters(draftFilters)
              setModalOpen(false)
              // Delegate to parent to run Apply with draft
              onApplyDraft(draftFilters)
            }} 
            disabled={loading}
          >
            Apply
          </Button>
        </div>
      </ModalBasic>
    </>
  )
}

function summarizeFilters(f: Filters) {
  const keys = ['niche','language','country','daMin','daMax','paMin','paMax','drMin','drMax','spamMin','spamMax','semrushOverallTrafficMin','semrushOverallTrafficMax','semrushOrganicTrafficMin','semrushOrganicTrafficMax','priceMin','priceMax','tatDaysMin','tatDaysMax','trend','availability','backlinkNature','linkPlacement','permanence','tool']
  const out: Record<string, any> = {}
  for (const k of keys) {
    const v = (f as any)[k]
    if (v !== undefined && v !== null && v !== '') out[k] = v
  }
  return out
}

function ResultsTable({ sites, loading, onRowHeightButtonRef, onLimitedSitesChange, onRowLevelChange, currentPage, itemsPerPage }: { sites: Site[]; loading: boolean; onRowHeightButtonRef?: (el: HTMLButtonElement | null) => void; onLimitedSitesChange?: (limitedSites: Site[]) => void; onRowLevelChange?: (rowLevel: 1 | 2 | 3 | 4) => void; currentPage: number; itemsPerPage: number }) {
  const { addItem, removeItem, isItemInCart } = useCart()
  const [rowLevel, setRowLevel] = useState<1 | 2 | 3 | 4>(4)
  // Track the currently hovered site for the trend preview panel
  const [trendPreviewSite, setTrendPreviewSite] = useState<Site | null>(null)
  // Track the currently hovered site for the country preview chart
  const [countryPreviewSite, setCountryPreviewSite] = useState<Site | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countryHideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rowPaddingByLevel: Record<1|2|3|4, string> = { 1: 'py-1.5', 2: 'py-2.5', 3: 'py-3.5', 4: 'py-4.5' }
  const [rowsOpen, setRowsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const rowHeightButtonRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => { onRowHeightButtonRef?.(rowHeightButtonRef.current) }, [onRowHeightButtonRef])

  // Open details modal when a site is dispatched from outside (e.g., search suggestions)
  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const site = (e as any)?.detail?.site as Site | undefined
      if (site) {
        setSelectedSite(site)
        setDetailsOpen(true)
      }
    }
    window.addEventListener('openSiteDetails', handleOpen as EventListener)
    return () => window.removeEventListener('openSiteDetails', handleOpen as EventListener)
  }, [])

  // Scroll state management for shadow indicators
  const [scrollState, setScrollState] = useState({ left: false, right: true })
  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  // Limit number of rows shown based on row density setting so users see a visible change
  const maxRowsByLevel: Record<1 | 2 | 3 | 4, number> = useMemo(() => ({ 1: 30, 2: 20, 3: 12, 4: 8 }), [])
  const limitedSites = useMemo(() => {
    if (!Array.isArray(sites)) return sites
    
    // Calculate pagination slice
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    // First slice by pagination, then limit by row height
    const paginatedSites = sites.slice(startIndex, endIndex)
    const limit = maxRowsByLevel[rowLevel]
    
    return paginatedSites.slice(0, limit)
  }, [sites, rowLevel, maxRowsByLevel, currentPage, itemsPerPage])

  // Notify parent component of limited sites changes
  useEffect(() => {
    onLimitedSitesChange?.(limitedSites)
  }, [limitedSites, onLimitedSitesChange])

  // Notify parent component of row level changes
  useEffect(() => {
    onRowLevelChange?.(rowLevel)
  }, [rowLevel, onRowLevelChange])

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
  
  // Default visible columns matching OMS data page (7 columns + cart always visible)
  const defaultVisibleColumns: ColumnKey[] = ['name', 'niche', 'countryLang', 'authority', 'spam', 'price', 'trend']
  
  const columnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'name', label: 'Website' },
    { key: 'niche', label: 'Niche' },
    { key: 'countryLang', label: 'Country/Lang' },
    { key: 'authority', label: 'Authority' },
    { key: 'spam', label: 'Spam' },
    { key: 'price', label: 'Price' },
    { key: 'trend', label: 'Trend' },
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
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      return next
    })
    // Close after a short delay to provide visual feedback
    setTimeout(() => setColumnsOpen(false), 0)
  }
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

  // Scroll shadow detection for horizontal table scroll
  useEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setScrollState({
        left: scrollLeft > 10,
        right: scrollLeft < scrollWidth - clientWidth - 10
      })
    }
    
    el.addEventListener('scroll', handleScroll)
    // Initial check and check on resize
    handleScroll()
    window.addEventListener('resize', handleScroll)
    
    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [limitedSites.length])

  // Even spacing for all columns - uniform widths for consistent layout
  const columnWidthClasses: Record<ColumnKey, string> = useMemo(() => ({
    // All columns have even spacing
    name: 'min-w-[180px] sm:min-w-[200px]',
    authority: 'min-w-[180px] sm:min-w-[200px]',
    price: 'min-w-[180px] sm:min-w-[200px]',
    cart: 'min-w-[180px] sm:min-w-[200px]',
    niche: 'min-w-[180px] sm:min-w-[200px]',
    countryLang: 'min-w-[180px] sm:min-w-[200px]',
    spam: 'min-w-[180px] sm:min-w-[200px]',
    trend: 'min-w-[180px] sm:min-w-[200px]',
    website: 'min-w-[180px] sm:min-w-[200px]',
    traffic: 'min-w-[180px] sm:min-w-[200px]',
    organicTraffic: 'min-w-[180px] sm:min-w-[200px]',
    authorityScore: 'min-w-[180px] sm:min-w-[200px]',
    availability: 'min-w-[180px] sm:min-w-[200px]',
    sampleUrl: 'min-w-[180px] sm:min-w-[200px]',
    lastPublished: 'min-w-[180px] sm:min-w-[200px]',
    outboundLimit: 'min-w-[180px] sm:min-w-[200px]',
    backlinkNature: 'min-w-[180px] sm:min-w-[200px]',
    backlinksAllowed: 'min-w-[180px] sm:min-w-[200px]',
    wordLimit: 'min-w-[180px] sm:min-w-[200px]',
    tatDays: 'min-w-[180px] sm:min-w-[200px]',
    linkPlacement: 'min-w-[180px] sm:min-w-[200px]',
    permanence: 'min-w-[180px] sm:min-w-[200px]',
    order: 'min-w-[180px] sm:min-w-[200px]'
  }), [])

  // Helper function to generate consistent column classes for headers and cells
  const getColumnClassName = useCallback((key: ColumnKey, isHeader: boolean) => {
    const base = columnWidthClasses[key]
    const alignment = rightAligned.has(key) ? 'text-right' : centerAligned.has(key) ? 'text-center' : 'text-left'
    const padding = 'px-2 sm:px-3 md:px-4 lg:px-6'
    const py = isHeader ? 'py-2 sm:py-3' : rowPaddingByLevel[rowLevel]
    
    return `${base} ${alignment} ${padding} ${py} whitespace-nowrap`
  }, [columnWidthClasses, rightAligned, centerAligned, rowLevel, rowPaddingByLevel])

  const renderCell = (key: ColumnKey, s: Site) => {
    switch (key) {
      case 'name':
        return (
          <div className="font-medium">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap leading-tight text-sm sm:text-base" title={s.name}>
              {/* Mask the domain with stars; reveal on hover click */}
              <MaskedWebsite site={s} maxStars={10} />
            </div>
            {(() => {
              const stripped = s.url.replace(/^https?:\/\//, "")
              const isDifferent = stripped.toLowerCase() !== s.name.toLowerCase()
              if (rowLevel >= 2 && isDifferent) {
                return (
                  <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap" title={stripped}>
                    {stripped}
                  </div>
                )
              }
              return null
            })()}
            {rowLevel >= 3 && (
              <div className="mt-1 flex flex-col gap-1">
                {(() => {
                  const v = (s.publishing.backlinkNature || '').toLowerCase()
                  if (v.includes('do')) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 w-fit">
                        <Link2 className="w-3 h-3" /> Do-follow
                      </span>
                    )
                  }
                  if (v.includes('no')) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700 w-fit">
                        <Link2 className="w-3 h-3" /> No-follow
                      </span>
                    )
                  }
                  if (v.includes('sponsor')) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 w-fit">
                        <Link2 className="w-3 h-3" /> Sponsored
                      </span>
                    )
                  }
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700 w-fit">
                      <Link2 className="w-3 h-3" /> {s.publishing.backlinkNature || '-'}
                    </span>
                  )
                })()}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 w-fit">
                  <Link2 className="w-3 h-3" /> Outbound {s.quality?.outboundLinkLimit ?? '-'}
                </span>
              </div>
            )}
          </div>
        )
      case 'niche':
        return (
          <div className="max-w-full">
            <div className="flex flex-col gap-1 max-w-full">
              {(() => {
                const niches = s.niche.split(',').map(n => n.trim()).filter(Boolean)
                const maxNiches = 3
                const displayNiches = niches.slice(0, maxNiches)
                const hasMore = niches.length > maxNiches
                
                return (
                  <>
                    {displayNiches.map((n, idx) => (
                      <span key={`${n}-${idx}`} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-600 inline-flex items-center justify-center w-fit" title={n}>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap inline-block max-w-[7.5rem]">{n}</span>
                      </span>
                    ))}
                    {hasMore && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400" title={`+${niches.length - maxNiches} more: ${niches.slice(maxNiches).join(', ')}`}>
                        +{niches.length - maxNiches} more...
                      </span>
                    )}
                  </>
                )
              })()}
            </div>
            {rowLevel >= 3 && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="text-gray-400">Type:</span> {s.category}
              </div>
            )}
          </div>
        )
      case 'countryLang':
        return (
          <div className="text-sm leading-tight" onMouseEnter={() => { if (countryHideTimeoutRef.current) { clearTimeout(countryHideTimeoutRef.current); countryHideTimeoutRef.current = null } setCountryPreviewSite(s) }} onMouseLeave={() => { countryHideTimeoutRef.current = setTimeout(() => { setCountryPreviewSite(null) }, 1200) }}>
            {(() => {
              const computedCountry = (s.country && s.country !== 'Not Specified')
                ? s.country
                : (s.toolScores?.topCountries && s.toolScores.topCountries[0]?.country) || ''
              const hasCountry = Boolean(computedCountry)
              const computedLanguage = (s.language && s.language !== 'Not Specified') ? s.language : ''
              const titleText = `${hasCountry ? computedCountry : '—'}${computedLanguage ? ` • ${computedLanguage}` : ''}`
              if (rowLevel === 1) {
              // Short: Just language with country flag, full info on hover
                return (
                  <div className="flex items-center gap-1.5 group relative" title={titleText}>
                    {hasCountry ? <Flag country={computedCountry} withBg className="shrink-0" /> : null}
                    <span className="text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[8rem]">{computedLanguage || (hasCountry ? computedCountry : '—')}</span>
                  </div>
                )
              }
              // Medium and above: Show with additional details
              return (
                <>
                  <div className="flex items-center gap-1.5 group relative" title={titleText}>
                    {hasCountry ? <Flag country={computedCountry} withBg className="shrink-0" /> : null}
                    <span className="text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[8rem]">{computedLanguage || (hasCountry ? computedCountry : '—')}</span>
                  </div>
                  {rowLevel >= 3 && hasCountry && (
                    <div className="text-[11px] text-gray-500 mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={computedCountry}>
                      <span className="text-gray-400">Country:</span> {computedCountry}
                    </div>
                  )}
                  {rowLevel >= 4 && computedLanguage && (
                    <div className="text-[11px] text-gray-500 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" title={computedLanguage}>
                      <span className="text-gray-400">Language:</span> {computedLanguage}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )
      case 'authority':
        return (
          <div className="w-full text-xs">
            {(() => {
              const rows: { label: string; icon: React.ReactNode; value: number | string; cls: string }[] = [
                { label: 'DR', icon: <AhrefsIcon className="w-3.5 h-3.5" />, value: s.dr, cls: 'bg-amber-500/70 border border-amber-400/40 text-white' },
                { label: 'DA', icon: <MozIcon className="w-3.5 h-3.5" />, value: s.da, cls: 'bg-indigo-500/70 border border-indigo-400/40 text-white' },
                { label: 'AS', icon: <SemrushIcon className="w-3.5 h-3.5" />, value: (s.toolScores?.semrushAuthority ?? '-'), cls: 'bg-orange-500/70 border border-orange-400/40 text-white' },
              ]
              const toShow = rowLevel >= 4 ? rows : rowLevel >= 3 ? rows.slice(0, 2) : rows.slice(0, 1)
              return (
                <div className="flex flex-col gap-0.5">
                  {toShow.map((r, idx) => (
                    <React.Fragment key={r.label}>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300"><span>{r.icon}</span> <span className="font-semibold">{r.label}</span></span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold tabular-nums ${r.cls}`}>{r.value}</span>
                      </div>
                      {idx < toShow.length - 1 && <div className="mx-1 h-px bg-white/20 dark:bg-white/10" />}
                    </React.Fragment>
                  ))}
                </div>
              )
            })()}
          </div>
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
            <span className="font-medium tabular-nums text-sm sm:text-base">{"$"}{s.publishing.price.toLocaleString()}</span>
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Base:</span> ${s.publishing.price}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">With Content:</span> ${s.publishing.priceWithContent}</div>)}
          </>
        )
      case 'trend':
        return (
          <div
            className="inline-flex items-center gap-1.5 text-sm"
            onMouseEnter={() => {
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current)
                hideTimeoutRef.current = null
              }
              setTrendPreviewSite(s)
            }}
            onMouseLeave={() => {
              hideTimeoutRef.current = setTimeout(() => {
                setTrendPreviewSite(null)
              }, 200)
            }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">{s.toolScores.trafficTrend || 'stable'}</span>
          </div>
        )
      case 'cart':
        return (
          <>
            <div className="flex flex-col items-center gap-1">
              {isItemInCart(s.id) ? (
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 w-full">
                  <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500 text-xs px-2 py-1 h-7 w-full sm:w-auto" onClick={(e) => { e.stopPropagation() }}>In Cart</Button>
                  {rowLevel >= 2 && (
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7 w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); removeItem(s.id) }}>Remove</Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-400/40 active:scale-[0.98] transition-all duration-150 text-xs px-2 py-1 h-7 w-full sm:w-auto"
                  onClick={(e) => { e.stopPropagation(); addItem(s) }}
                >
                  Add to Cart
                </Button>
              )}
              {rowLevel >= 2 && <WishlistInlineButton site={s} />}
            </div>
          </>
        )
      case 'website':
        return (
          <div className="font-medium">
            <MaskedWebsite site={s} />
            {rowLevel >= 2 && (<div className="text-xs text-gray-500">{s.url.replace(/^https?:\/\//, "")}</div>)}
            {rowLevel >= 3 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Category:</span> {s.category}</div>)}
            {rowLevel >= 4 && (<div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Language:</span> {s.language}</div>)}
          </div>
        )
      case 'traffic':
        return (
          <div className="flex flex-col justify-center min-h-[42px]">
            <div className="tabular-nums leading-none">{(s.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M</div>
            <div className="mt-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 whitespace-nowrap">
              <SemrushIcon className="w-3 h-3" />
              Semrush Traffic
            </div>
          </div>
        )
      case 'organicTraffic':
        return (
          <div className="flex flex-col justify-center min-h-[42px]">
            <div className="tabular-nums leading-none">{(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</div>
            <div className="mt-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 whitespace-nowrap">
              <SemrushIcon className="w-3 h-3" />
              Semrush Organic
            </div>
          </div>
        )
      case 'authorityScore':
        return (
          <div className={`${rightAligned.has('authorityScore') ? 'text-right' : ''} flex flex-col justify-center min-h-[42px]`}>
            <div className="tabular-nums leading-none">{s.toolScores.semrushAuthority}</div>
            <div className={`mt-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700 whitespace-nowrap ${rightAligned.has('authorityScore') ? 'ml-auto' : ''}`}>
              <SemrushIcon className="w-3 h-3" />
              Score
            </div>
          </div>
        )
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
            {(() => {
              const v = (s.publishing.backlinkNature || '').toLowerCase()
              if (v.includes('do')) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                    <Link2 className="w-3 h-3" /> Do-follow
                  </span>
                )
              }
              if (v.includes('no')) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700">
                    <Link2 className="w-3 h-3" /> No-follow
                  </span>
                )
              }
              if (v.includes('sponsor')) {
                return (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                    <Link2 className="w-3 h-3" /> Sponsored
                  </span>
                )
              }
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700">
                  <Link2 className="w-3 h-3" /> {s.publishing.backlinkNature || '-'}
                </span>
              )
            })()}
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

  if (loading) return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <header className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </header>
      </div>
      <div className="relative">
        <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div style={{ minWidth: 'max-content' }}>
          {/* Table header skeleton */}
          <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-b border-gray-100 dark:border-gray-700/60">
            <div className="h-4 w-1/2 sm:w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          {/* Rows skeleton */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 grid grid-cols-6 gap-3 sm:gap-5 items-center">
                <div className="col-span-2 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="col-span-1 h-7 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </Card>
  )
  return (
    <Card className="bg-white dark:bg-gray-800">
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Controls Row */}
        <header className="px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm tracking-tight flex items-center gap-2">
            <span>All Publishers</span>
              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" title={`Showing ${limitedSites.length} of ${sites.length}`}>
              {limitedSites.length}
            </span>
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <Popover open={rowsOpen} onOpenChange={setRowsOpen}>
              <PopoverTrigger asChild>
                <Button ref={rowHeightButtonRef} variant="outline" size="sm" className="h-8 sm:h-7 text-xs inline-flex items-center gap-1 px-3 sm:px-2 min-h-[44px] sm:min-h-0">
                  <span className="hidden sm:inline">Rows: {rowLevel === 1 ? 'Short' : rowLevel === 2 ? 'Medium' : rowLevel === 3 ? 'Tall' : 'Extra Tall'}</span>
                  <span className="sm:hidden">{rowLevel === 1 ? 'S' : rowLevel === 2 ? 'M' : rowLevel === 3 ? 'L' : 'XL'}</span>
                  <svg className={`w-3 h-3 transition-transform ${rowsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
                  </svg>
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-48 bg-white dark:bg-gray-800 border-[0.5px] border-gray-200 dark:border-white/10 rounded-lg shadow-xl">
              <div className="py-1">
                {[1,2,3,4].map((lvl) => (
                  <button
                    key={lvl}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md cursor-pointer outline-none transition-colors active:scale-[0.98] ${rowLevel===lvl ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                    onClick={() => {
                      setRowLevel(lvl as 1|2|3|4)
                      setRowsOpen(false)
                    }}
                  >
                    {lvl===1?'Short':lvl===2?'Medium':lvl===3?'Tall':'Extra Tall'}
                  </button>
                ))}
              </div>
            </PopoverContent>
            </Popover>
            </div>
            <div className="relative" ref={columnsRef}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-7 text-xs inline-flex items-center gap-1.5 px-3 sm:px-2 min-h-[44px] sm:min-h-0"
                onClick={() => setColumnsOpen(o => !o)}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="4" width="5" height="16" rx="1" />
                  <rect x="10" y="4" width="5" height="16" rx="1" />
                  <rect x="17" y="4" width="4" height="16" rx="1" />
                </svg>
                {/* Mobile: Show count of hidden columns */}
                <span className="sm:hidden">
                  Cols {visibleColumns.length < allKeys.length && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({allKeys.length - visibleColumns.length} hidden)
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">Columns</span>
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
                  <div className="max-h-48 overflow-auto no-scrollbar py-1">
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
          </div>
        </header>
        
        {/* Column controls end; table rendered below */}
      </div>

      {/* Fixed bottom-left trend preview panel */}
      {trendPreviewSite && (
        <div
          className="hidden sm:block fixed bottom-4 left-4 w-80 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur p-3 shadow-2xl z-[6000]"
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current)
              hideTimeoutRef.current = null
            }
            setTrendPreviewSite(trendPreviewSite)
          }}
          onMouseLeave={() => {
            hideTimeoutRef.current = setTimeout(() => {
              setTrendPreviewSite(null)
            }, 200)
          }}
        >
          <div className="text-xs font-medium mb-2 truncate">
            Trend preview · <MaskedWebsite site={trendPreviewSite} maxStars={10} showRevealButton={false} />
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Semrush Traffic</div>
              <LineChart01
                width={260}
                height={60}
                data={{
                  labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                  datasets: [
                    {
                      data: Array.from({ length: 12 }, () =>
                        Math.max(1000, (trendPreviewSite.toolScores.semrushOverallTraffic / 12) * (0.7 + Math.random() * 0.6))
                      ),
                      borderColor: '#7c3aed',
                      fill: true,
                    },
                  ],
                }}
              />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-0.5">Semrush Organic Traffic</div>
              <LineChart01
                width={260}
                height={60}
                data={{
                  labels: Array.from({ length: 12 }, (_, i) => String(i + 1)),
                  datasets: [
                    {
                      data: Array.from({ length: 12 }, () =>
                        Math.max(1000, (trendPreviewSite.toolScores.semrushOrganicTraffic / 12) * (0.7 + Math.random() * 0.6))
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
                      data: Array.from({ length: 12 }, () => Math.max(1, trendPreviewSite.toolScores.semrushAuthority * (0.7 + Math.random() * 0.6))),
                      borderColor: '#6366f1',
                      fill: true,
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Fixed top-center country preview panel */}
      {countryPreviewSite && (
  <div key={countryPreviewSite.id} className="hidden sm:block fixed top-4 left-1/2 -translate-x-1/2 w-[380px] sm:w-[520px] max-w-[calc(100vw-1rem)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur p-4 sm:p-5 shadow-2xl z-[7000]" onMouseEnter={() => { if (countryHideTimeoutRef.current) { clearTimeout(countryHideTimeoutRef.current); countryHideTimeoutRef.current = null } setCountryPreviewSite(countryPreviewSite) }} onMouseLeave={() => { countryHideTimeoutRef.current = setTimeout(() => { setCountryPreviewSite(null) }, 1200) }}>
          <div className="flex items-start justify-between">
            <div className="text-base font-semibold mb-2">Organic traffic by country</div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap ml-2">Last updated {countryPreviewSite.quality?.lastPublished || '—'}</div>
          </div>
          {(() => {
            const total = countryPreviewSite.toolScores.semrushOrganicTraffic || countryPreviewSite.toolScores.semrushOverallTraffic || 0
            // Prefer real data from toolScores: topCountries first, then targetCountryTraffic
            let breakdown = (countryPreviewSite.toolScores.topCountries && countryPreviewSite.toolScores.topCountries.length > 0)
              ? countryPreviewSite.toolScores.topCountries
              : (countryPreviewSite.toolScores.targetCountryTraffic && countryPreviewSite.toolScores.targetCountryTraffic.length > 0)
                ? countryPreviewSite.toolScores.targetCountryTraffic
                : []

            // If no breakdown available, fallback to a single slice for the site's country
            if (breakdown.length === 0) {
              const countryName = countryPreviewSite.country || 'Unknown'
              breakdown = [{ country: countryName, percent: 100 }]
            }

            // Normalize percents to sum to 100 to avoid inconsistent API payloads
            const percentSum = breakdown.reduce((s, b) => s + (Number(b.percent) || 0), 0)
            const normalized = percentSum > 0
              ? breakdown.map(b => ({ country: b.country, percent: (Number(b.percent) || 0) * (100 / percentSum) }))
              : breakdown

            const labels = normalized.map(b => b.country)
            const values = normalized.map(b => Math.max(0, Math.round(total * ((Number(b.percent) || 0) / 100))))
            const data = {
              labels,
              datasets: [
                {
                  data: values,
                  backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f97316'],
                  hoverBackgroundColor: ['#2563eb', '#059669', '#d97706', '#ea580c'],
                  borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                  borderWidth: 2,
                },
              ],
            }
            return (
              <div className="flex items-center gap-4">
                <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
                  <DoughnutChart key={`${countryPreviewSite.id}-${labels.join('|')}-${values.join('|')}`} data={data as any} width={220} height={220} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl sm:text-3xl font-extrabold tabular-nums mb-1">{total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mb-2">Total Traffic</div>
                  <ul className="space-y-1 text-sm">
                    {normalized.map((b, idx) => (
                      <li key={b.country} className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ['#3b82f6','#10b981','#f59e0b','#f97316'][idx % 4] }} />
                          {b.country}
                        </span>
                        <span className="tabular-nums text-gray-700 dark:text-gray-300">{Number((b.percent as number).toFixed(2))}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })()}
        </div>
      )}
      
      {/* Optimized scroll container with shadow indicators */}
      <div className="relative">
        {/* Left scroll shadow indicator */}
        <div 
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 transition-opacity duration-200 ${scrollState.left ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Right scroll shadow indicator */}
        <div 
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 transition-opacity duration-200 ${scrollState.right ? 'opacity-100' : 'opacity-0'}`}
        />
        
        <div 
          ref={tableScrollRef}
          className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        >
        <Table className="dark:text-gray-300 w-full" style={{ minWidth: 'max-content' }}>
          <UITableHeader>
            <TableRow className="text-[10px] sm:text-xs font-semibold uppercase text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 border-t border-b border-gray-100 dark:border-gray-700/60">
              {columnDefs.map(col => (
                visibleColumns.includes(col.key) ? (
                  <TableHead key={col.key} className={getColumnClassName(col.key, true)}>
                    <div className="inline-flex items-center gap-1 sm:gap-2">
                      <span className="text-[10px] sm:text-xs">{col.label}</span>
                      {col.key === 'trend' && (
                        <span className="px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">Hover</span>
                      )}
                    </div>
                  </TableHead>
                ) : null
              ))}
              {/* Cart column always visible with distinct background color */}
              <TableHead className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap text-center min-w-[180px] sm:min-w-[200px] sticky right-0 z-30 bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-white border-l border-gray-300 dark:border-gray-800 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.15)]">
                <div className="inline-flex items-center gap-1 sm:gap-2">
                  <span className="text-[10px] sm:text-xs">Cart</span>
                </div>
              </TableHead>
            </TableRow>
          </UITableHeader>
          <TableBody className="text-xs sm:text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
            {limitedSites.length === 0 ? (
              <TableRow><TableCell className="px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4" colSpan={(visibleColumns.length || 1) + 1}>No results</TableCell></TableRow>
            ) : limitedSites.map((s, index) => (
              <TableRow key={s.id} className={`${rowPaddingByLevel[rowLevel]} cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-100 ease-out table-row-hover`} onClick={() => { setSelectedSite(s); setDetailsOpen(true) }}>
                {columnDefs.map(col => (
                  visibleColumns.includes(col.key) ? (
                    <TableCell key={col.key}
                      className={getColumnClassName(col.key, false)}
                    >
                      {renderCell(col.key, s)}
                </TableCell>
                  ) : null
                ))}
                {/* Cart column always visible with distinct background color */}
                <TableCell className={`px-2 sm:px-3 md:px-4 lg:px-6 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} text-center min-w-[180px] sm:min-w-[200px] sticky right-0 z-20 bg-gray-100 dark:bg-gray-950 border-l border-gray-300 dark:border-gray-800 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.15)]`}>
                  {renderCell('cart', s)}
                </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
        </div>
      </div>
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogContent className="max-w-7xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-950 p-0 overflow-hidden text-[12px] sm:text-[13px]">
                <DialogHeader className="sticky top-0 z-20 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                  <DialogTitle className="flex items-start justify-between gap-3 sm:gap-4">
                    {selectedSite ? (
                      <div className="min-w-0">
                        <div className="text-base sm:text-lg md:text-xl font-semibold tracking-tight truncate">Site Details</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {selectedSite.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300/60 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
                              <span className="text-gray-600 dark:text-gray-300">Category</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSite.category}</span>
                            </span>
                          )}
                          {selectedSite.country && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-300/60 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
                              <span className="text-gray-600 dark:text-gray-300">{selectedSite.country}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700">
                            ${selectedSite.publishing.price.toLocaleString()}
                          </span>
                          {selectedSite.additional?.availability !== undefined && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${selectedSite.additional.availability ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>
                              {selectedSite.additional.availability ? 'Available' : 'Unavailable'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span>Site Details</span>
                    )}
                    <DialogClose
                      aria-label="Close"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors"
                      onClick={() => setDetailsOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </DialogClose>
                  </DialogTitle>
                </DialogHeader>
                {selectedSite && (
                  <div className="flex flex-col max-h-[80vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-4 overflow-y-auto">
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center text-xs gap-3 min-w-0">
                            <span className="text-gray-600 dark:text-gray-400 shrink-0">URL</span>
                            <div className="font-medium min-w-0 truncate">
                              <MaskedWebsite site={selectedSite} />
                            </div>
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
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><MozIcon className="w-3.5 h-3.5" /> Domain Authority</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold tabular-nums ${selectedSite.da>=70 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' : selectedSite.da>=40 ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>{selectedSite.da}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><MozIcon className="w-3.5 h-3.5" /> Page Authority</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold tabular-nums ${selectedSite.pa>=70 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' : selectedSite.pa>=40 ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>{selectedSite.pa}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><AhrefsIcon className="w-3.5 h-3.5" /> Domain Rating</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold tabular-nums ${selectedSite.dr>=70 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' : selectedSite.dr>=40 ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>{selectedSite.dr}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><SemrushIcon className="w-3.5 h-3.5" /> Spam Score</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold tabular-nums ${selectedSite.spamScore<=3 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' : selectedSite.spamScore<=6 ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' : 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'}`}>{selectedSite.spamScore}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-5 shadow-sm">
                        <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Traffic Data</div>
                        <div className="space-y-2.5">
                          <div
                            className="flex items-center justify-between text-xs"
                            onMouseEnter={() => {
                              if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null }
                              setTrendPreviewSite(selectedSite)
                            }}
                            onMouseLeave={() => {
                              hideTimeoutRef.current = setTimeout(() => { setTrendPreviewSite(null) }, 50)
                            }}
                          >
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><SemrushIcon className="w-3.5 h-3.5" /> Semrush Authority</span>
                            <span className="font-semibold tabular-nums">{selectedSite.toolScores.semrushAuthority}</span>
                          </div>
                          <div
                            className="flex items-center justify-between text-xs"
                            onMouseEnter={() => {
                              if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null }
                              setTrendPreviewSite(selectedSite)
                            }}
                            onMouseLeave={() => {
                              hideTimeoutRef.current = setTimeout(() => { setTrendPreviewSite(null) }, 50)
                            }}
                          >
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><SemrushIcon className="w-3.5 h-3.5" /> Semrush Traffic</span>
                            <span className="font-semibold tabular-nums">{(selectedSite.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M</span>
                          </div>
                          <div
                            className="flex items-center justify-between text-xs"
                            onMouseEnter={() => {
                              if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null }
                              setTrendPreviewSite(selectedSite)
                            }}
                            onMouseLeave={() => {
                              hideTimeoutRef.current = setTimeout(() => { setTrendPreviewSite(null) }, 50)
                            }}
                          >
                            <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1.5"><SemrushIcon className="w-3.5 h-3.5" /> Semrush Organic Traffic</span>
                            <span className="font-semibold tabular-nums">{(selectedSite.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</span>
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
                          <div className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">Backlink Nature</span>
                            <span className="ml-3">
                              {(() => {
                                const v = (selectedSite.publishing.backlinkNature || '').toLowerCase()
                                if (v.includes('do')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">Do-follow</span>
                                if (v.includes('no')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700">No-follow</span>
                                if (v.includes('sponsor')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">Sponsored</span>
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700">{selectedSite.publishing.backlinkNature || '-'}</span>
                              })()}
                            </span>
                          </div>
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
                    <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-5 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/90 dark:bg-gray-950/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                      {isItemInCart(selectedSite.id) ? (
                        <>
                          <Button className="bg-violet-600 text-white hover:bg-violet-500 w-full sm:w-auto" onClick={() => { /* keep as visual state */ }}>{'In Cart'}</Button>
                          <Button variant="outline" onClick={() => removeItem(selectedSite.id)} className="w-full sm:w-auto">Remove from Cart</Button>
                        </>
                      ) : (
                        <Button className="bg-violet-600 text-white hover:bg-violet-500 w-full sm:w-auto" onClick={() => addItem(selectedSite)}>Add to Cart</Button>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </Card>
  )
}

// Memoized wrapper to prevent unnecessary re-renders of PublishersHelpCarousel
const MemoizedPublishersHelpCarousel = React.memo(({ 
  sites,
  searchQuery,
  setSearchQuery,
  loading,
  hasCheckoutFab,
  suggestions,
  suggestionsLoading,
  suggestionsOpen,
  setSuggestionsOpen,
  handleSetSuggestionsContainerRef,
  handlePickSuggestion,
}: { 
  sites: Site[]
  searchQuery: string
  setSearchQuery: (val: string) => void
  loading: boolean
  hasCheckoutFab: boolean
  suggestions: string[]
  suggestionsLoading: boolean
  suggestionsOpen: boolean
  setSuggestionsOpen: (open: boolean) => void
  handleSetSuggestionsContainerRef: (el: HTMLDivElement | null) => void
  handlePickSuggestion: (val: string) => void
}) => {
  const total = sites.length
  const prices = sites.map(x => x.publishing?.price ?? 0).filter(v => v > 0)
  const traffics = sites.map(x => x.toolScores?.semrushOverallTraffic ?? 0).filter(v => v > 0)
  const authorities = sites.map(x => x.toolScores?.semrushAuthority ?? 0).filter(v => v > 0)
  const avgPrice = prices.length ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : 180
  const avgTraffic = traffics.length ? Math.round(traffics.reduce((s, v) => s + v, 0) / traffics.length) : 1_200_000
  const avgAuthority = authorities.length ? Math.round(authorities.reduce((s, v) => s + v, 0) / authorities.length) : 58
  
  return (
    <PublishersHelpCarousel 
      metrics={{ total, avgPrice, avgTraffic, avgAuthority }}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      loading={loading}
      hasCheckoutFab={hasCheckoutFab}
      suggestions={suggestions}
      suggestionsLoading={suggestionsLoading}
      suggestionsOpen={suggestionsOpen}
      setSuggestionsOpen={setSuggestionsOpen}
      setSuggestionsContainerRef={handleSetSuggestionsContainerRef}
      onPickSuggestion={handlePickSuggestion}
    />
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-render when props haven't meaningfully changed
  return (
    prevProps.sites.length === nextProps.sites.length &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.loading === nextProps.loading &&
    prevProps.hasCheckoutFab === nextProps.hasCheckoutFab &&
    JSON.stringify(prevProps.suggestions) === JSON.stringify(nextProps.suggestions) &&
    prevProps.suggestionsLoading === nextProps.suggestionsLoading &&
    prevProps.suggestionsOpen === nextProps.suggestionsOpen
  )
})

function WishlistInlineButton({ site }: { site: Site }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const inList = isInWishlist(site.id)
  return (
    <div className="flex items-center gap-1.5">
      {inList ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-violet-600 hover:text-violet-700"
          onClick={(e) => { e.stopPropagation(); removeFromWishlist(site.id) }}
          title="Remove from wishlist"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-gray-500 hover:text-violet-700"
          onClick={(e) => { e.stopPropagation(); addToWishlist(site) }}
          title="Add to wishlist"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </Button>
      )}
    </div>
  )
}

export default function PublishersClient() {
  // Debug logger for project toggles and data fetching
  const DEBUG_PUBLISHERS = true
  const log = (...args: any[]) => { if (DEBUG_PUBLISHERS) console.log('🧭 PUBLISHERS:', ...args) }
  useEffect(() => { try { (window as any).__DEBUG_PUBLISHERS = DEBUG_PUBLISHERS } catch {} }, [])
  const router = useRouter()
  const { shouldAutoSendQuery, autoSendQuery, clearAutoSend } = useSearchToChatStore()
  const { sendMessage } = useAIChatUtils()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Create a stable reference to relevant URL parameters (excluding sidebar)
  // This prevents unnecessary re-renders when sidebar state changes
  const relevantParams = useMemo(() => {
    if (!searchParams) return ''
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sidebar') // Remove sidebar parameter to prevent unnecessary refetches
    return params.toString()
  }, [searchParams?.toString()]) // Only depend on the stringified version
  // Use filter store for state management
  const {
    filters,
    searchQuery,
    setFilters,
    setSearchQuery,
    clearFilter,
    validateFilters,
    updateFromAI,
    loadFromURL,
    getCurrentState
  } = useFilterStore()

  // Wrapper for FiltersUI component compatibility - memoized to prevent re-renders
  const setFiltersForUI = React.useCallback((updater: React.SetStateAction<Filters>) => {
    if (typeof updater === 'function') {
      setFilters(updater(filters))
    } else {
      setFilters(updater)
    }
  }, [setFilters, filters])

  const { getTotalItems } = useCart()
  const hasCheckoutFab = getTotalItems() > 0
  const { selectedProjectId } = useProjectStore()
  useEffect(() => {
    log('Project toggled:', { selectedProjectId })
  }, [selectedProjectId])

  // Handle auto-send query when sidebar opens - optimized to prevent function dependencies
  useEffect(() => {
    if (shouldAutoSendQuery() && autoSendQuery) {
      // Small delay to ensure sidebar is fully opened
      const timer = setTimeout(async () => {
        await sendMessage(autoSendQuery)
        clearAutoSend()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [autoSendQuery])
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
      semrushOverallTrafficMax: getNum('semrushOverallTrafficMax'),
      semrushOrganicTrafficMin: getNum('semrushOrganicTrafficMin'),
      semrushOrganicTrafficMax: getNum('semrushOrganicTrafficMax'),
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

  // Filters and search query are now managed by the filter store
  const [sites, setSites] = useState<Site[]>([])
  const [limitedSites, setLimitedSites] = useState<Site[]>([])
  const [rowLevel, setRowLevel] = useState<1 | 2 | 3 | 4>(4)
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false) // Separate loading state for table
  const [error, setError] = useState<string | null>(null)

  // URL loading removed - store handles all state management

  // Track previous project ID to detect actual changes and trigger refetch
  const prevProjectIdRef = useRef<string | null>(null)
  const [projectChangeCount, setProjectChangeCount] = useState(0)

  // Minimal per-project hydration from localStorage on project change/reload
  useEffect(() => {
    const projectChanged = prevProjectIdRef.current !== selectedProjectId
    
    if (!projectChanged && prevProjectIdRef.current !== null) {
      // Not a real project change, just a re-render
      return
    }
    
    // Update tracking ref
    prevProjectIdRef.current = selectedProjectId
    
    if (!selectedProjectId) {
      // No project selected -> use defaults
      setFilters(defaultFilters)
      setSearchQuery("")
      // Increment to trigger fetch with defaults
      setProjectChangeCount(prev => prev + 1)
      return
    }
    
    try {
      const raw = localStorage.getItem(`oms:last-filters:${selectedProjectId}`)
      if (!raw) {
        console.log('No saved filters for project, using defaults:', selectedProjectId)
        setFilters(defaultFilters)
        setSearchQuery("")
        // Increment to trigger fetch with defaults
        setProjectChangeCount(prev => prev + 1)
        return
      }
      const saved = JSON.parse(raw) as { filters?: Partial<Filters>; q?: string }
      const nextFilters = { ...defaultFilters, ...(saved?.filters || {}) }
      console.log('Loaded saved filters for project:', { projectId: selectedProjectId, filters: nextFilters })
      setFilters(nextFilters)
      setSearchQuery(typeof saved?.q === 'string' ? saved!.q! : "")
      // Increment to trigger fetch with loaded filters
      setProjectChangeCount(prev => prev + 1)
    } catch {
      console.log('Error loading filters for project, using defaults:', selectedProjectId)
      setFilters(defaultFilters)
      setSearchQuery("")
      // Increment to trigger fetch with defaults
      setProjectChangeCount(prev => prev + 1)
    }
  }, [selectedProjectId, setFilters, setSearchQuery])

  // Listen for apply filters event from modal - moved after fetchData definition

  // URL sync removed - store handles all state management
  
  // Row height configuration
  const maxRowsByLevel: Record<1 | 2 | 3 | 4, number> = { 1: 30, 2: 20, 3: 12, 4: 8 }
  
  // AI filter updates are now handled via URL changes (simplified)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams?.get('page') || 1))
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const itemsPerPage = 8
  // Project filter loading is now handled by the filter store
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPostedQueryRef = useRef<string>("")
  // Marks fetches initiated by the modal Apply button to avoid full-page skeleton
  const manualApplyRef = useRef(false)
  // Suggestions state for website/url recommendations
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const suggestionsAbortRef = useRef<AbortController | null>(null)
  const suggestionsRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  
  // Memoize callback functions to prevent PublishersHelpCarousel from re-rendering
  const handleSetSuggestionsContainerRef = useCallback((el: HTMLDivElement | null) => {
    suggestionsRef.current = el
  }, [])
  
  const openDetailsForWebsite = useCallback(async (website: string) => {
    try {
      const apiFilters = convertFiltersToAPI(filters, website, 1, 1)
      const result = await fetchSitesWithFilters(apiFilters)
      const first = result?.sites?.[0]
      if (first) {
        const site = transformAPISiteToSite(first)
        window.dispatchEvent(new CustomEvent('openSiteDetails', { detail: { site } }))
      }
    } catch {
      // silently ignore; no modal if not found
    }
  }, [filters])

  const handlePickSuggestion = useCallback((val: string) => {
    setSearchQuery(val)
    setSuggestionsOpen(false)
    openDetailsForWebsite(val)
  }, [openDetailsForWebsite])

  const fetchData = useCallback(async (apiFilters: APIFilters = {}, skipLoading = false) => {
    log('fetchData:start', { apiFilters, skipLoading })
    // Allow Apply-triggered fetches even if loading
    if (loading && !skipLoading && !manualApplyRef.current) return
    
    // Determine if this is initial load or filter change
    const isInitialLoad = (sites.length === 0) && !manualApplyRef.current
    
    if (!skipLoading) {
      if (isInitialLoad) {
        setLoading(true) // Show full skeleton for initial load
      } else {
        setTableLoading(true) // Show only table loading for filter changes
      }
    }
    
    setError(null)
    try {
      const result = await fetchSitesWithFilters(apiFilters)
      log('fetchData:success', { total: result.total, sites: result?.sites?.length })
      const transformed = result.sites.map(transformAPISiteToSite)
      setSites(transformed)
      setTotalItems(result.total)
      setTotalPages(Math.ceil(result.total / itemsPerPage))
      if ((result.total || 0) === 0) {
        log('fetchData:empty', { hint: 'No results returned for filters', apiFilters })
      }
    } catch (e: any) {
      log('fetchData:error', { message: e?.message })
      setError(e?.message || 'Failed to load')
      setSites([])
      setTotalItems(0)
      setTotalPages(0)
    } finally {
      log('fetchData:finally', { isInitial: (sites.length === 0) && !manualApplyRef.current })
      // Reset manual apply flag after any fetch completes
      manualApplyRef.current = false
      if (!skipLoading) {
        if (isInitialLoad) {
          setLoading(false)
        } else {
          setTableLoading(false)
        }
      }
    }
  }, [loading, sites.length, itemsPerPage])

  // Listen for apply filters event from modal
  useEffect(() => {
    const handleApplyFilters = () => {
      const apiFilters = convertFiltersToAPI(filters, searchQuery, 1, 1000)
      console.log('Applying filters from modal:', { filters, apiFilters })
      fetchData(apiFilters)
    }

    const handleResetSearchQuery = () => {
      setSearchQuery("")
    }

    window.addEventListener('applyFilters', handleApplyFilters)
    window.addEventListener('resetSearchQuery', handleResetSearchQuery)
    return () => {
      window.removeEventListener('applyFilters', handleApplyFilters)
      window.removeEventListener('resetSearchQuery', handleResetSearchQuery)
    }
  }, [filters, searchQuery, fetchData, setSearchQuery])

  const debouncedFetch = useCallback((apiFilters: APIFilters, delay = 400) => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    fetchTimeoutRef.current = setTimeout(() => { fetchData(apiFilters) }, delay)
  }, [fetchData])

  // Track the last processed project change count to avoid duplicate fetches
  const lastFetchedCountRef = useRef(0)
  
  // Fetch data when project changes (after filters are loaded and state is updated)
  useEffect(() => {
    // Only fetch if projectChangeCount changed (meaning a new project change happened)
    if (projectChangeCount === 0 || projectChangeCount === lastFetchedCountRef.current) {
      return
    }
    
    // Update the last fetched count
    lastFetchedCountRef.current = projectChangeCount
    
    // Small delay to ensure state has updated from the previous useEffect
    const timer = setTimeout(() => {
      const apiFilters = convertFiltersToAPI(filters, searchQuery, 1, 1000)
      log('project-change:fetch', { 
        projectId: selectedProjectId, 
        filters, 
        searchQuery,
        apiFilters,
        changeCount: projectChangeCount
      })
      fetchData(apiFilters)
    }, 100) // Increased delay to ensure filters state has fully updated
    
    return () => clearTimeout(timer)
  }, [projectChangeCount, filters, searchQuery, selectedProjectId, fetchData]) // Trigger when count changes or filters update

  // Handle page changes - simplified to prevent circular dependencies
  const handlePageChange = useCallback((page: number) => {
    // Update state immediately to prevent circular dependencies
    setCurrentPage(page)
    // Store handles state management
  }, [])

  // Initial data fetch only - no auto-fetching on filter changes
  useEffect(() => { 
    // Only fetch on initial load when there are no sites
    if (sites.length === 0) {
      const apiFilters = convertFiltersToAPI(filters, searchQuery, 1, 1000) // Fetch up to 1000 items
      log('initial-load', { filters, apiFilters, priceMin: filters.priceMin, priceMax: filters.priceMax })
      fetchData(apiFilters)
    }
  }, []) // Only run once on mount

  // Auto-fetch data when filters change (AI-only)
  useEffect(() => {
    console.log('🔄 PUBLISHERS: useEffect triggered with filters:', filters, 'sites.length:', sites.length)
    
    // Only fetch automatically for AI-origin changes
    if (aiFilterChangeRef.current) {
      const apiFilters = convertFiltersToAPI(filters, searchQuery, 1, 1000)
      log('ai-change:auto-fetch', { filters, apiFilters, fromAI: aiFilterChangeRef.current })
      // AI changes: immediate fetch
      console.log('⚡ PUBLISHERS: AI change detected - immediate fetch')
      fetchData(apiFilters)
      aiFilterChangeRef.current = false // Reset flag
    } else {
      log('non-ai-change:waiting-apply')
    }
  }, [filters, searchQuery, fetchData]) // Watch for filter changes

  // Listen for URL parameter changes and update currentPage - ignore sidebar parameter changes
  useEffect(() => {
    const pageFromUrl = Number(searchParams?.get('page') || 1)
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl)
    }
  }, [relevantParams]) // Remove currentPage from dependencies to prevent circular updates

  // Project filter loading is now handled by the filter store

  // Persist last-used filters per project whenever filters/query change (server + local, debounced)
  useEffect(() => {
    if (!selectedProjectId) return
    const payload = { filters, q: searchQuery }
    // Local cache
    try { localStorage.setItem(`oms:last-filters:${selectedProjectId}`, JSON.stringify(payload)) } catch {}
    // Server save (debounced)
    const t = setTimeout(() => {
      fetch(`/api/projects/${encodeURIComponent(selectedProjectId)}/filters?page=publishers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: payload })
      }).catch(() => {})
    }, 500)
    return () => clearTimeout(t)
  }, [filters, searchQuery, selectedProjectId])

  // Store-only approach - no URL monitoring needed

  async function revealWebsite(id: string) {
    try {
      const res = await fetch('/api/publishers/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      if (data?.website) {
        setRevealed(prev => ({ ...prev, [id]: data.website }))
      }
    } catch (e) {
      // no-op visual for now
    }
  }

  useEffect(() => {
    // Reset to page 1 when filters or search query change
    if (currentPage !== 1) {
      setCurrentPage(1)
      // Store handles state management
    }
  }, [filters, searchQuery])

  // Fetch search suggestions from external API (debounced) - optimized to prevent unnecessary recreations
  const fetchSuggestions = useCallback(async (q: string) => {
    const query = q.trim()
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    // Helper: local fallback from loaded sites
    const localFromSites = (): string[] => {
      const ql = query.toLowerCase()
      const toDomain = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const set = new Set<string>()
      const out: string[] = []
      for (const s of sites) {
        const name = (s.name || '').toLowerCase()
        const url = (s.url || '').toLowerCase()
        const stripped = toDomain(s.url || '')
        if (!name && !url) continue
        if (name.includes(ql) || url.includes(ql) || stripped.includes(ql)) {
          const candidate = stripped || s.name || s.url
          const val = candidate || ''
          if (val && !set.has(val)) {
            set.add(val)
            out.push(val)
          }
        }
        if (out.length >= 8) break
      }
      return out
    }

    try {
      setSuggestionsLoading(true)
      if (suggestionsAbortRef.current) suggestionsAbortRef.current.abort()
      const controller = new AbortController()
      suggestionsAbortRef.current = controller

      // Race external API with a local fallback timeout
      const external = (async () => {
        try {
          const res = await fetch(`https://agents.outreachdeal.com/webhook/website-suggestion?query=${encodeURIComponent(query)}`, {
            signal: controller.signal,
            cache: 'no-store',
          })
          let data: any = null
          try { data = await res.json() } catch { data = null }
          let list: string[] = []
          if (Array.isArray(data)) list = data as string[]
          else if (data && Array.isArray(data.websites)) list = data.websites as string[]
          else if (data && Array.isArray(data.suggestions)) list = data.suggestions as string[]
          else if (data && Array.isArray(data.results)) list = data.results as string[]
          return list.filter(Boolean)
        } catch {
          return [] as string[]
        }
      })()

      const timeout = new Promise<string[]>((resolve) => {
        const id = setTimeout(() => {
          try { resolve(localFromSites()) } finally { clearTimeout(id) }
        }, 1200)
      })

      // Prefer external results; fall back to local after timeout
      const list = (await Promise.race([external, timeout]))
      const merged = list.length > 0 ? list : localFromSites()
      // Limit to top 4 unique suggestions
      const unique: string[] = []
      const seen = new Set<string>()
      for (const s of merged) {
        if (!seen.has(s)) { seen.add(s); unique.push(s) }
        if (unique.length >= 4) break
      }
      setSuggestions(unique)
    } catch {
      // Fallback purely to local if anything throws
      const local = localFromSites().slice(0, 4)
      setSuggestions(local)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [sites])

  // Debounce suggestions on input change - optimized to prevent function dependency
  useEffect(() => {
    const q = searchQuery
    const tid = setTimeout(() => { fetchSuggestions(q) }, 300)
    return () => clearTimeout(tid)
  }, [searchQuery])

  // Close suggestions on outside click / escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = suggestionsRef.current
      if (!el) return
      if (el && !el.contains(e.target as Node)) setSuggestionsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSuggestionsOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  // Store-only approach - no URL sync needed

  const results = useMemo(() => {
    // When there's a search query, rely on API filtering instead of frontend filtering
    // The API should return only the matching websites
    return sites
  }, [sites])

  const displayedSites = useMemo(() => results, [results])

  // Memoize FiltersUI to prevent unnecessary re-renders
  const memoizedFiltersUI = React.useMemo(() => (
    <FiltersUI 
      filters={filters} 
      setFilters={setFiltersForUI} 
      loading={loading}
      onRefresh={() => {
        // Apply current filters
        manualApplyRef.current = true
        const apiFilters = convertFiltersToAPI(filters, searchQuery, 1, 1000)
        console.log('Applying filters from button:', { filters, apiFilters })
        fetchData(apiFilters)
      }}
      onApplyDraft={(draft) => {
        manualApplyRef.current = true
        const apiFilters = convertFiltersToAPI(draft, searchQuery, 1, 1000)
        console.log('Applying filters from modal (parent):', { draft, apiFilters })
        fetchData(apiFilters)
      }}
    />
  ), [filters, setFiltersForUI, loading, searchQuery, fetchData])

  // Memoize ResultsTable to prevent unnecessary re-renders
  const memoizedResultsTable = React.useMemo(() => (
    <ResultsTable 
      sites={displayedSites} 
      loading={tableLoading} 
      onRowHeightButtonRef={(el) => { rowHeightButtonElRef.current = el }} 
      onLimitedSitesChange={setLimitedSites} 
      onRowLevelChange={setRowLevel} 
      currentPage={currentPage} 
      itemsPerPage={maxRowsByLevel[rowLevel]} 
    />
  ), [displayedSites, tableLoading, currentPage, maxRowsByLevel, rowLevel])

  // Save interest only if, after a short delay, results remain zero for a meaningful query - optimized
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
        const apiFilters = convertFiltersToAPI(filters, latestQuery, currentPage, itemsPerPage)
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
  }, [searchQuery, results.length, loading, filters, currentPage, itemsPerPage])

  // ---------------------- Guided Tour (Publishers Onboarding) ----------------------
  type TourStep = 'filters' | 'rowHeight' | 'project'
  const [showTour, setShowTour] = useState<boolean>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('publishers:tutorialCompleted') : 'true'
      return raw !== 'true'
    } catch { return true }
  })
  const [tourStep, setTourStep] = useState<TourStep>('filters')
  const filtersContainerRef = useRef<HTMLDivElement | null>(null)
  const rowHeightButtonElRef = useRef<HTMLButtonElement | null>(null)
  const projectPanelRef = useRef<HTMLDivElement | null>(null)
  const [aiIntroOpen, setAiIntroOpen] = useState(false)
  const { toggleSidebar } = useResizableLayout()
  const { isSidebarOpen } = useLayout()
  const [aiHintVisible, setAiHintVisible] = useState(false)
  const [aiOverlayVisible, setAiOverlayVisible] = useState(false)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => { setIsClient(true) }, [])
  const [aiOverlayPos, setAiOverlayPos] = useState<{ top: number; left: number; width: number } | null>(null)
  
  // Track if filter change came from AI to avoid debouncing
  const aiFilterChangeRef = useRef(false)
  
  // Expose AI filter flag function globally for AI sidebar
  useEffect(() => {
    (window as any).setAIFilterFlag = () => {
      aiFilterChangeRef.current = true
    }
    return () => {
      delete (window as any).setAIFilterFlag
    }
  }, [])
  useEffect(() => {
    if (!aiOverlayVisible) return
    const calc = () => {
      const top = Math.max((window.innerHeight * 0.5) - 120, 16)
      const width = Math.min(300, window.innerWidth - 32)
      const left = Math.min(window.innerWidth - width - 16, Math.max(16, window.innerWidth * 0.66))
      setAiOverlayPos({ top, left, width })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [aiOverlayVisible])

  const completeTutorial = () => {
    try { localStorage.setItem('publishers:tutorialCompleted', 'true') } catch {}
    setShowTour(false)
  }

  const skipTutorial = () => {
    setShowTour(false)
    // Do not open sidebar; show AI helper overlay with blur + tooltip
    try { localStorage.setItem('publishers:tutorialCompleted', 'true') } catch {}
    setAiOverlayVisible(true)
  }

  const nextStep = () => {
    setTourStep((prev) => {
      if (prev === 'filters') return 'rowHeight'
      if (prev === 'rowHeight') return 'project'
      // project -> complete
      completeTutorial()
      return prev
    })
  }

  // Show skeleton while loading initial data
  if (loading && sites.length === 0) {
    return (
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 w-full max-w-[96rem] mx-auto no-scrollbar bg-gray-50 dark:bg-transparent">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:justify-between no-scrollbar sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 mb-6 sm:mb-8 lg:mb-10 lg:grid-cols-12 lg:gap-6 xl:gap-8 items-stretch min-h-[300px] sm:min-h-[400px]">
          {/* Filters section skeleton */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
            <div className="flex-1">
              <Card className="bg-white dark:bg-gray-800 shadow-sm">
                <CardContent className="p-4">
                  {/* Filter pebbles skeleton */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    ))}
                  </div>
                  
                  {/* Search and controls skeleton */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <div className="h-8 w-full sm:w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-full sm:w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col">
            <div className="flex-1 sticky top-0">
              <Card className="bg-white dark:bg-gray-800 shadow-sm h-full">
                <CardContent className="p-6">
                  {/* Metrics cards skeleton */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 mx-auto" />
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Search suggestions skeleton */}
                  <div className="space-y-3">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Results table skeleton */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <header className="px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </header>
          </div>
          <div className="relative">
            <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              <div style={{ minWidth: 'max-content' }}>
              {/* Table header skeleton */}
              <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-b border-gray-100 dark:border-gray-700/60">
                <div className="h-4 w-1/2 sm:w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              {/* Rows skeleton */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 grid grid-cols-6 gap-3 sm:gap-5 items-center">
                    <div className="col-span-2 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="col-span-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="col-span-1 h-7 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 w-full max-w-[96rem] mx-auto no-scrollbar bg-gray-50 dark:bg-transparent min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col sm:flex-row sm:justify-between no-scrollbar sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl text-foreground font-bold">Publishers</h1>
        </div>

        {/* Project Context moved into sidebar (PublishersHelpCarousel) */}

        <div className="grid grid-cols-1 mb-6 sm:mb-8 lg:mb-10 lg:grid-cols-12 lg:gap-6 xl:gap-8 items-stretch">
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col relative" ref={filtersContainerRef}>
            <div className="flex-1 flex flex-col">
              {loading && sites.length === 0 ? (
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  {memoizedFiltersUI}
                  {/* Mobile/Tablet compact project toggle just below filters */}
                  <div className="relative z-40 mt-3">
                    <ProjectToggleCompact />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col" ref={projectPanelRef}>
            <div className="flex-1 sticky top-0">
              {loading && sites.length === 0 ? (
                <div className="w-full h-full flex flex-col">
                  {/* Search and controls section skeleton */}
                  <div className="flex-shrink-0 mb-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="space-y-3">
                      <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>

                  {/* Quick tips section skeleton */}
                  <div className="flex-shrink-0">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                  </div>
                  
                  {/* Project panel skeleton */}
                  <div className="mt-4 flex-1 flex flex-col min-h-0 max-h-[250px]">
                    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-3 sm:p-4 flex flex-col gap-3 h-full">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      </div>
                      <div className="h-8 w-full bg-violet-600/20 dark:bg-violet-600/10 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ) : (
                <MemoizedPublishersHelpCarousel 
                  sites={displayedSites}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  loading={loading}
                  hasCheckoutFab={hasCheckoutFab}
                  suggestions={suggestions}
                  suggestionsLoading={suggestionsLoading}
                  suggestionsOpen={suggestionsOpen}
                  setSuggestionsOpen={setSuggestionsOpen}
                  handleSetSuggestionsContainerRef={handleSetSuggestionsContainerRef}
                  handlePickSuggestion={handlePickSuggestion}
                />
              )}
            </div>
          </div>
        </div>

        {error && <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">{error}</div>}

        {loading && sites.length === 0 ? (
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ) : (
          memoizedResultsTable
        )}

        {/* Pagination */}
        {(() => {
          // Calculate client-side pagination based on row height
          const clientSideItemsPerPage = maxRowsByLevel[rowLevel]
          const clientSideTotalPages = Math.ceil(totalItems / clientSideItemsPerPage)
          
          return clientSideTotalPages > 1 && (
            <div className="mt-6">
              <PaginationPublishers
                currentPage={currentPage}
                totalPages={clientSideTotalPages}
                totalItems={totalItems}
                itemsPerPage={clientSideItemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )
        })()}

      </div>
      {/* Guided Tour Overlay */}
      {isClient && showTour && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          {/* Backdrop with blur except around target */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

          {/* Tooltip panel positioned near current step element */}
          {(() => {
            let target: HTMLElement | null = null
            if (tourStep === 'filters') target = filtersContainerRef.current
            else if (tourStep === 'rowHeight') target = rowHeightButtonElRef.current
            else if (tourStep === 'project') target = projectPanelRef.current
            if (!target) return null

            const rect = target.getBoundingClientRect()
            const top = Math.max(rect.top - 12, 12)
            const left = Math.min(Math.max(rect.left, 12), window.innerWidth - 340)

            return (
              <div className="absolute" style={{ top, left, width: Math.min(320, window.innerWidth - 24) }}>
                {/* Highlight box outline */}
                <div className="pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-violet-400/80" />
                {/* Tooltip card */}
                <div className="pointer-events-auto relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-xl p-4">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {tourStep === 'filters' ? 'Filters' : tourStep === 'rowHeight' ? 'Row Height' : 'Projects'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                    {tourStep === 'filters' && 'Use these pills to quickly filter publishers by niche, language, country and more. Click any pill to open detailed options.'}
                    {tourStep === 'rowHeight' && 'Adjust the table row density. Choose Short to see more rows at once or Extra Tall for richer details.'}
                    {tourStep === 'project' && 'You can buy individually with no project, or assign purchases to a project to organize orders.'}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={skipTutorial} className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60">Skip tutorial</button>
                    <button onClick={nextStep} className="text-xs px-2.5 py-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700">{tourStep === 'project' ? 'Finish' : 'Next'}</button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* AI helper overlay with blur + tooltip (shown after Skip) */}
      {isClient && aiOverlayVisible && aiOverlayPos && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div className="absolute" style={{ top: aiOverlayPos.top, left: aiOverlayPos.left, width: aiOverlayPos.width }}>
            <div className="pointer-events-auto relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl p-4">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Meet your AI assistant</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">It can help you:</div>
                  <ul className="text-xs text-gray-700 dark:text-gray-200 list-disc pl-4 space-y-1">
                    <li>Apply filters for you</li>
                    <li>Explain metrics and columns</li>
                    <li>Find publishers by goals</li>
                  </ul>
                  <div className="mt-3">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Try:</div>
                    <div className="text-[11px] rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 text-gray-700 dark:text-gray-200">
                      "Show sites under $150 with DR ≥ 50"
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAiOverlayVisible(false)}>Close</Button>
                    <Button size="sm" className="h-8 text-xs" onClick={() => { setAiOverlayVisible(false); toggleSidebar() }}>Got it</Button>
                  </div>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white dark:border-r-gray-900" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
function MaskedWebsite({ site, maxStars = 14, showRevealButton = true }: { site: Site; maxStars?: number; showRevealButton?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)

  // Removed empty useEffect that was causing unnecessary re-renders

  async function onReveal(e: React.MouseEvent) {
    e.stopPropagation()
    if (revealed || loading) return
    try {
      setLoading(true)
      const res = await fetch('/api/publishers/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: site.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const website: string = data.website
      setRevealed(website)
      
      // Dispatch custom event to notify dashboard of credit usage
      window.dispatchEvent(new CustomEvent('creditsUsed', { detail: { creditsUsed: 1 } }))
    } catch (err) {
      // optionally show toast
    } finally {
      setLoading(false)
    }
  }

  // Cap masked length to avoid overflow
  const masked = '*'.repeat(maxStars)
  const display = revealed ? revealed : masked
  return (
    <div
      className="group relative inline-flex items-center gap-2 max-w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {revealed ? (
        <a
          href={`https://${revealed}`}
          target="_blank"
          rel="noreferrer"
          className="text-violet-600 hover:text-violet-700 underline truncate max-w-[140px] sm:max-w-[180px]"
          onClick={(e) => e.stopPropagation()}
          title={revealed}
        >
          {revealed}
        </a>
      ) : (
        <span
          className="text-gray-300 dark:text-gray-200/80 tracking-wide truncate select-none cursor-pointer leading-4 min-h-[18px] sm:leading-5 sm:min-h-[20px]"
          title="Click to reveal website"
          onClick={onReveal}
          role="button"
          aria-label="Reveal website"
        >
          {display}
        </span>
      )}
      {!revealed && showRevealButton && (
        <button
          onClick={onReveal}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[10px] sm:text-[11px] px-1.5 py-0.5 sm:px-2 sm:py-1 leading-4 sm:leading-5 min-h-[22px] sm:min-h-[28px] rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-300 dark:hover:bg-violet-500/10 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Revealing…' : 'Show website'}
        </button>
      )}
    </div>
  )
}
