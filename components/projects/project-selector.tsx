"use client"

import { useEffect, useState, useCallback } from 'react'
import { useProjectStore, type UserProject } from '@/stores/project-store'
import { cn } from '@/lib/utils'

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
    const proj = projects.find((p) => p.id === id) || null
    setSelectedProject(proj as any)
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <label className="text-sm text-gray-600 dark:text-gray-300">Project</label>
      <select
        className="text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
        value={selectedProjectId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !!error}
      >
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.domain}
          </option>
        ))}
      </select>
      {selectedProject ? (
        <span className="text-xs text-gray-500 dark:text-gray-400">{selectedProject.domain}</span>
      ) : null}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  )
}


