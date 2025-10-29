import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Filters {
  // Quality Metrics
  daMin?: number
  daMax?: number
  paMin?: number
  paMax?: number
  drMin?: number
  drMax?: number
  spamMin?: number
  spamMax?: number
  
  // Pricing
  priceMin?: number
  priceMax?: number
  
  // Geographic & Language
  country?: string
  language?: string
  
  // Content & Niche
  niche?: string
  
  // Traffic & Performance
  semrushOverallTrafficMin?: number
  semrushOrganicTrafficMin?: number
  trend?: string
  
  // Backlink Quality
  backlinkNature?: string
  linkPlacement?: string
  permanence?: string
  
  // Publishing Constraints
  backlinksAllowedMin?: number
  outboundLinkLimitMax?: number
  availability?: boolean
  
  // Search & Metadata
  sampleUrl?: string
  remarkIncludes?: string
  guidelinesUrlIncludes?: string
  disclaimerIncludes?: string
  lastPublishedAfter?: string
  
  // Turnaround Time
  tatDaysMin?: number
  tatDaysMax?: number
  
  // SEO Tool
  tool?: string
}

interface FilterState {
  filters: Filters
  searchQuery: string
  selectedProjectId: string | null
  
  // Actions
  setFilters: (filters: Partial<Filters>) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  clearFilter: (key: keyof Filters) => void
  clearKey: (key: keyof Filters) => void
  setProject: (projectId: string | null) => void
  
  // Validation
  validateFilters: (filters: Filters) => Filters
  
  // AI Integration
  updateFromAI: (filters: Partial<Filters>, searchQuery?: string) => void
  getCurrentState: () => { filters: Filters; searchQuery: string }
  
  // URL Sync (removed - store-only approach)
  loadFromURL: (searchParams: URLSearchParams) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filters: {},
      searchQuery: '',
      selectedProjectId: null,
      
      setFilters: (newFilters) => {
        set((state) => ({
          filters: state.validateFilters({ ...state.filters, ...newFilters })
        }))
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },
      
      clearFilters: () => {
        set({ filters: {}, searchQuery: '' })
      },
      
      clearFilter: (key) => {
        set((state) => {
          const newFilters = { ...state.filters }
          delete newFilters[key]
          return { filters: newFilters }
        })
      },
      
      clearKey: (key) => {
        set((state) => {
          const newFilters = { ...state.filters }
          delete newFilters[key]
          return { filters: newFilters }
        })
      },
      
      setProject: (projectId) => {
        set({ selectedProjectId: projectId })
      },
      
      validateFilters: (filters) => {
        const validated = { ...filters }
        
        // Validate numeric ranges
        if (validated.priceMin !== undefined && validated.priceMax !== undefined) {
          if (validated.priceMin > validated.priceMax) {
            validated.priceMin = validated.priceMax
          }
        }
        
        if (validated.daMin !== undefined && validated.daMax !== undefined) {
          if (validated.daMin > validated.daMax) {
            validated.daMin = validated.daMax
          }
        }
        
        if (validated.paMin !== undefined && validated.paMax !== undefined) {
          if (validated.paMin > validated.paMax) {
            validated.paMin = validated.paMax
          }
        }
        
        if (validated.drMin !== undefined && validated.drMax !== undefined) {
          if (validated.drMin > validated.drMax) {
            validated.drMin = validated.drMax
          }
        }
        
        // Clean empty strings
        Object.keys(validated).forEach(key => {
          const value = validated[key as keyof Filters]
          if (typeof value === 'string' && value.trim() === '') {
            delete validated[key as keyof Filters]
          }
        })
        
        return validated
      },
      
      updateFromAI: (newFilters, searchQuery) => {
        console.log('🔄 ZUSTAND: updateFromAI called with:', { newFilters, searchQuery })
        set((state) => {
          const updatedFilters = state.validateFilters({ ...state.filters, ...newFilters })
          console.log('📊 ZUSTAND: Updated filters:', updatedFilters)
          return {
            filters: updatedFilters,
            searchQuery: searchQuery !== undefined ? searchQuery : state.searchQuery
          }
        })
        console.log('✅ ZUSTAND: updateFromAI completed')
      },
      
      getCurrentState: () => {
        const { filters, searchQuery } = get()
        return { filters, searchQuery }
      },
      
      // URL sync removed - store handles state management without URL conflicts
      
      loadFromURL: (searchParams) => {
        const filters: Filters = {}
        
        // Parse URL parameters
        if (searchParams.get('daMin')) filters.daMin = parseInt(searchParams.get('daMin')!)
        if (searchParams.get('daMax')) filters.daMax = parseInt(searchParams.get('daMax')!)
        if (searchParams.get('drMin')) filters.drMin = parseInt(searchParams.get('drMin')!)
        if (searchParams.get('drMax')) filters.drMax = parseInt(searchParams.get('drMax')!)
        if (searchParams.get('spamMin')) filters.spamMin = parseInt(searchParams.get('spamMin')!)
        if (searchParams.get('spamMax')) filters.spamMax = parseInt(searchParams.get('spamMax')!)
        if (searchParams.get('priceMin')) filters.priceMin = parseInt(searchParams.get('priceMin')!)
        if (searchParams.get('priceMax')) filters.priceMax = parseInt(searchParams.get('priceMax')!)
        if (searchParams.get('paMin')) filters.paMin = parseInt(searchParams.get('paMin')!)
        if (searchParams.get('paMax')) filters.paMax = parseInt(searchParams.get('paMax')!)
        if (searchParams.get('niche')) filters.niche = searchParams.get('niche')
        if (searchParams.get('country')) filters.country = searchParams.get('country')
        if (searchParams.get('language')) filters.language = searchParams.get('language')
        if (searchParams.get('trafficMin')) filters.semrushOverallTrafficMin = parseInt(searchParams.get('trafficMin')!)
        if (searchParams.get('backlinkNature')) filters.backlinkNature = searchParams.get('backlinkNature')
        if (searchParams.get('availability') !== null) filters.availability = searchParams.get('availability') === 'true'
        
        const searchQuery = searchParams.get('q') || ''
        
        set({ 
          filters: get().validateFilters(filters), 
          searchQuery 
        })
      }
    }),
    {
      name: 'oms-filter-store',
      partialize: (state) => ({
        filters: state.filters,
        searchQuery: state.searchQuery,
        selectedProjectId: state.selectedProjectId
      })
    }
  )
)
