'use client'

import React, { useState, useEffect } from 'react'

interface Site {
  id: string
  name: string
  url?: string
}

interface MaskedWebsiteProps {
  site: Site
  maxStars?: number
  showRevealButton?: boolean
}

export default function MaskedWebsite({ site, maxStars = 14, showRevealButton = true }: MaskedWebsiteProps) {
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)

  async function onReveal(e: React.MouseEvent) {
    e.stopPropagation()
    if (revealed || loading) return
    try {
      setLoading(true)
      const res = await fetch('/api/publishers/reveal', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: site.id }) 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      const website: string = data.website
      setRevealed(website)
    } catch (err) {
      // optionally show toast
    } finally {
      setLoading(false)
    }
  }

  // Cap masked length to avoid overflow
  const masked = '★'.repeat(maxStars)
  const display = revealed ? revealed : masked
  
  return (
    <div
      className="group relative inline-flex items-center gap-2 max-w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {revealed ? (
        <a
          href={`https://${revealed}`}
          target="_blank"
          rel="noreferrer"
          className="text-violet-600 hover:text-violet-700 underline truncate max-w-[11rem]"
          onClick={(e) => e.stopPropagation()}
          title={revealed}
        >
          {revealed}
        </a>
      ) : (
        <span
          className="text-gray-300 dark:text-gray-200/80 tracking-wide truncate max-w-[11rem] select-none cursor-pointer leading-4 min-h-[18px] sm:leading-5 sm:min-h-[20px]"
          title="Hidden website"
          onClick={onReveal}
          role="button"
          aria-label="Reveal website"
        >
          {display}
        </span>
      )}
      {!revealed && showRevealButton && (
        <button
          onClick={onReveal}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[10px] sm:text-[11px] px-1.5 py-0.5 sm:px-2 sm:py-1 leading-4 sm:leading-5 min-h-[22px] sm:min-h-[28px] rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-300 dark:hover:bg-violet-500/10 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Revealing…' : 'Show website'}
        </button>
      )}
    </div>
  )
}

