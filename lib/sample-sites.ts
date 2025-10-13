// Minimal port from OMS/lib/sample-sites.ts for publishers listing

export interface APISite {
  id: number
  website: string
  niche: string
  contentCategories?: string
  siteClassification?: string
  priceCategory: string
  domainAuthority: number
  pageAuthority: number
  linkAttribute: string
  semrushTraffic: string
  // Value used for AS badge in UI; comes from outreach n8n payload
  similarwebTraffic?: number
  semrushOrganicTraffic?: number
  // Top country fields from API (names may be ISO codes like 'us', 'in', etc.)
  semrushFirstCountryName?: string
  semrushFirstCountryTraffic?: number
  semrushSecondCountryName?: string
  semrushSecondCountryTraffic?: number
  semrushThirdCountryName?: string
  semrushThirdCountryTraffic?: number
  semrushFourthCountryName?: string
  semrushFourthCountryTraffic?: number
  semrushFifthCountryName?: string
  semrushFifthCountryTraffic?: number
  ahrefTraffic?: number
  spamScore: number
  domainRating: number
  costPrice: number
  sellingPrice: number
  webCountry: string
  language: string
  numberOfLinks: number | null
  turnAroundTime: string
  disclaimer: string
  updatedAt: string
  sampleURL: string | null
  availability: boolean
}

export type Site = {
  id: string
  url: string
  name: string
  niche: string
  category: string
  language: string
  country: string
  da: number
  pa: number
  dr: number
  spamScore: number
  toolScores: {
    semrushAuthority: number
    semrushOverallTraffic: number
    semrushOrganicTraffic: number
    trafficTrend: "increasing" | "decreasing" | "stable"
    targetCountryTraffic?: { country: string; percent: number }[]
    topCountries?: { country: string; percent: number }[]
  }
  publishing: {
    price: number
    priceWithContent: number
    wordLimit?: number
    tatDays: number
    backlinkNature: "do-follow" | "no-follow" | "sponsored"
    backlinksAllowed: number
    linkPlacement?: "in-content" | "author-bio" | "footer"
    permanence?: "lifetime" | "12-months"
  }
  quality?: {
    sampleUrl?: string
    remark?: string
    lastPublished?: string
    outboundLinkLimit?: number
    guidelinesUrl?: string
  }
  additional: {
    availability: boolean
    disclaimer?: string
  }
}

export interface APIFilters {
  domainAuthority?: { min?: number; max?: number }
  pageAuthority?: { min?: number; max?: number }
  domainRating?: { min?: number; max?: number }
  spamScore?: { min?: number; max?: number }
  costPrice?: { min?: number; max?: number }
  sellingPrice?: { min?: number; max?: number }
  semrushTraffic?: { min?: number; max?: number }
  semrushOrganicTraffic?: { min?: number; max?: number }
  niche?: string
  contentCategories?: string
  priceCategory?: string
  linkAttribute?: string
  availability?: boolean
  websiteStatus?: string
  language?: string
  webCountry?: string
  turnAroundTime?: string
  websiteRemark?: string
  website?: string
  limit?: number
}  

// Convert API filters to query string
function buildFilterQuery(filters: APIFilters): string {
  const conditions: string[] = [];
  
  if (filters.domainAuthority?.min !== undefined) {
    conditions.push(`"domainAuthority" >= ${filters.domainAuthority.min}`);
  }
  if (filters.domainAuthority?.max !== undefined) {
    conditions.push(`"domainAuthority" <= ${filters.domainAuthority.max}`);
  }
  
  if (filters.pageAuthority?.min !== undefined) {
    conditions.push(`"pageAuthority" >= ${filters.pageAuthority.min}`);
  }
  if (filters.pageAuthority?.max !== undefined) {
    conditions.push(`"pageAuthority" <= ${filters.pageAuthority.max}`);
  }
  
  if (filters.domainRating?.min !== undefined) {
    conditions.push(`"domainRating" >= ${filters.domainRating.min}`);
  }
  if (filters.domainRating?.max !== undefined) {
    conditions.push(`"domainRating" <= ${filters.domainRating.max}`);
  }
  
  if (filters.spamScore?.min !== undefined) {
    conditions.push(`"spamScore" >= ${filters.spamScore.min}`);
  }
  if (filters.spamScore?.max !== undefined) {
    conditions.push(`"spamScore" <= ${filters.spamScore.max}`);
  }
  
  if (filters.costPrice?.min !== undefined) {
    conditions.push(`"costPrice" >= ${filters.costPrice.min}`);
  }
  if (filters.costPrice?.max !== undefined) {
    conditions.push(`"costPrice" <= ${filters.costPrice.max}`);
  }
  
  if (filters.sellingPrice?.min !== undefined) {
    conditions.push(`"sellingPrice" >= ${filters.sellingPrice.min}`);
  }
  if (filters.sellingPrice?.max !== undefined) {
    conditions.push(`"sellingPrice" <= ${filters.sellingPrice.max}`);
  }
  
  if (filters.semrushTraffic?.min !== undefined) {
    conditions.push(`"semrushTraffic" >= ${filters.semrushTraffic.min}`);
  }
  if (filters.semrushTraffic?.max !== undefined) {
    conditions.push(`"semrushTraffic" <= ${filters.semrushTraffic.max}`);
  }
  
  if (filters.semrushOrganicTraffic?.min !== undefined) {
    conditions.push(`"semrushOrganicTraffic" >= ${filters.semrushOrganicTraffic.min}`);
  }
  if (filters.semrushOrganicTraffic?.max !== undefined) {
    conditions.push(`"semrushOrganicTraffic" <= ${filters.semrushOrganicTraffic.max}`);
  }
  
  if (filters.availability !== undefined) {
    conditions.push(`"availability" = ${filters.availability}`);
  }
  
  if (filters.niche) {
    // Escape single quotes to prevent SQL injection
    const escapedNiche = filters.niche.replace(/'/g, "''");
    conditions.push(`"niche" = "${escapedNiche}"`);
  }
  
  if (filters.language) {
    // Escape single quotes to prevent SQL injection
    const escapedLanguage = filters.language.replace(/'/g, "''");
    conditions.push(`"language" = "${escapedLanguage}"`);
  }
  
  if (filters.webCountry) {
    // Escape single quotes to prevent SQL injection
    const escapedWebCountry = filters.webCountry.replace(/'/g, "''");
    conditions.push(`"webCountry" = "${escapedWebCountry}"`);
  }
  
  if (filters.contentCategories) {
    // Escape single quotes to prevent SQL injection
    const escapedContentCategories = filters.contentCategories.replace(/'/g, "''");
    conditions.push(`"contentCategories" = "${escapedContentCategories}"`);
  }
  
  if (filters.priceCategory) {
    // Escape single quotes to prevent SQL injection
    const escapedPriceCategory = filters.priceCategory.replace(/'/g, "''");
    conditions.push(`"priceCategory" = "${escapedPriceCategory}"`);
  }
  
  if (filters.linkAttribute) {
    // Escape single quotes to prevent SQL injection
    const escapedLinkAttribute = filters.linkAttribute.replace(/'/g, "''");
    conditions.push(`"linkAttribute" = "${escapedLinkAttribute}"`);
  }
  
  if (filters.websiteStatus) {
    // Escape single quotes to prevent SQL injection
    const escapedWebsiteStatus = filters.websiteStatus.replace(/'/g, "''");
    conditions.push(`"websiteStatus" = "${escapedWebsiteStatus}"`);
  }
  
  if (filters.turnAroundTime) {
    // Escape single quotes to prevent SQL injection
    const escapedTurnAroundTime = filters.turnAroundTime.replace(/'/g, "''");
    conditions.push(`"turnAroundTime" = "${escapedTurnAroundTime}"`);
  }
  
  if (filters.websiteRemark) {
    // Escape single quotes to prevent SQL injection
    const escapedRemark = filters.websiteRemark.replace(/'/g, "''");
    conditions.push(`"websiteRemark" LIKE '%${escapedRemark}%'`);
  }
  
  if (filters.website) {
    // Escape single quotes to prevent SQL injection
    const escapedWebsite = filters.website.replace(/'/g, "''");
    conditions.push(`"website" LIKE '%${escapedWebsite}%'`);
  }
  
  return conditions.join(" AND ");
}

interface APIResponse {
  json: APISite
}

const API_BASE_URL = 'https://agents.outreachdeal.com/webhook/dummy-data'
const CATEGORIES_API_URL = 'https://agents.outreachdeal.com/webhook/fetch-categories'

export interface CategoryRecommendation {
  category: string
  count?: number
  relevance?: number
}

function getFallbackSampleData(filters: APIFilters = {}): APISite[] {
  const sampleData: APISite[] = [
    {
      id: 1,
      website: "techcrunch.com",
      niche: "Technology",
      priceCategory: "Premium",
      domainAuthority: 95,
      pageAuthority: 85,
      linkAttribute: "do-follow",
      semrushTraffic: "4500000",
      spamScore: 1,
      domainRating: 92,
      costPrice: 500,
      sellingPrice: 800,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "5",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://techcrunch.com/sample-article",
      availability: true,
    },
    {
      id: 3,
      website: "healthline.com",
      niche: "Health & Fitness",
      priceCategory: "Premium",
      domainAuthority: 93,
      pageAuthority: 86,
      linkAttribute: "do-follow",
      semrushTraffic: "5200000",
      spamScore: 3,
      domainRating: 90,
      costPrice: 450,
      sellingPrice: 750,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "6",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.healthline.com/sample-article",
      availability: true,
    },
    {
      id: 4,
      website: "verywellfit.com",
      niche: "Health & Fitness, Nutrition",
      priceCategory: "Standard",
      domainAuthority: 88,
      pageAuthority: 80,
      linkAttribute: "do-follow",
      semrushTraffic: "1800000",
      spamScore: 4,
      domainRating: 84,
      costPrice: 220,
      sellingPrice: 380,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "7",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.verywellfit.com/sample-article",
      availability: true,
    },
    {
      id: 5,
      website: "menshealth.com",
      niche: "Health & Fitness, Men's Health",
      priceCategory: "Premium",
      domainAuthority: 89,
      pageAuthority: 83,
      linkAttribute: "do-follow",
      semrushTraffic: "2100000",
      spamScore: 5,
      domainRating: 85,
      costPrice: 380,
      sellingPrice: 620,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "6",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.menshealth.com/sample-article",
      availability: true,
    },
    {
      id: 6,
      website: "womenshealthmag.com",
      niche: "Health & Fitness, Women's Health",
      priceCategory: "Standard",
      domainAuthority: 87,
      pageAuthority: 79,
      linkAttribute: "do-follow",
      semrushTraffic: "1600000",
      spamScore: 4,
      domainRating: 82,
      costPrice: 320,
      sellingPrice: 540,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "7",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.womenshealthmag.com/sample-article",
      availability: true,
    },
    {
      id: 7,
      website: "myfitnesspal.com",
      niche: "Health & Fitness, Nutrition",
      priceCategory: "Standard",
      domainAuthority: 90,
      pageAuthority: 81,
      linkAttribute: "do-follow",
      semrushTraffic: "2400000",
      spamScore: 3,
      domainRating: 86,
      costPrice: 260,
      sellingPrice: 420,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "6",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.myfitnesspal.com/sample-article",
      availability: true,
    },
    {
      id: 8,
      website: "bodybuilding.com",
      niche: "Health & Fitness, Bodybuilding",
      priceCategory: "Standard",
      domainAuthority: 86,
      pageAuthority: 78,
      linkAttribute: "do-follow",
      semrushTraffic: "1400000",
      spamScore: 6,
      domainRating: 80,
      costPrice: 240,
      sellingPrice: 400,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "8",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://www.bodybuilding.com/sample-article",
      availability: true,
    },
    {
      id: 2,
      website: "forbes.com",
      niche: "Business",
      priceCategory: "Premium",
      domainAuthority: 92,
      pageAuthority: 88,
      linkAttribute: "do-follow",
      semrushTraffic: "6200000",
      spamScore: 2,
      domainRating: 89,
      costPrice: 600,
      sellingPrice: 1000,
      webCountry: "United States",
      language: "English",
      numberOfLinks: 2,
      turnAroundTime: "7",
      disclaimer: "",
      updatedAt: new Date().toISOString(),
      sampleURL: "https://forbes.com/sample-article",
      availability: true,
    },
  ]

  // minimal filtering support
  let filtered = sampleData
  if (filters.niche) {
    const q = String(filters.niche).toLowerCase()
    filtered = filtered.filter(s => s.niche.toLowerCase().includes(q))
  }
  if (filters.website) {
    const q = String(filters.website).toLowerCase()
    filtered = filtered.filter(s => s.website.toLowerCase().includes(q))
  }
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit)
  }
  return filtered
}

export async function fetchSitesWithFilters(filters: APIFilters = {}): Promise<APISite[]> {
  try {
    // Build filter query string
    const filterQuery = buildFilterQuery(filters);
    
    // For the first request (no filters), don't send any body
    // Only send body when filters are applied
    let requestBody: string | undefined;
    
    if (filterQuery) {
      // Build request payload with filters string format
      const requestPayload: Record<string, unknown> = {
        filters: filterQuery,
      }
      
      // Add limit if specified
      if (filters.limit) {
        requestPayload.limit = filters.limit;
      }
      
      requestBody = JSON.stringify(requestPayload);
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: requestBody, 
    })

    if (!response.ok) {
      return getFallbackSampleData(filters)
    }
    const responseText = await response.text()
    if (!responseText || responseText.trim() === '') {
      return getFallbackSampleData(filters)
    }
    let data: any
    try {
      data = JSON.parse(responseText)
      console.log("data",data)
    } catch (e) {
      return getFallbackSampleData(filters)
    }

    if (Array.isArray(data)) {
      const arr = data.map((item: APIResponse) => item.json)
      return arr.length > 0 ? arr : getFallbackSampleData(filters)
    }
    if (data && typeof data === 'object') {
      const single = data.json || data
      return single ? [single] : getFallbackSampleData(filters)
    }
    return getFallbackSampleData(filters)
  } catch (error) {
    // Return fallback on any error
    return getFallbackSampleData(filters)
  }
}

export function transformAPISiteToSite(apiSite: APISite): Site {
  // Build top countries array from API shape (first..fifth)
  const pairs: Array<{ country?: string; traffic?: number }> = [
    { country: apiSite.semrushFirstCountryName, traffic: apiSite.semrushFirstCountryTraffic },
    { country: apiSite.semrushSecondCountryName, traffic: apiSite.semrushSecondCountryTraffic },
    { country: apiSite.semrushThirdCountryName, traffic: apiSite.semrushThirdCountryTraffic },
    { country: apiSite.semrushFourthCountryName, traffic: apiSite.semrushFourthCountryTraffic },
    { country: apiSite.semrushFifthCountryName, traffic: apiSite.semrushFifthCountryTraffic },
  ]
  const codeToName: Record<string, string> = {
    us: 'United States', uk: 'United Kingdom', in: 'India', au: 'Australia', ca: 'Canada', pk: 'Pakistan', de: 'Germany', fr: 'France', es: 'Spain', it: 'Italy', nl: 'Netherlands', jp: 'Japan', cn: 'China', sg: 'Singapore', ae: 'United Arab Emirates', mx: 'Mexico', za: 'South Africa', nz: 'New Zealand', ie: 'Ireland', se: 'Sweden'
  }
  const valid = pairs
    .filter(p => !!p.country && typeof p.traffic === 'number' && (p.traffic as number) > 0)
    .map(p => {
      const raw = String(p.country || '').trim()
      const key = raw.toLowerCase()
      const name = codeToName[key] || raw || 'Other'
      return { country: name, traffic: p.traffic as number }
    })
  const totalTrafficForBreakdown = valid.reduce((s, x) => s + x.traffic, 0)
  const topCountries = totalTrafficForBreakdown > 0
    ? valid.map(v => ({ country: v.country, percent: Math.max(0, Math.round((v.traffic / totalTrafficForBreakdown) * 100)) }))
    : []

  return {
    id: apiSite.id.toString(),
    url: `https://${apiSite.website}`,
    name: apiSite.website,
    niche: apiSite.niche || 'Not Specified',
    category: apiSite.priceCategory || 'Not Specified',
    language: (apiSite.language && apiSite.language.trim()) ? apiSite.language : 'Not Specified',
    country: (apiSite.webCountry && apiSite.webCountry.trim()) ? apiSite.webCountry : (topCountries[0]?.country || 'Not Specified'),
    da: apiSite.domainAuthority || 0,
    pa: apiSite.pageAuthority || 0,
    dr: apiSite.domainRating || 0,
    spamScore: apiSite.spamScore || 0,
    toolScores: {
    // Map AS value from incoming similarwebTraffic
    semrushAuthority: apiSite.similarwebTraffic || 0,
      semrushOverallTraffic: parseInt(apiSite.semrushTraffic) || 0,
      semrushOrganicTraffic: apiSite.semrushOrganicTraffic || 0,
      trafficTrend: 'stable',
      topCountries,
    },
    publishing: {
      price: apiSite.sellingPrice || 0,
      priceWithContent: apiSite.sellingPrice + 50 || 0,
      wordLimit: 1000,
      tatDays: parseInt(apiSite.turnAroundTime) || 0,
      backlinkNature: (apiSite.linkAttribute?.toLowerCase() || 'do-follow') as 'do-follow' | 'no-follow' | 'sponsored',
      backlinksAllowed: apiSite.numberOfLinks || 1,
      linkPlacement: 'in-content',
      permanence: 'lifetime',
    },
    quality: {
      sampleUrl: apiSite.sampleURL || '',
      lastPublished: apiSite.updatedAt ? new Date(apiSite.updatedAt).toISOString().split('T')[0] : 'Unknown',
      outboundLinkLimit: apiSite.numberOfLinks ?? undefined,
      guidelinesUrl: '',
    },
    additional: {
      availability: apiSite.availability || false,
      disclaimer: apiSite.disclaimer || '',
    },
  }
}

// Simple local fallback for niche/category recommendations
const LOCAL_CATEGORIES: string[] = [
  'Technology', 'Health & Fitness', 'Finance', 'Travel', 'Food & Cooking', 'Fashion', 'Beauty', 'Home & Garden',
  'Business', 'Marketing', 'Education', 'Entertainment', 'Sports', 'Automotive', 'Real Estate', 'Parenting',
]

function getLocalCategoryRecommendations(query: string): CategoryRecommendation[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return LOCAL_CATEGORIES
    .filter(c => c.toLowerCase().includes(q))
    .slice(0, 10)
    .map(category => ({ category }))
}

export async function fetchCategoryRecommendations(query: string): Promise<CategoryRecommendation[]> {
  if (!query || query.trim().length < 2) return []
  try {
    const res = await fetch(CATEGORIES_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: query.trim(), limit: 10 }),
    })
    if (!res.ok) return getLocalCategoryRecommendations(query)
    const text = await res.text()
    if (!text) return getLocalCategoryRecommendations(query)
    let data: any
    try { data = JSON.parse(text) } catch { return getLocalCategoryRecommendations(query) }
    if (Array.isArray(data)) {
      return data.map((item: any) => ({ category: item.category || item.name || String(item), count: item.count, relevance: item.relevance }))
    }
    if (data && Array.isArray(data.categories)) {
      return data.categories.map((item: any) => ({ category: item.category || item.name || String(item), count: item.count, relevance: item.relevance }))
    }
    if (typeof data === 'string') return [{ category: data }]
    return getLocalCategoryRecommendations(query)
  } catch {
    return getLocalCategoryRecommendations(query)
  }
}


