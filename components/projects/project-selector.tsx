"use client"

import { useEffect, useState, useCallback } from 'react'
import { useProjectStore, type UserProject } from '@/stores/project-store'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ProjectSelector({ className }: { className?: string }) {
  const { selectedProjectId, selectedProject, setSelectedProject, clearProject } = useProjectStore()
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/projects')
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load projects')
        const data = await r.json()
        return data?.data ?? []
      })
      .then((list) => {
        if (cancelled) return
        setProjects(list)
        if (selectedProjectId && !list.find((p: any) => p.id === selectedProjectId)) {
          clearProject()
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load projects')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedProjectId, clearProject])

  useEffect(() => {
    const cancel = fetchProjects()
    const handler = () => {
      fetchProjects()
    }
    window.addEventListener('project:created', handler)
    return () => {
      cancel?.()
      window.removeEventListener('project:created', handler)
    }
  }, [fetchProjects])

  const onChange = (id: string) => {
    if (!id || id === 'none') {
      setSelectedProject(null as any)
      return
    }
    const proj = projects.find((p) => p.id === id) || null
    setSelectedProject(proj as any)
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <label className="text-sm text-gray-600 dark:text-gray-300">Project</label>
      <div className="min-w-[220px]">
        <Select
          value={selectedProjectId ?? 'none'}
          onValueChange={(v) => onChange(v)}
          disabled={loading || !!error}
       >
          <SelectTrigger className="h-9 px-3">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name || p.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Removed extra selected project label to keep UI clean */}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  )
}


