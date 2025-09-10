"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function FeedbackPanel() {
  const [rating, setRating] = useState<number>(3)
  const [comment, setComment] = useState('')
  const [category, setCategory] = useState('General')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, comment, category }) })
      if (!res.ok) throw new Error('Failed to submit feedback')
      setComment('')
      toast.success('Thanks for your feedback!')
    } catch (e) {
      toast.error('Could not submit feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grow">

      {/* Panel body */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-4">Give Feedback</h2>
          <div className="text-sm">Our product depends on customer feedback to improve the overall experience!</div>
        </div>

        {/* Rate */}
        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-6">How likely would you recommend us to a friend or colleague?</h3>
          <div className="w-full max-w-xl">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200 dark:bg-gray-700/60" aria-hidden="true"></div>
              <ul className="relative flex justify-between w-full">
                {[1,2,3,4,5].map(n => (
                  <li key={n} className="flex">
                    <button onClick={() => setRating(n)} className={`w-3 h-3 rounded-full border-2 ${rating===n ? 'bg-violet-500 border-violet-500' : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'}`}>
                      <span className="sr-only">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full flex justify-between text-sm text-gray-500 dark:text-gray-400 italic mt-3">
              <div>Not at all</div>
              <div>Extremely likely</div>
            </div>
          </div>
        </section>

        {/* Tell us in words */}
        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-5">Tell us in words</h3>
          {/* Form */}
          <label className="sr-only" htmlFor="feedback">Leave a feedback</label>
          <Textarea id="feedback" className="w-full" rows={4} placeholder="I really enjoy…" value={comment} onChange={(e: any) => setComment(e.target.value)} />
          <div className="mt-3">
            <label className="text-sm mr-2">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {['General','Bug','Feature Request','UX','Performance'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </section>
      </div>

      {/* Panel footer */}
      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300">Cancel</button>
            <Button onClick={submit} disabled={saving} className="ml-3">{saving ? 'Submitting…' : 'Submit Feedback'}</Button>
          </div>
        </div>
      </footer>

    </div>
  )
}