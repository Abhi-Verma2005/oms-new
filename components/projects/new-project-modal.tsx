"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function NewProjectModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: () => void }) {
  const [domain, setDomain] = useState("")
  const [description, setDescription] = useState("")
  const [defaultUrl, setDefaultUrl] = useState("")
  const [defaultAnchor, setDefaultAnchor] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setError(null)
    if (!domain) {
      setError("Domain is required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, description, defaultUrl, defaultAnchor })
      })
      if (!res.ok) throw new Error("Failed to create project")
      const { data } = await res.json()
      onOpenChange(false)
      setDomain("")
      setDescription("")
      setDefaultUrl("")
      setDefaultAnchor("")
      try {
        window.dispatchEvent(new Event('project:created'))
      } catch {}
      onCreated?.()
      // Optionally auto-select the newly created project
      try {
        if (data?.id) {
          const { useProjectStore } = await import('@/stores/project-store')
          useProjectStore.getState().setSelectedProject({ id: data.id, name: data.name, domain: data.domain })
        }
      } catch {}
    } catch (e: any) {
      setError(e.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-gray-100 dark:border-gray-800/60">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create project</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain *</label>
            <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500" placeholder="myproject.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500" placeholder="Short description of the project" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Target URL</label>
            <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500" placeholder="https://example.com" value={defaultUrl} onChange={(e) => setDefaultUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Anchor Text</label>
            <input className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500" placeholder="Words that win the click" value={defaultAnchor} onChange={(e) => setDefaultAnchor(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <button onClick={handleCreate} disabled={loading} className="w-full h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


