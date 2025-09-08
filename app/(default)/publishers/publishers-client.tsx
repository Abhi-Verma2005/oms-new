"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ModalBasic from "@/components/modal-basic"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">{label}</span>
          <span className="tabular-nums">{formatValue(low)} – {formatValue(high)}</span>
        </div>
        <div className="relative h-8 select-none">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-amber-400 rounded"
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
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Min</label>
            <input
              className="form-input w-full"
              type="number"
              value={String(low)}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Max</label>
            <input
              className="form-input w-full"
              type="number"
              value={String(high)}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    )
  }

  const pebble = (label: string, key: keyof Filters) => (
    <button onClick={() => open(key)} disabled={loading} className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm border transition-transform active:scale-95 cursor-pointer ${filters[key] ? 'bg-yellow-400 text-gray-900 border-yellow-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}>
      {label}
      {filters[key] ? <span className="ml-1 opacity-70">•</span> : null}
    </button>
  )

  const renderModalBody = () => {
    if (!activeKey) return null
    switch (activeKey) {
      case 'country':
        return (
          <div className="p-4 space-y-2">
            <input className="form-input w-full" placeholder="Search countries" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
            <select className="form-select w-full" value={filters.country || ""} onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}>
              <option value="">All countries</option>
              {["United States","United Kingdom","Canada","India","Germany","France","Spain","Australia","Netherlands","Brazil"].filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        )
      case 'language':
  return (
          <div className="p-4 space-y-2">
            <input className="form-input w-full" placeholder="Filter languages" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
            <select className="form-select w-full" value={filters.language || ""} onChange={(e) => setFilters(f => ({ ...f, language: e.target.value }))}>
              <option value="">All languages</option>
              {["English","Spanish","French","German","Italian","Portuguese","Dutch","Russian","Chinese","Japanese"].filter(l => l.toLowerCase().includes(countrySearch.toLowerCase())).map(l => (<option key={l} value={l}>{l}</option>))}
            </select>
        </div>
        )
      case 'niche':
        return (
          <div className="p-4 space-y-2">
            <input className="form-input w-full" placeholder="Enter niche" value={filters.niche} onChange={(e) => { setFilters(f => ({ ...f, niche: e.target.value })); setNicheSearch(e.target.value) }} />
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
            <input className="form-input w-full" type="number" placeholder="Enter value" value={String((filters as any)[activeKey] ?? "")} onChange={(e) => setFilters(f => ({ ...f, [activeKey]: e.target.value === '' ? undefined : Number(e.target.value) }))} />
          </div>
        )
      case 'availability':
        return (
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm">Show only available</div>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="form-checkbox" checked={filters.availability ?? false} onChange={(e) => setFilters(f => ({ ...f, availability: e.target.checked }))} />
            </label>
          </div>
        )
      case 'trend':
        return (
          <div className="p-4">
            <select className="form-select w-full" value={filters.trend || ""} onChange={(e) => setFilters(f => ({ ...f, trend: e.target.value as any }))}>
              <option value="">Select trend</option>
              <option value="increasing">Increasing</option>
              <option value="stable">Stable</option>
              <option value="decreasing">Decreasing</option>
            </select>
          </div>
        )
      case 'backlinkNature':
        return (
          <div className="p-4">
            <select className="form-select w-full" value={filters.backlinkNature || ""} onChange={(e) => setFilters(f => ({ ...f, backlinkNature: e.target.value as BacklinkNature }))}>
              <option value="">Select backlink nature</option>
              <option value="do-follow">Do-Follow</option>
              <option value="no-follow">No-Follow</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </div>
        )
      case 'linkPlacement':
        return (
          <div className="p-4">
            <select className="form-select w-full" value={filters.linkPlacement || ""} onChange={(e) => setFilters(f => ({ ...f, linkPlacement: e.target.value as LinkPlacement }))}>
              <option value="">Select link placement</option>
              <option value="in-content">In-content</option>
              <option value="author-bio">Author Bio</option>
              <option value="footer">Footer</option>
            </select>
          </div>
        )
      case 'permanence':
        return (
          <div className="p-4">
            <select className="form-select w-full" value={filters.permanence || ""} onChange={(e) => setFilters(f => ({ ...f, permanence: e.target.value as any }))}>
              <option value="">Select permanence</option>
              <option value="lifetime">Lifetime</option>
              <option value="12-months">12 months</option>
            </select>
          </div>
        )
      case 'tool':
        return (
          <div className="p-4">
            <select className="form-select w-full" value={filters.tool || ""} onChange={(e) => setFilters(f => ({ ...f, tool: e.target.value as any }))}>
              <option value="">Select SEO tool</option>
              <option value="Semrush">Semrush</option>
              <option value="Ahrefs">Ahrefs</option>
            </select>
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 3H2l8 9v7l4 2v-9l8-9Z" />
          </svg>
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Apply saved view */}
          <select className="form-select h-9 text-sm w-56 cursor-pointer" value={applyingViewId} onChange={(e) => applyViewById(e.target.value)} disabled={loading}>
            <option value="">{views.length ? 'Apply saved view' : 'No saved views'}</option>
            {views.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}
          </select>
          {/* Save as view */}
          <input className="form-input h-9 text-sm w-56" placeholder="Save as view..." value={viewName} onChange={(e) => setViewName(e.target.value)} disabled={loading} />
          <button className="btn h-9 text-sm transition-transform active:scale-95 cursor-pointer" onClick={saveCurrentView} disabled={loading || !viewName.trim()}>Save</button>
          <button className="btn border-gray-200 dark:border-gray-700/60 h-9 text-sm transition-transform active:scale-95 cursor-pointer" onClick={() => setFilters(filters)} disabled={loading}>Refresh</button>
          <button className="btn h-9 text-sm transition-transform active:scale-95 cursor-pointer" onClick={() => setFilters(defaultFilters)} disabled={loading}>Reset All</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {pebble('Niche', 'niche')}
        {pebble('Language', 'language')}
        {pebble('Country', 'country')}
        {pebble('Price', 'priceMin')}
        {pebble('DA', 'daMin')}
        {pebble('PA', 'paMin')}
        {pebble('DR', 'drMin')}
        {pebble('Spam', 'spamMax')}
        {pebble('SEO Tool', 'tool')}
        {pebble('Traffic', 'semrushOverallTrafficMin')}
        {pebble('Organic', 'semrushOrganicTrafficMin')}
        {pebble('TAT', 'tatDaysMax')}
        {pebble('Trend', 'trend')}
        {pebble('Backlink Nature', 'backlinkNature')}
        {pebble('Link Placement', 'linkPlacement')}
        {pebble('Permanence', 'permanence')}
        {pebble('Availability', 'availability')}
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeChips.map(chip => (
            <button key={chip.key as string} onClick={() => open(chip.key)} className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs bg-yellow-400 text-gray-900 border border-yellow-400">
              <span>{chip.label}</span>
              <span onClick={(e) => { e.stopPropagation(); clearKey(chip.key) }} aria-label="Remove" className="opacity-70 hover:opacity-100">✕</span>
            </button>
          ))}
        </div>
      )}

      <ModalBasic title={activeKey ? `Filter: ${String(activeKey)}` : 'Filter'} isOpen={modalOpen} setIsOpen={setModalOpen}>
        {renderModalBody()}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700/60 flex justify-end gap-2">
          <button className="btn border-gray-200 dark:border-gray-700/60" onClick={() => setModalOpen(false)} disabled={loading}>Cancel</button>
          <button className="btn bg-amber-400 hover:bg-amber-300 text-gray-900" onClick={() => setModalOpen(false)} disabled={loading}>Apply</button>
        </div>
      </ModalBasic>
    </div>
  )
}

function ResultsTable({ sites, loading }: { sites: Site[]; loading: boolean }) {
  const { addItem, isItemInCart } = useCart()
  const [rowLevel, setRowLevel] = useState<1 | 2 | 3 | 4>(2)
  const rowPaddingByLevel: Record<1|2|3|4, string> = { 1: 'py-1', 2: 'py-2', 3: 'py-3', 4: 'py-4' }
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

  if (loading) return <div className="p-6">Loading…</div>
  return (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="text-sm text-gray-500 dark:text-gray-400"></div>
        <div className="flex items-center gap-2">
          <Popover open={rowsOpen} onOpenChange={setRowsOpen}>
          <PopoverTrigger asChild>
            <button className="btn border-gray-200 dark:border-gray-700/60 h-7 text-xs inline-flex items-center gap-2 transition-transform active:scale-95">
              <span>Rows: {rowLevel === 1 ? 'Short' : rowLevel === 2 ? 'Medium' : rowLevel === 3 ? 'Tall' : 'Extra Tall'}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${rowsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clipRule="evenodd" />
              </svg>
            </button>
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
            <button
              className="btn border-gray-200 dark:border-gray-700/60 h-7 text-xs inline-flex items-center gap-2 transition-transform active:scale-95"
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
            </button>
            {columnsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-lg z-10">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <button className="text-[11px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={showAllColumns}>Show all</button>
                  <button className="text-[11px] text-gray-600 dark:text-gray-300 hover:underline transition-transform active:scale-95" onClick={hideAllColumns}>Hide all</button>
                </div>
                <div className="max-h-64 overflow-auto py-1">
                  {columnDefs.map(col => (
                    <label key={col.key} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
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
              <table className="table-auto w-full dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700/60">
                <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/60">
                  <tr>
                    {columnDefs.map(col => (
                      visibleColumns.includes(col.key) ? (
                        <th key={col.key} className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left">{col.label}</th>
                      ) : null
                    ))}
                  </tr>
                </thead>
                <tbody>
            {sites.length === 0 ? (
              <tr><td className="px-5 py-6" colSpan={visibleColumns.length || 1}>No results</td></tr>
            ) : sites.map(s => (
              <tr key={s.id} className={`border-b border-gray-100 dark:border-gray-700/60 ${rowPaddingByLevel[rowLevel]} cursor-pointer`} onClick={() => { setSelectedSite(s); setDetailsOpen(true) }}>
                {visibleColumns.includes('website') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="font-medium"><a href={s.url} target="_blank" rel="noreferrer" className="text-amber-500 hover:text-amber-400 underline" onClick={(e) => e.stopPropagation()}>{s.name}</a></div>
                  {rowLevel >= 2 && (
                    <div className="text-xs text-gray-500">{s.url.replace(/^https?:\/\//, "")}</div>
                  )}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Category:</span> {s.category}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Language:</span> {s.language}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('niche') && (
                <td className={`px-2 first:pl-5 last:pr-5 ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="flex flex-wrap gap-1 max-w-[320px]">
                    {s.niche
                      .split(',')
                      .map(n => n.trim())
                      .filter(Boolean)
                      .map((n, idx) => (
                        <span key={`${n}-${idx}`} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-400/15 text-amber-700 border border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20">{n}</span>
                      ))}
                  </div>
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Type:</span> {s.category}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Country:</span> {s.country}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('countryLang') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <div className="text-sm">{s.country} • <span className="text-xs">{s.language}</span></div>
                </td>
                )}
                {visibleColumns.includes('authority') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.da}/{s.pa}/{s.dr}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">DA:</span> {s.da}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">PA:</span> {s.pa} <span className="text-gray-400">| DR:</span> {s.dr}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('spam') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.spamScore}%
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Score:</span> {s.spamScore}/10</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Risk:</span> {s.spamScore <= 3 ? 'Low' : s.spamScore <= 6 ? 'Medium' : 'High'}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('price') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {"$"}{s.publishing.price.toLocaleString()}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Base:</span> ${s.publishing.price}</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">With Content:</span> ${s.publishing.priceWithContent}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('traffic') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {(s.toolScores.semrushOverallTraffic/1000000).toFixed(1)}M
                  {rowLevel >= 2 && (
                    <div className="text-xs text-gray-500">overall</div>
                  )}
                  {rowLevel >= 3 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Organic:</span> {(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M</div>
                  )}
                  {rowLevel >= 4 && (
                    <div className="text-xs text-gray-500 mt-1"><span className="text-gray-400">Authority:</span> {s.toolScores.semrushAuthority}</div>
                  )}
                </td>
                )}
                {visibleColumns.includes('organicTraffic') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {(s.toolScores.semrushOrganicTraffic/1000000).toFixed(1)}M
                </td>
                )}
                {visibleColumns.includes('authorityScore') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.toolScores.semrushAuthority}
                </td>
                )}
                {visibleColumns.includes('availability') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.additional.availability ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.additional.availability ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                )}
                {visibleColumns.includes('sampleUrl') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.quality?.sampleUrl ? (
                    <a className="text-amber-500 hover:text-amber-400 underline" href={s.quality.sampleUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>View</a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                )}
                {visibleColumns.includes('lastPublished') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.quality?.lastPublished || 'Unknown'}
                </td>
                )}
                {visibleColumns.includes('outboundLimit') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.quality?.outboundLinkLimit ?? '-'}
                </td>
                )}
                {visibleColumns.includes('backlinkNature') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.backlinkNature}
                </td>
                )}
                {visibleColumns.includes('backlinksAllowed') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.backlinksAllowed}
                </td>
                )}
                {visibleColumns.includes('wordLimit') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.wordLimit ?? '-'}
                </td>
                )}
                {visibleColumns.includes('tatDays') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.tatDays}
                </td>
                )}
                {visibleColumns.includes('linkPlacement') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.linkPlacement ?? '-'}
                </td>
                )}
                {visibleColumns.includes('permanence') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  {s.publishing.permanence ?? '-'}
                </td>
                )}
                {visibleColumns.includes('cart') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <button className={`btn h-8 px-3 text-xs transition-transform active:scale-95 ${isItemInCart(s.id) ? 'bg-amber-400 text-black' : 'border border-amber-300 text-amber-700'}`} onClick={(e) => { e.stopPropagation(); addItem(s) }}>
                    {isItemInCart(s.id) ? 'In Cart' : 'Add to Cart'}
                  </button>
                </td>
                )}
                {visibleColumns.includes('order') && (
                <td className={`px-2 first:pl-5 last:pr-5 whitespace-nowrap ${rowPaddingByLevel[rowLevel]}`}>
                  <a
                    className="btn h-8 px-3 text-xs transition-transform active:scale-95"
                    onClick={(e) => e.stopPropagation()}
                    href={`/checkout?siteId=${encodeURIComponent(s.id)}&siteName=${encodeURIComponent(s.name)}&priceCents=${encodeURIComponent(String(Math.round((s.publishing.price || 0) * 100)))}`}
                  >
                    Order This Site
                  </a>
                </td>
                )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                        <div className="font-medium"><a href={selectedSite.url} className="text-amber-500 underline" target="_blank" rel="noreferrer">{selectedSite.url}</a></div>
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
                        <div className="font-medium">{selectedSite.quality?.sampleUrl ? <a className="text-amber-500 underline" href={selectedSite.quality.sampleUrl} target="_blank" rel="noreferrer">View</a> : '-'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
  )
}

export default function PublishersClient() {
  function HeaderCheckout() {
    const { getTotalItems } = useCart()
    const count = getTotalItems()
    if (count <= 0) return null
    return (
      <a className="btn h-9 text-sm bg-amber-400 text-black hover:bg-amber-300 transition-transform active:scale-95 cursor-pointer" href="/checkout">
        Checkout ({count})
      </a>
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
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Publishers</h1>
          <div className="flex items-center gap-2">
            <input className="form-input h-9 text-sm w-60" placeholder="Search by website or URL" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button className="btn border-gray-200 dark:border-gray-700/60 h-9 text-sm transition-transform active:scale-95 cursor-pointer" onClick={() => { if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current); fetchData(convertFiltersToAPI(filters, searchQuery)) }} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
            <button className="btn h-9 text-sm transition-transform active:scale-95 cursor-pointer" onClick={() => setFilters(defaultFilters)}>Reset</button>
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




