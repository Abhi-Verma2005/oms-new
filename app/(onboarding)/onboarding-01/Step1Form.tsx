'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Step1Form() {
  const router = useRouter()
  const [situation, setSituation] = useState<'company' | 'freelancer' | 'getting_started'>('company')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding/step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(data.next || '/onboarding-02')
    } finally {
      setSaving(false)
    }
  }

  async function skip() {
    const res = await fetch('/api/onboarding/skip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toStep: 2 }) })
    const data = await res.json()
    router.push(data.next || '/onboarding-02')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }}>
      <div className="space-y-3 mb-8">
        <label className="relative block cursor-pointer">
          <input type="radio" name="radio-buttons" className="peer sr-only" checked={situation==='company'} onChange={() => setSituation('company')} />
          <div className="flex items-center bg-white text-sm font-medium text-gray-800 dark:text-gray-100 p-4 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
            <svg className="w-6 h-6 shrink-0 fill-current mr-4" viewBox="0 0 24 24">
              <path className="text-violet-500" d="m12 10.856 9-5-8.514-4.73a1 1 0 0 0-.972 0L3 5.856l9 5Z" />
              <path className="text-violet-300" d="m11 12.588-9-5V18a1 1 0 0 0 .514.874L11 23.588v-11Z" />
              <path className="text-violet-200" d="M13 12.588v11l8.486-4.714A1 1 0 0 0 22 18V7.589l-9 4.999Z" />
            </svg>
            <span>I have a company</span>
          </div>
          <div className="absolute inset-0 border-2 border-transparent peer-checked:border-violet-400 dark:peer-checked:border-violet-500 rounded-lg pointer-events-none" aria-hidden="true"></div>
        </label>
        <label className="relative block cursor-pointer">
          <input type="radio" name="radio-buttons" className="peer sr-only" checked={situation==='freelancer'} onChange={() => setSituation('freelancer')} />
          <div className="flex items-center bg-white text-sm font-medium text-gray-800 dark:text-gray-100 p-4 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
            <svg className="w-6 h-6 shrink-0 fill-current mr-4" viewBox="0 0 24 24">
              <path className="text-violet-500" d="m12 10.856 9-5-8.514-4.73a1 1 0 0 0-.972 0L3 5.856l9 5Z" />
              <path className="text-violet-300" d="m11 12.588-9-5V18a1 1 0 0 0 .514.874L11 23.588v-11Z" />
            </svg>
            <span>I’m a freelance / contractor</span>
          </div>
          <div className="absolute inset-0 border-2 border-transparent peer-checked:border-violet-400 dark:peer-checked:border-violet-500 rounded-lg pointer-events-none" aria-hidden="true"></div>
        </label>
        <label className="relative block cursor-pointer">
          <input type="radio" name="radio-buttons" className="peer sr-only" checked={situation==='getting_started'} onChange={() => setSituation('getting_started')} />
          <div className="flex items-center bg-white text-sm font-medium text-gray-800 dark:text-gray-100 p-4 rounded-lg dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition">
            <svg className="w-6 h-6 shrink-0 fill-current mr-4" viewBox="0 0 24 24">
              <path className="text-violet-500" d="m12 10.856 9-5-8.514-4.73a1 1 0 0 0-.972 0L3 5.856l9 5Z" />
            </svg>
            <span>I'm just getting started</span>
          </div>
          <div className="absolute inset-0 border-2 border-transparent peer-checked:border-violet-400 dark:peer-checked:border-violet-500 rounded-lg pointer-events-none" aria-hidden="true"></div>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={skip} className="text-sm underline hover:no-underline">Skip</button>
        <button type="submit" disabled={saving} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-auto">{saving ? 'Saving...' : 'Next Step ->'}</button>
      </div>
    </form>
  )
}



