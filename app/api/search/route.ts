import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchItems, searchData } from '@/lib/search-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user session for role-based filtering
    const session = await auth()
    const userRoles = (session?.user as any)?.roles || []
    const isAdmin = (session?.user as any)?.isAdmin || false

    if (!query) {
      return NextResponse.json({ 
        results: [],
        total: 0,
        categories: Object.keys(searchData.reduce((acc, item) => {
          // Filter categories based on user access
          if (item.isAdminOnly && !isAdmin) return acc
          if (item.requiredRoles && !item.requiredRoles.some(role => userRoles.includes(role))) return acc
          
          acc[item.category] = (acc[item.category] || 0) + 1
          return acc
        }, {} as Record<string, number>))
      })
    }

    let results = searchItems(query, userRoles, isAdmin)

    // Filter by category if specified
    if (category) {
      results = results.filter(item => item.category === category)
    }

    // Limit results
    results = results.slice(0, limit)

    // Group results by category
    const groupedResults = results.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof results>)

    // Get category counts
    const categoryCounts = Object.keys(groupedResults).reduce((acc, cat) => {
      acc[cat] = groupedResults[cat].length
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      results: groupedResults,
      total: results.length,
      categories: categoryCounts,
      query
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, filters = {} } = body

    // Get user session for role-based filtering
    const session = await auth()
    const userRoles = (session?.user as any)?.roles || []
    const isAdmin = (session?.user as any)?.isAdmin || false

    if (!query) {
      return NextResponse.json({ 
        results: [],
        total: 0 
      })
    }

    let results = searchItems(query, userRoles, isAdmin)

    // Apply filters
    if (filters.category) {
      results = results.filter(item => item.category === filters.category)
    }

    if (filters.isActive !== undefined) {
      results = results.filter(item => item.isActive === filters.isActive)
    }

    // Sort by relevance (exact matches first, then partial matches)
    results = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(query.toLowerCase())
      const bExact = b.title.toLowerCase().startsWith(query.toLowerCase())
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return 0
    })

    return NextResponse.json({
      results,
      total: results.length,
      query,
      filters
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}
