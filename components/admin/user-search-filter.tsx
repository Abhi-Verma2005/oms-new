"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

type UserSuggestion = { id: string; name: string | null; email: string | null }

export default function UserSearchFilter() {
  const router = useRouter()
  const sp = useSearchParams()
  const [query, setQuery] = React.useState<string>(sp.get('userName') || '')
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<UserSuggestion[]>([])
  const abortRef = React.useRef<AbortController | null>(null)
  const boxRef = React.useRef<HTMLDivElement | null>(null)

  const runSearch = React.useCallback(async (q: string) => {
    const t = q.trim()
    if (!t) {
      setResults([])
      return
    }
    try {
      setLoading(true)
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`/api/admin/users?query=${encodeURIComponent(t)}&limit=8`, { signal: controller.signal, cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const users: UserSuggestion[] = (data?.users || data || []).map((u: any) => ({ id: String(u.id), name: u.name ?? null, email: u.email ?? null }))
      setResults(users)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const tid = setTimeout(() => runSearch(query), 300)
    return () => clearTimeout(tid)
  }, [query, runSearch])

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = boxRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  const applyUser = (user: UserSuggestion) => {
    const params = new URLSearchParams(sp.toString())
    if (user.id) params.set('userId', user.id)
    if (user.name) params.set('userName', user.name)
    router.push(`/admin/wishlists?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="h-8 text-xs w-64"
        placeholder="Search user by name or email"
      />
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 max-h-72 overflow-auto rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-lg z-50 text-xs">
          {loading ? (
            <div className="px-3 py-2 text-gray-500">Searching…</div>
          ) : results.length ? (
            <ul>
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 truncate"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyUser(u)}
                    title={u.email || ''}
                  >
                    <div className="font-medium truncate">{u.name || u.email || u.id}</div>
                    {u.email && <div className="text-[11px] text-gray-500 truncate">{u.email}</div>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-gray-500">No users</div>
          )}
        </div>
      )}
    </div>
  )
}


