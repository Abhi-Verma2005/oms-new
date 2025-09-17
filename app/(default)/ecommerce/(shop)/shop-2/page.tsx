"use client"

import ShopSidebar from '../shop-sidebar'
import Link from 'next/link'
import AddToCartProductButton from '@/components/ecommerce/add-to-cart-product-button'
import { useEffect, useMemo, useState } from 'react'

type SortKey = 'default' | 'featured' | 'newest' | 'price-asc' | 'price-desc'
type PriceRange = 'lt20' | '20-40' | '40-80' | 'gt80' | null
type Product = any

function ProductsGrid({ productsProp }: { productsProp: Product[] }) {

  return (
    <>
      {productsProp.map((p: any) => (
        <div key={p.id} className="col-span-12 sm:col-span-6 xl:col-span-4">
          <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 flex flex-col">
            <div className="text-xs text-gray-500 mb-1">{p.badge || 'Package'}</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{p.header}</h3>
            {p.subheader && <div className="text-sm text-gray-500 dark:text-gray-400">{p.subheader}</div>}
            <div className="mt-3 space-y-2">
              {(p.features || []).slice(0,6).map((f: any) => (
                <div key={f.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                  <span className="inline-block mt-1 mr-2 text-emerald-500">✓</span>
                  <span><span className="font-medium">{f.title}</span>{f.value ? `: ${f.value}` : ''}</span>
                </div>
              ))}
            </div>
            <CardActions p={p} />
          </div>
        </div>
      ))}
    </>
  )
}
import PaginationClassic from '@/components/pagination-classic'

export default function Shop2() {
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [priceRange, setPriceRange] = useState<PriceRange>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 12

  const toggleFilter = (key: SortKey) => setSortKey(key)
  const clearFilters = () => { setSortKey('default'); setPriceRange(null); setSelectedTags([]) }

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const res = await fetch(`${origin}/api/products?shop2=1&limit=100`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load')
        const { products } = await res.json()
        if (!isMounted) return
        setProducts(products)
      } catch (e) {
        if (!isMounted) return
        setError('Failed to load products')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    run()
    return () => { isMounted = false }
  }, [])

  const availableTags = useMemo(() => {
    if (!products) return [] as string[]
    const names = new Set<string>()
    for (const p of products) {
      for (const pt of (p.productTags || [])) {
        const n = pt?.tag?.name
        if (n) names.add(n)
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [products])

  const filtered = useMemo(() => {
    if (!products) return [] as Product[]
    let list = [...products]
    if (selectedTags.length > 0) {
      list = list.filter(p => {
        const tags = (p.productTags || []).map((pt: any) => pt.tag?.name)
        return selectedTags.every(t => tags.includes(t))
      })
    }
    if (priceRange) {
      list = list.filter(p => {
        const cents = (p.finalPricePerMonthCents ?? p.pricePerMonthCents ?? 0) as number
        const dollars = cents / 100
        switch (priceRange) {
          case 'lt20': return dollars < 20
          case '20-40': return dollars >= 20 && dollars <= 40
          case '40-80': return dollars > 40 && dollars <= 80
          case 'gt80': return dollars > 80
          default: return true
        }
      })
    }
    switch (sortKey) {
      case 'featured':
        list.sort((a: any, b: any) => {
          const ab = a.badge ? 1 : 0
          const bb = b.badge ? 1 : 0
          if (bb - ab !== 0) return bb - ab
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        })
        break
      case 'newest':
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'price-asc':
        list.sort((a: any, b: any) => ((a.finalPricePerMonthCents ?? a.pricePerMonthCents ?? 0) - (b.finalPricePerMonthCents ?? b.pricePerMonthCents ?? 0)))
        break
      case 'price-desc':
        list.sort((a: any, b: any) => ((b.finalPricePerMonthCents ?? b.pricePerMonthCents ?? 0) - (a.finalPricePerMonthCents ?? a.pricePerMonthCents ?? 0)))
        break
      case 'default':
      default:
        list.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        break
    }
    return list
  }, [products, selectedTags, priceRange, sortKey])

  // Reset to first page when filters change
  useEffect(() => { setPage(1) }, [sortKey, priceRange, selectedTags])

  const total = filtered.length
  const startIdx = (page - 1) * perPage
  const endIdx = Math.min(startIdx + perPage, total)
  const pageItems = filtered.slice(startIdx, endIdx)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="mb-5">

        {/* Title */}
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Find the right product for you</h1>

      </div>

      {/* Page content */}
      <div className="flex flex-col space-y-10 sm:flex-row sm:space-x-6 sm:space-y-0 md:flex-col md:space-x-0 md:space-y-10 xl:flex-row xl:space-x-6 xl:space-y-0 mt-9">

        {/* Sidebar */}
        <ShopSidebar 
          selectedTags={selectedTags}
          onToggleTag={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
          onClearTags={() => setSelectedTags([])}
          priceRange={priceRange}
          onChangePriceRange={setPriceRange}
          availableTags={availableTags}
        />

        {/* Content */}
        <div>

          {/* Filters */}
          <div className="mb-5">
            <ul className="flex flex-wrap -m-1">
              <li className="m-1">
                <button onClick={() => { clearFilters() }} className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800 transition">View All</button>
              </li>
              <li className="m-1">
                <button onClick={() => toggleFilter('featured')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm transition ${sortKey==='featured' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>Featured</button>
              </li>
              <li className="m-1">
                <button onClick={() => toggleFilter('newest')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm transition ${sortKey==='newest' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>Newest</button>
              </li>
              <li className="m-1">
                <button onClick={() => toggleFilter('price-asc')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm transition ${sortKey==='price-asc' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>Price - Low To High</button>
              </li>
              <li className="m-1">
                <button onClick={() => toggleFilter('price-desc')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm transition ${sortKey==='price-desc' ? 'border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>Price - High to Low</button>
              </li>
            </ul>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">Packages</div>

          {/* Cards 1 (Video Courses) */}
          <div>
            <div className="grid grid-cols-12 gap-6">
              {loading && <div className="col-span-12 text-sm text-gray-500">Loading…</div>}
              {error && !loading && <div className="col-span-12 text-sm text-red-500">{error}</div>}
              {products && (
                <ProductsGrid productsProp={pageItems} />
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <PaginationClassic 
              page={page}
              perPage={perPage}
              total={total}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => (endIdx < total ? p + 1 : p))}
            />
          </div>

        </div>

      </div>
    </div>
  )
}

function CardActions({ p }: { p: any }) {
  const priceDollars = (p.finalPricePerMonthCents ?? p.pricePerMonthCents ?? 0) / 100
  return (
    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
      <div className="text-sm text-gray-600 dark:text-gray-300">{p.discountPercent ? `${p.discountPercent}% Off` : ''}</div>
      <div className="flex items-center gap-2">
  <AddToCartProductButton id={p.id} name={p.header} priceDollars={priceDollars} openOnAdd={false} />
        <Link href={`/ecommerce/product/${p.slug}`} className="btn bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">View</Link>
      </div>
    </div>
  )
}