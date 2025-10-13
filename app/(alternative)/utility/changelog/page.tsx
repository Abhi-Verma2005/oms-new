"use client"

import { useEffect, useState } from 'react'
import PaginationClassic from '@/components/pagination-classic'

type Entry = { id: string; title: string; body: string; category: string; publishedAt: string }

export default function Roadmap() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/changelog${category ? `?category=${encodeURIComponent(category)}` : ''}`, { cache: 'no-store' })
        const data = await res.json()
        if (!isMounted) return
        setEntries(data)
      } catch (e) {
        if (!isMounted) return
        setEntries([])
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [category])
  return (
    <div className="relative bg-white dark:bg-gray-900 h-full">

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center px-4 sm:px-6 py-8 border-b border-gray-200 dark:border-gray-700/60">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Changelog</h1>
        </div>


      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="max-w-3xl m-auto">

          {/* Filters */}
          <div className="xl:pl-32 xl:-translate-x-16 mb-2">
            <ul className="flex flex-wrap -m-1">
              <li className="m-1">
                <button onClick={() => setCategory('')} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm ${!category ? 'border-transparent bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'} transition`}>View All</button>
              </li>
              {['Announcement','Bug Fix','Product','Exciting News'].map((c) => (
                <li key={c} className="m-1">
                  <button onClick={() => setCategory(c)} className={`inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border shadow-sm ${category===c ? 'border-transparent bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800' : 'border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'} transition`}>{c}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Posts */}
          <div className="xl:-translate-x-16">
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="pt-6">
                    <div className="xl:flex">
                      <div className="w-32 shrink-0">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      <div className="grow pb-6 border-b border-gray-200 dark:border-gray-700/60">
                        <div className="h-7 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                        <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-4" />
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-4 w-11/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="h-4 w-10/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && entries.map((e) => (
              <article key={e.id} className="pt-6">
                <div className="xl:flex">
                  <div className="w-32 shrink-0">
                    <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 xl:leading-8">{new Date(e.publishedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="grow pb-6 border-b border-gray-200 dark:border-gray-700/60">
                    <header>
                      <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-3">{e.title}</h2>
                      <div className="flex flex-nowrap items-center space-x-2 mb-4">
                        <div className="text-xs inline-flex font-medium rounded-full text-center px-2.5 py-1 bg-gray-200/50 dark:bg-gray-700/60">{e.category}</div>
                      </div>
                    </header>
                    <div className="space-y-3 whitespace-pre-line">
                      <p>{e.body}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!loading && !entries.length && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No entries yet.</div>
            )}
          </div>

          {/* Pagination */}
          <div className="xl:pl-32 xl:-translate-x-16 mt-6">
            <PaginationClassic />
          </div>

        </div>
      </div>
    </div>
  )
}