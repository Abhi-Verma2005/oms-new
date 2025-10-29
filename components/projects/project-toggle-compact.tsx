"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProjectStore, type UserProject } from '@/stores/project-store'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Briefcase } from 'lucide-react'

type Props = {
  className?: string
}

// Compact mobile/tablet project toggle inspired by the E‑Commerce dropdown UX
export default function ProjectToggleCompact({ className = '' }: Props) {
  const { selectedProjectId, selectedProject, setSelectedProject, clearProject } = useProjectStore()
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentLabel = useMemo(() => {
    if (selectedProject?.name || selectedProject?.domain) return selectedProject.name || selectedProject.domain
    return 'No project'
  }, [selectedProject])

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
      })
      .catch((e) => {
        if (cancelled) return
        setError(e?.message || 'Failed to load projects')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, []) // No dependencies - stable function

  // Only fetch when popover opens OR when a project is created
  useEffect(() => {
    const handler = () => {
      // Refresh projects list when a new project is created
      fetchProjects()
    }
    window.addEventListener('project:created', handler)
    return () => {
      window.removeEventListener('project:created', handler)
    }
  }, [fetchProjects])
  
  // Fetch projects when popover opens (lazy loading)
  useEffect(() => {
    if (open && projects.length === 0) {
      fetchProjects()
    }
  }, [open, projects.length, fetchProjects])

  const handleSelect = (id: string | null) => {
    if (!id) {
      setSelectedProject(null as any)
      setOpen(false)
      return
    }
    const proj = projects.find((p) => p.id === id) || null
    setSelectedProject(proj as any)
    setOpen(false)
  }

  return (
    <div className={`lg:hidden relative z-40 inline-block ${className}`}>
      <div className="flex flex-col gap-2 items-start">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Toggle project</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 px-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 inline-flex items-center gap-2 relative z-40 w-auto"
            >
              <Briefcase className="w-4 h-4 opacity-80" />
              <span className="text-sm">{currentLabel || 'Current project'}</span>
              <ChevronDown className="w-4 h-4 opacity-80" />
            </Button>
          </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-[60]" align="start">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Toggle project</div>
          </div>
          <div className="max-h-64 overflow-auto py-1">
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!selectedProjectId ? 'text-violet-600 dark:text-violet-400' : 'text-gray-800 dark:text-gray-100'}`}
              onClick={() => handleSelect(null)}
            >
              No project
            </button>
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-600">{error}</div>
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedProjectId === p.id ? 'text-violet-600 dark:text-violet-400' : 'text-gray-800 dark:text-gray-100'}`}
                  onClick={() => handleSelect(p.id)}
                >
                  {p.name || p.domain}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  )
}



