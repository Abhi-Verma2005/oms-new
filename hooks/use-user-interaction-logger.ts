import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserContextStore } from '@/stores/user-context-store'

interface UseUserInteractionLoggerOptions {
  enabled?: boolean
  sessionId?: string
}

export function useUserInteractionLogger(options: UseUserInteractionLoggerOptions = {}) {
  const { enabled = true, sessionId } = options
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    let sessionIdToUse = sessionId
    if (!sessionIdToUse) {
      sessionIdToUse = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Log page views
    const logPageView = (url: string) => {
      fetch('/api/user-context/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'PAGE_VIEW',
          content: url,
          context: {
            referrer: document.referrer,
            userAgent: navigator.userAgent
          },
          sessionId: sessionIdToUse,
          pageUrl: url
        })
      }).catch(err => console.warn('Failed to log page view:', err))
    }

    // Log current page view
    logPageView(window.location.pathname)

    // Set up route change listener
    const handleRouteChange = (url: string) => {
      logPageView(url)
    }

    // Listen for route changes (Next.js router events)
    router.events?.on('routeChangeComplete', handleRouteChange)

    // Log search queries
    const logSearch = (query: string, filters?: any) => {
      fetch('/api/user-context/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'SEARCH_QUERY',
          content: query,
          context: {
            filters,
            url: window.location.href
          },
          sessionId: sessionIdToUse,
          pageUrl: window.location.href
        })
      }).catch(err => console.warn('Failed to log search:', err))
    }

    // Log filter usage
    const logFilterUsage = (filters: any) => {
      fetch('/api/user-context/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'FILTER_USAGE',
          content: JSON.stringify(filters),
          context: {
            url: window.location.href,
            filterCount: Object.keys(filters).length
          },
          sessionId: sessionIdToUse,
          pageUrl: window.location.href
        })
      }).catch(err => console.warn('Failed to log filter usage:', err))
    }

    // Log navigation
    const logNavigation = (target: string, context?: any) => {
      fetch('/api/user-context/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'NAVIGATION',
          content: target,
          context: {
            from: window.location.pathname,
            ...context
          },
          sessionId: sessionIdToUse,
          pageUrl: window.location.href
        })
      }).catch(err => console.warn('Failed to log navigation:', err))
    }

    // Log feedback
    const logFeedback = (rating: number, comment?: string, category?: string) => {
      fetch('/api/user-context/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'FEEDBACK',
          content: comment || '',
          context: {
            rating,
            category,
            url: window.location.href
          },
          sessionId: sessionIdToUse,
          pageUrl: window.location.href
        })
      }).catch(err => console.warn('Failed to log feedback:', err))
    }

    // Expose logging functions to window for global access
    ;(window as any).logUserInteraction = {
      search: logSearch,
      filter: logFilterUsage,
      navigate: logNavigation,
      feedback: logFeedback
    }

    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange)
      delete (window as any).logUserInteraction
    }
  }, [enabled, sessionId, router])

  return {
    sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

