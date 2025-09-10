'use client'

import { useEffect, useState } from 'react'

type Entry = {
  id: string
  title: string
  body: string
  category: string
  isPublished: boolean
  publishedAt: string
}

export default function AdminChangelog() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [form, setForm] = useState<Partial<Entry>>({ title: '', body: '', category: 'Announcement', isPublished: true })
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const qs = filterCategory ? `?category=${encodeURIComponent(filterCategory)}` : ''
    const res = await fetch(`/api/admin/changelog${qs}`, { cache: 'no-store' })
    const data = await res.json()
    setEntries(data)
  }

  useEffect(() => { load() }, [filterCategory])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/admin/changelog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setForm({ title: '', body: '', category: 'Announcement', isPublished: true })
      await load()
    } finally { setSaving(false) }
  }

  async function publishToggle(id: string, isPublished: boolean) {
    await fetch('/api/admin/changelog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isPublished: !isPublished }) })
    await load()
  }

  async function remove(id: string) {
    await fetch(`/api/admin/changelog?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Manage Changelog</h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg p-4 mb-8">
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Filter by category:</label>
          <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All</option>
            {['Announcement','Bug Fix','Product','Exciting News'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <input className="form-input w-full" placeholder="Title" value={form.title || ''} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          <select className="form-select w-full" value={form.category || 'Announcement'} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
            {['Announcement','Bug Fix','Product','Exciting News'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea className="form-input w-full h-32" placeholder="Body (markdown/plain)" value={form.body || ''} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} />
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" checked={!!form.isPublished} onChange={(e) => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
              <span>Published</span>
            </label>
            <button onClick={save} disabled={saving} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">{saving ? 'Saving...' : 'Add Entry'}</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(e.publishedAt).toLocaleString()} · {e.category}</div>
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{e.title}</div>
                <div className="text-sm mt-1 whitespace-pre-line">{e.body}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => publishToggle(e.id, e.isPublished)} className="btn-sm bg-violet-600 text-white hover:bg-violet-500">{e.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button onClick={() => remove(e.id)} className="btn-sm bg-red-600 text-white hover:bg-red-500">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!entries.length && <div className="text-sm text-gray-500 dark:text-gray-400">No entries.</div>}
      </div>
    </div>
  )
}


