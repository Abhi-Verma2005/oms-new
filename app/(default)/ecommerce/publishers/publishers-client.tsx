"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ModalBasic from "@/components/modal-basic"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card"
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

  const pebble = (label: string, key: keyof Filters) => (
    <Button
      type="button"
      size="sm"
      variant={filters[key] ? 'default' : 'outline'}
      className={`rounded-full px-3.5 flex items-center gap-2`}
      onClick={() => open(key)}
      disabled={loading}
    >
      {pebbleIconMap[key]}
      <span>{label}</span>
      {filters[key] ? <span className="ml-0.5 opacity-70">•</span> : null}
    </Button>
  )

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
            <Input placeholder="Search countries" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
            <Select value={filters.country || undefined} onValueChange={(v) => setFilters(f => ({ ...f, country: v === '__all__' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Countries</SelectLabel>
                  <SelectItem value="__all__">All countries</SelectItem>
                  {["United States","United Kingdom","Canada","India","Germany","France","Spain","Australia","Netherlands","Brazil"].filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
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
              value={[lo, lo]}
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
              value={[lo, lo]}
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
    add('availability', `Available only`, filters.availability)
    return chips
  }, [filters])

  return (
    <Card className="mb-6 bg-white">
      <UICardHeader className="pb-2">
        <UICardTitle className="text-lg">Filters</UICardTitle>
      </UICardHeader>
      <CardContent className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FilterIcon className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-medium">Refine Results</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Apply saved view */}
          <Select value={applyingViewId || undefined} onValueChange={(v) => { if (v === '__none__') { setApplyingViewId(""); return } applyViewById(v) }}>
            <SelectTrigger className="h-10 w-56">
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
          <Input className="h-10 text-sm w-56" placeholder="Save as view..." value={viewName} onChange={(e) => setViewName(e.target.value)} disabled={loading} />
          <Button className="h-10 inline-flex items-center gap-2" onClick={saveCurrentView} disabled={loading || !viewName.trim()}>
            <CheckCircle className="w-4 h-4" />
            Save
          </Button>
          <Button variant="outline" className="h-10 inline-flex items-center gap-2" onClick={() => setFilters(defaultFilters)} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button className="h-10" variant="secondary" onClick={() => setFilters(defaultFilters)} disabled={loading}>Reset All</Button>
        </div>
      </div>

      {/* Grouped filter pebbles */}
      <div className="space-y-3">
        {Object.entries(groupedPebbles).map(([category, pebbles]) => (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              {categoryIcons[category as keyof typeof categoryIcons]}
              <span className="font-medium">{categoryLabels[category as keyof typeof categoryLabels]}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {pebbles.map(p => (
                <span key={p.key}>{pebble(p.label, p.key)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeChips.map(chip => (
            <button key={chip.key as string} onClick={() => open(chip.key)} className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs bg-violet-600 text-white border border-violet-600">
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

function ResultsTable({ sites, loading }: { sites: Site[]; loading: boolean }) {
  const { addItem, isItemInCart } = useCart()
  const [rowLevel, setRowLevel] = useState<1 | 2 | 3 | 4>(2)
  const rowPaddingByLevel: Record<1|2|3|4, string> = { 1: 'py-2', 2: 'py-3', 3: 'py-4', 4: 'py-5' }
  const [rowsOpen, setRowsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  // Column visibility controller (modeled after OMS filter-page)
  type ColumnKey =
    | 'website'
    | 'niche'
    | 'countryLang'
    | 'authority'
    | 'spam'
    | 'price'
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
    | 'cart'
    | 'order'
  const columnDefs: { key: ColumnKey; label: string }[] = [
    { key: 'website', label: 'Website' },
    { key: 'niche', label: 'Niche' },
    { key: 'countryLang', label: 'Country/Lang' },
    { key: 'authority', label: 'Authority' },
    { key: 'spam', label: 'Spam' },
    { key: 'price', label: 'Price' },
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
    { key: 'cart', label: 'Cart' },
    { key: 'order', label: 'Order' },
  ]
  const allKeys = useMemo(() => columnDefs.map(c => c.key), [])
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(allKeys)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const toggleColumn = (key: ColumnKey) => setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  const showAllColumns = () => setVisibleColumns(allKeys)
  const hideAllColumns = () => setVisibleColumns([])
  const rightAligned = useMemo(() => new Set<ColumnKey>([
    'spam','price','traffic','organicTraffic','authorityScore','outboundLimit','backlinksAllowed','wordLimit','tatDays'
  ]), [])

  if (loading) return <Card className="p-6 bg-white">Loading…</Card>
  return (
          <Card className="bg-white">
      <header className="px-5 py-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Publishers <span className="text-gray-400 dark:text-gray-500 font-medium">{sites.length}</span></h2>
      </header>
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <div className="text-sm text-gray-500 dark:text-gray-400"></div>
        <div className="flex items-center gap-2">
          <Popover open={rowsOpen} onOpenChange={setRowsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs inline-flex items-center gap-2">
              <span>Rows: {rowLevel === 1 ? 'Short' : rowLevel === 2 ? 'Medium' : rowLevel === 3 ? 'Tall' : 'Extra Tall'}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${rowsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-white dark:bg-gray-900">
            <div className="space-y-1">
              {[1,2,3,4].map((lvl) => (
                <button key={lvl} className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${rowLevel===lvl ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`} onClick={() => setRowLevel(lvl as 1|2|3|4)}>
                  {lvl===1?'Short':lvl===2?'Medium':lvl===3?'Tall':'Extra Tall'}
                </button>
              ))}
            </div>
          </PopoverContent>
          </Popover>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs inline-flex items-center gap-2"
              onClick={() => setColumnsOpen(o => !o)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="4" width="5" height="16" rx="1" />
                <rect x="10" y="4" width="5" height="16" rx="1" />
                <rect x="17" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Columns</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${columnsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </Button>
            {columnsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-lg z-10">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <button className="text-[11px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={showAllColumns}>Show all</button>
                  <button className="text-[11px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={hideAllColumns}>Hide all</button>
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  {columnDefs.map(col => (
                    <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer select-none">
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
                  <div className="px-3 py-2 text-[11px] text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60">
                    Showing {visibleColumns.length} of {allKeys.length} columns
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
            <div className="overflow-x-auto">
              <Table className="dark:text-gray-300">
                <UITableHeader>
                  <TableRow className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-b border-gray-100 dark:border-gray-700/60">
                    {columnDefs.map(col => (
                      visibleColumns.includes(col.key) ? (
                        <TableHead key={col.key} className={`px-5 py-3 whitespace-nowrap ${rightAligned.has(col.key) ? 'text-right' : 'text-left'}`}>{col.label}</TableHead>
                      ) : null
                    ))}
                  </TableRow>
                </UITableHeader>
                <TableBody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
            {sites.length === 0 ? (
              <TableRow><TableCell className="px-5 py-6" colSpan={visibleColumns.length || 1}>No results</TableCell></TableRow>
            ) : sites.map(s => (
              <TableRow key={s.id} className={`${rowPaddingByLevel[rowLevel]} cursor-pointer odd:bg-gray-50/40 dark:odd:bg-gray-900/10`} onClick={() => { setSelectedSite(s); setDetailsOpen(true) }}>
                {visibleColumns.includes('website') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="font-medium"><a href={s.url} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-700 underline" onClick={(e) => e.stopPropagation()}>{s.name}</a></div>
                  {rowLevel >= 2 && (
                    <div className="text-xs text-gray-500">{s.url.replace(/^https?:\/\//, "")}</div>
                  )}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Category:</span> {s.category}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Language:</span> {s.language}</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('niche') && (
                <TableCell className={`px-5 ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="flex flex-wrap gap-1 max-w-[320px]">
                    {s.niche
                      .split(',')
                      .map(n => n.trim())
                      .filter(Boolean)
                      .map((n, idx) => (
                        <span key={`${n}-${idx}`} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-600">{n}</span>
                      ))}
                  </div>
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Type:</span> {s.category}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Country:</span> {s.country}</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('countryLang') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="text-sm">{s.country} • <span className="text-xs">{s.language}</span></div>
                </TableCell>
                )}
                {visibleColumns.includes('authority') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.da}/{s.pa}/{s.dr}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">DA:</span> {s.da}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">PA:</span> {s.pa} <span className="text-gray-400">| DR:</span> {s.dr}</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('spam') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('spam') ? 'text-right' : ''}`}>
                  <div className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{s.spamScore}%</span>
                    {(() => {
                      const risk = s.spamScore <= 3 ? 'Low' : s.spamScore <= 6 ? 'Medium' : 'High'
                      if (risk === 'High') return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3.5 h-3.5" /> High</Badge>
                      if (risk === 'Medium') return <Badge variant="outline">Medium</Badge>
                      return <Badge variant="secondary">Low</Badge>
                    })()}
                  </div>
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Score:</span> {s.spamScore}/10</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('price') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('price') ? 'text-right' : ''}`}>
                  <span className="font-medium tabular-nums">{"$"}{s.publishing.price.toLocaleString()}</span>
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Base:</span> ${s.publishing.price}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">With Content:</span> ${s.publishing.priceWithContent}</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('traffic') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('traffic') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{(s.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M</span>
                  {rowLevel >= 2 && (
                    <div className="text-xs text-gray-500">overall</div>
                  )}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Organic:</span> {(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Authority:</span> {s.toolScores.semrushAuthority}</div>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('organicTraffic') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('organicTraffic') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</span>
                </TableCell>
                )}
                {visibleColumns.includes('authorityScore') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('authorityScore') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{s.toolScores.semrushAuthority}</span>
                </TableCell>
                )}
                {visibleColumns.includes('availability') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.additional.availability ? (
                    <Badge variant="secondary">Available</Badge>
                  ) : (
                    <Badge variant="outline">Unavailable</Badge>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('sampleUrl') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.quality?.sampleUrl ? (
                    <a className="text-violet-600 hover:text-violet-700 underline" href={s.quality.sampleUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View</a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                )}
                {visibleColumns.includes('lastPublished') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.quality?.lastPublished || 'Unknown'}
                </TableCell>
                )}
                {visibleColumns.includes('outboundLimit') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('outboundLimit') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{s.quality?.outboundLinkLimit ?? '-'}</span>
                </TableCell>
                )}
                {visibleColumns.includes('backlinkNature') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="inline-flex items-center gap-1.5 text-sm">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{s.publishing.backlinkNature}</span>
                  </div>
                </TableCell>
                )}
                {visibleColumns.includes('backlinksAllowed') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('backlinksAllowed') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{s.publishing.backlinksAllowed}</span>
                </TableCell>
                )}
                {visibleColumns.includes('wordLimit') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('wordLimit') ? 'text-right' : ''}`}>
                  <span className="tabular-nums">{s.publishing.wordLimit ?? '-'}</span>
                </TableCell>
                )}
                {visibleColumns.includes('tatDays') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]} ${rightAligned.has('tatDays') ? 'text-right' : ''}`}>
                  <div className={`inline-flex items-center gap-1.5 ${rightAligned.has('tatDays') ? 'justify-end' : ''}`}>
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="tabular-nums">{s.publishing.tatDays}</span>
                  </div>
                </TableCell>
                )}
                {visibleColumns.includes('linkPlacement') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.linkPlacement ?? '-'}
                </TableCell>
                )}
                {visibleColumns.includes('permanence') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.permanence ?? '-'}
                </TableCell>
                )}
                {visibleColumns.includes('cart') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <Button
                    size="sm"
                    variant={isItemInCart(s.id) ? 'default' : 'outline'}
                    onClick={(e) => { e.stopPropagation(); addItem(s) }}
                  >
                    {isItemInCart(s.id) ? 'In Cart' : 'Add to Cart'}
                  </Button>
                </TableCell>
                )}
                {visibleColumns.includes('order') && (
                <TableCell className={`px-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {/* Order button removed per request */}
                </TableCell>
                )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Site Details</span>
                    {selectedSite && <span className="text-sm text-gray-500">{selectedSite.name}</span>}
                  </DialogTitle>
                </DialogHeader>
                {selectedSite && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Website</div>
                        <div className="font-medium"><a href={selectedSite.url} className="text-violet-600 hover:text-violet-700 underline" target="_blank" rel="noreferrer">{selectedSite.url}</a></div>
                      </div>
                      <div>
                        <div className="text-gray-500">Niche</div>
                        <div className="font-medium">{selectedSite.niche}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Country / Language</div>
                        <div className="font-medium">{selectedSite.country} • {selectedSite.language}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Authority (DA/PA/DR)</div>
                        <div className="font-medium">{selectedSite.da}/{selectedSite.pa}/{selectedSite.dr}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Spam Score</div>
                        <div className="font-medium">{selectedSite.spamScore}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Traffic (overall/organic)</div>
                        <div className="font-medium">{(selectedSite.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M / {(selectedSite.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Price</div>
                        <div className="font-medium">${selectedSite.publishing.price.toLocaleString()} ({selectedSite.publishing.priceWithContent ? `w/ content $${selectedSite.publishing.priceWithContent}` : 'base'})</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Backlinks Allowed / Nature</div>
                        <div className="font-medium">{selectedSite.publishing.backlinksAllowed} • {selectedSite.publishing.backlinkNature}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">TAT / Placement / Permanence</div>
                        <div className="font-medium">{selectedSite.publishing.tatDays}d • {selectedSite.publishing.linkPlacement ?? '-'} • {selectedSite.publishing.permanence ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Availability</div>
                        <div className="font-medium">{selectedSite.additional.availability ? 'Available' : 'Unavailable'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Sample URL</div>
                        <div className="font-medium">{selectedSite.quality?.sampleUrl ? <a className="text-violet-600 hover:text-violet-700 underline" href={selectedSite.quality.sampleUrl} target="_blank" rel="noreferrer">View</a> : '-'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </Card>
  )
}

export default function PublishersClient() {
  function HeaderCheckout() {
    const { getTotalItems } = useCart()
    const count = getTotalItems()
    if (count <= 0) return null
    return (
      <Button asChild className="h-10">
        <a href="/checkout">
          Checkout ({count})
        </a>
      </Button>
    )
  }

  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [searchQuery, setSearchQuery] = useState("")
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sites
    return sites.filter(s => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q))
  }, [sites, searchQuery])

  return (
    <CartProvider>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl md:text-3xl text-foreground font-bold">Publishers</h1>
          <div className="flex items-center gap-2.5">
            <Input className="h-10 text-sm w-60" placeholder="Search by website or URL" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Button variant="outline" className="h-10" onClick={() => { if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current); fetchData(convertFiltersToAPI(filters, searchQuery)) }} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
            <Button className="h-10" variant="secondary" onClick={() => setFilters(defaultFilters)}>Reset</Button>
            <HeaderCheckout />
          </div>
        </div>

        <FiltersUI filters={filters} setFilters={setFilters} loading={loading} />

        {error && <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300">{error}</div>}

        <ResultsTable sites={results} loading={loading} />
      </div>
    </CartProvider>
  )
}




