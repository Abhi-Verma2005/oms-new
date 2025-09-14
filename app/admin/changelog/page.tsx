'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

type Entry = {
  id: string
  title: string
  body: string
  category: string
  isPublished: boolean
  publishedAt: string
}

function ChangelogContent() {
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
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">Manage Changelog</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category:</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Announcement">Announcement</SelectItem>
                <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Exciting News">Exciting News</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
              <Input 
                placeholder="Enter changelog title" 
                value={form.title || ''} 
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} 
                className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
              <Select value={form.category || 'Announcement'} onValueChange={(value) => setForm(f => ({ ...f, category: value }))}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Announcement">Announcement</SelectItem>
                  <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Exciting News">Exciting News</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Body (markdown/plain)</label>
            <textarea 
              className="w-full border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 h-32" 
              placeholder="Enter changelog content..." 
              value={form.body || ''} 
              onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input 
                type="checkbox" 
                className="mr-2 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500" 
                checked={!!form.isPublished} 
                onChange={(e) => setForm(f => ({ ...f, isPublished: e.target.checked }))} 
              />
              Published
            </label>
            <Button 
              onClick={save} 
              disabled={saving} 
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? 'Saving...' : 'Add Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <CardTitle className="flex items-center font-semibold text-gray-800 dark:text-gray-100">Changelog Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            {entries.map((e) => (
              <div key={e.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
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
            {!entries.length && <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No entries.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminChangelog() {
  return (
    <AdminLayout>
      <ChangelogContent />
    </AdminLayout>
  )
}


