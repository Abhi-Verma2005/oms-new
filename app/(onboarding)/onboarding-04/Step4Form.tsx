'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Step4Form() {
  const router = useRouter()
  const [monthlyBudget, setMonthlyBudget] = useState<string>('')
  const [promotedUrl, setPromotedUrl] = useState<string>('')
  const [competitorUrl, setCompetitorUrl] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding/step4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudget, promotedUrl, competitorUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(data.next || '/onboarding-05')
    } finally {
      setSaving(false)
    }
  }

  async function skip() {
    const res = await fetch('/api/onboarding/skip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toStep: 5 }) })
    const data = await res.json()
    router.push(data.next || '/onboarding-05')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }}>
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="monthly-budget">Monthly budget</label>
          <input id="monthly-budget" className="form-input w-full" placeholder="$" type="text" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="promoted-url">Promoted URL</label>
            <input id="promoted-url" className="form-input w-full" placeholder="http(s)://www." type="url" value={promotedUrl} onChange={(e) => setPromotedUrl(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="competitor-url">Competitor URL</label>
            <input id="competitor-url" className="form-input w-full" placeholder="http(s)://www." type="url" value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button type="button" onClick={skip} className="text-sm underline hover:no-underline">Skip</button>
        <button type="submit" disabled={saving} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-auto">{saving ? 'Saving...' : 'Finish ->'}</button>
      </div>
    </form>
  )
}





