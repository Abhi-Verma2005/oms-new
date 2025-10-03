"use client"

import { useProjectStore } from '@/stores/project-store'

export function useActivityLogger() {
  const { selectedProjectId } = useProjectStore()

  const log = async (
    activity: string,
    category: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity, category, description, metadata, projectId: selectedProjectId ?? undefined }),
      })
    } catch (_e) {
      // Ignore client logging errors
    }
  }

  return { log, projectId: selectedProjectId }
}


