export const metadata = {
  title: 'Shop 2 - Mosaic',
  description: 'Page description',
}

import ShopSidebar from '../shop-sidebar'
import ShopCards07 from '../shop-cards-07'
import Link from 'next/link'
import AddToCartProductButton from '@/components/ecommerce/add-to-cart-product-button'
import { Suspense } from 'react'

async function ProductsGrid() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const res = await fetch(`${baseUrl}/api/products?shop2=1&limit=40`, { cache: 'no-store' })
  const { products } = await res.json()
  return (
    <>
      {products.map((p: any) => (
        <div key={p.id} className="col-span-12 sm:col-span-6 xl:col-span-4">
          <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-4 flex flex-col">
            <div className="text-xs text-gray-500 mb-1">{p.badge || 'Package'}</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{p.header}</h3>
            {p.subheader && <div className="text-sm text-gray-500 dark:text-gray-400">{p.subheader}</div>}
            <div className="mt-3 space-y-2">
              {p.features.slice(0,6).map((f: any) => (
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
        <ShopSidebar />

        {/* Content */}
        <div>

          {/* Filters */}
          <div className="mb-5">
            <ul className="flex flex-wrap -m-1">
              <li className="m-1">
                <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800 transition">View All</button>
              </li>
              <li className="m-1">
                <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Featured</button>
              </li>
              <li className="m-1">
                <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Newest</button>
              </li>
              <li className="m-1">
                <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Price - Low To High</button>
              </li>
              <li className="m-1">
                <button className="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Price - High to Low</button>
              </li>
            </ul>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">Packages</div>

          {/* Cards 1 (Video Courses) */}
          <div>
            <div className="grid grid-cols-12 gap-6">
              <Suspense fallback={<div className="col-span-12 text-sm text-gray-500">Loading…</div>}>
                <ProductsGrid />
              </Suspense>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <PaginationClassic />
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
        <AddToCartProductButton id={p.id} name={p.header} priceDollars={priceDollars} />
        <Link href={`/ecommerce/product/${p.slug}`} className="btn bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">View</Link>
      </div>
    </div>
  )
}