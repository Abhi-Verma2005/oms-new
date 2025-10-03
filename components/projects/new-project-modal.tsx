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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Domain *</label>
            <input className="form-input w-full" placeholder="myproject.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input className="form-input w-full" placeholder="Short description of the project" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Target URL</label>
            <input className="form-input w-full" placeholder="https://example.com" value={defaultUrl} onChange={(e) => setDefaultUrl(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Anchor Text</label>
            <input className="form-input w-full" placeholder="Words that win the click" value={defaultAnchor} onChange={(e) => setDefaultAnchor(e.target.value)} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button onClick={handleCreate} disabled={loading} className="btn w-full bg-gray-900 text-white dark:bg-white dark:text-gray-900">
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


