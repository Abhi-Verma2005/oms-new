import { NextResponse } from 'next/server'
import { fetchSitesWithFilters, transformAPISiteToSite } from '@/lib/sample-sites'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('query') || '').trim()
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 8)
  const offset = (page - 1) * limit

  const filters: any = { 
    limit: limit,
    offset: offset,
    page: page
  }
  if (query) { filters.niche = query; filters.website = query }
  const niche = searchParams.get('niche')
  const language = searchParams.get('language')
  const country = searchParams.get('country')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const daMin = searchParams.get('daMin')
  const daMax = searchParams.get('daMax')
  const drMin = searchParams.get('drMin')
  const drMax = searchParams.get('drMax')
  const spamMax = searchParams.get('spamMax')
  const availability = searchParams.get('availability')

  if (niche) filters.niche = niche
  if (language) filters.language = language
  if (country) filters.webCountry = country
  if (priceMin || priceMax) filters.costPrice = {
    ...(priceMin ? { min: Number(priceMin) } : {}),
    ...(priceMax ? { max: Number(priceMax) } : {}),
  }
  if (daMin || daMax) filters.domainAuthority = {
    ...(daMin ? { min: Number(daMin) } : {}),
    ...(daMax ? { max: Number(daMax) } : {}),
  }
  if (drMin || drMax) filters.domainRating = {
    ...(drMin ? { min: Number(drMin) } : {}),
    ...(drMax ? { max: Number(drMax) } : {}),
  }
  if (spamMax) filters.spamScore = { max: Number(spamMax) }
  if (availability === 'true') filters.availability = true

  const result = await fetchSitesWithFilters(filters)
  const items = result.sites.map(transformAPISiteToSite).map(s => ({
    id: s.id,
    website: s.name,
    niche: s.niche,
    country: s.country,
    language: s.language,
    price: s.publishing.priceWithContent || s.publishing.price,
  }))

  return NextResponse.json({ 
    items,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filters: stateFilters, searchQuery, projectId } = body
    
    // Convert state filters to API filters
    const apiFilters: any = {
      limit: 1000, // Fetch all for client-side pagination
      offset: 0,
      page: 1
    }
    
    if (stateFilters) {
      if (stateFilters.daMin !== undefined) apiFilters.domainAuthority = { ...(apiFilters.domainAuthority || {}), min: stateFilters.daMin }
      if (stateFilters.daMax !== undefined) apiFilters.domainAuthority = { ...(apiFilters.domainAuthority || {}), max: stateFilters.daMax }
      if (stateFilters.paMin !== undefined) apiFilters.pageAuthority = { ...(apiFilters.pageAuthority || {}), min: stateFilters.paMin }
      if (stateFilters.paMax !== undefined) apiFilters.pageAuthority = { ...(apiFilters.pageAuthority || {}), max: stateFilters.paMax }
      if (stateFilters.drMin !== undefined) apiFilters.domainRating = { ...(apiFilters.domainRating || {}), min: stateFilters.drMin }
      if (stateFilters.drMax !== undefined) apiFilters.domainRating = { ...(apiFilters.domainRating || {}), max: stateFilters.drMax }
      if (stateFilters.spamMin !== undefined) apiFilters.spamScore = { ...(apiFilters.spamScore || {}), min: stateFilters.spamMin }
      if (stateFilters.spamMax !== undefined) apiFilters.spamScore = { ...(apiFilters.spamScore || {}), max: stateFilters.spamMax }
      if (stateFilters.priceMin !== undefined) apiFilters.sellingPrice = { ...(apiFilters.sellingPrice || {}), min: stateFilters.priceMin }
      if (stateFilters.priceMax !== undefined) apiFilters.sellingPrice = { ...(apiFilters.sellingPrice || {}), max: stateFilters.priceMax }
      if (stateFilters.semrushOverallTrafficMin !== undefined) apiFilters.semrushTraffic = { ...(apiFilters.semrushTraffic || {}), min: stateFilters.semrushOverallTrafficMin }
      if (stateFilters.semrushOrganicTrafficMin !== undefined) apiFilters.semrushOrganicTraffic = { ...(apiFilters.semrushOrganicTraffic || {}), min: stateFilters.semrushOrganicTrafficMin }
      if (stateFilters.niche) apiFilters.niche = stateFilters.niche
      if (stateFilters.language) apiFilters.language = stateFilters.language
      if (stateFilters.country) apiFilters.webCountry = stateFilters.country
      if (stateFilters.backlinkNature) apiFilters.linkAttribute = stateFilters.backlinkNature
      if (typeof stateFilters.availability === 'boolean') apiFilters.availability = stateFilters.availability
      if (stateFilters.remarkIncludes) apiFilters.websiteRemark = stateFilters.remarkIncludes
    }
    
    if (searchQuery && searchQuery.trim()) {
      apiFilters.website = searchQuery.trim()
    }
    
    const result = await fetchSitesWithFilters(apiFilters)
    const items = result.sites.map(transformAPISiteToSite)
    
    return NextResponse.json({
      sites: items,
      pagination: {
        page: 1,
        limit: 1000,
        total: result.total,
        totalPages: Math.ceil(result.total / 1000)
      }
    })
  } catch (error) {
    console.error('POST /api/publishers error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


