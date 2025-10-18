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


