import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Extended user interface with all available data
interface ExtendedUser {
  // Basic user data (from User table)
  id: string
  name?: string | null
  email?: string | null
  emailVerified?: Date | null
  image?: string | null
  createdAt?: Date
  updatedAt?: Date
  dailyCredits?: number
  lastCreditReset?: Date | null
  
  // User profile data (from UserProfile table)
  userProfile?: {
    companyName?: string
    companySize?: string
    industry?: string
    role?: string
    department?: string
    website?: string
    experience?: string
    primaryGoals?: string[]
    currentProjects?: string[]
    budget?: string
    teamSize?: string
    communicationStyle?: string
    preferredContentType?: string
    timezone?: string
    workingHours?: string
    language?: string
    leadSource?: string
    leadScore?: number
    marketingOptIn?: boolean
    newsletterOptIn?: boolean
  } | null
  
  // User context data (from UserContext table)
  userContext?: {
    preferences?: Record<string, any>
    settings?: Record<string, any>
    metadata?: Record<string, any>
  } | null
  
  // AI insights data (from UserAIInsights table)
  aiInsights?: {
    personalityTraits?: string[]
    behaviorPatterns?: Record<string, any>
    learningStyle?: string
    expertiseLevel?: string
    conversationTone?: string
    communicationPatterns?: Record<string, any>
    topicInterests?: string[]
    painPoints?: string[]
    confidenceScore?: number
    lastAnalysisAt?: Date
    aiMetadata?: Record<string, any>
  } | null
  
  // User roles
  roles?: string[]
  isAdmin?: boolean
}

interface UserContextState {
  // User data
  user: ExtendedUser | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Cached data flags
  hasUserProfile: boolean
  hasUserContext: boolean
  hasAIInsights: boolean
  
  // Request management
  isRefreshing: boolean
  refreshPromise: Promise<void> | null
}

interface UserContextActions {
  // User data actions
  setUser: (user: ExtendedUser | null) => void
  updateUser: (updates: Partial<ExtendedUser>) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Cache flags
  setHasUserProfile: (has: boolean) => void
  setHasUserContext: (has: boolean) => void
  setHasAIInsights: (has: boolean) => void
  
  // Utility actions
  refreshUserData: () => Promise<void>
  clearUserData: () => void
  
  // Get user context for AI
  getUserContextForAI: () => {
    basic: {
      id: string
      name?: string | null
      email?: string | null
      createdAt?: Date
    }
    profile: ExtendedUser['userProfile']
    context: ExtendedUser['userContext']
    aiInsights: ExtendedUser['aiInsights']
    roles: string[]
    isAdmin: boolean
  } | null
}

type UserContextStore = UserContextState & UserContextActions

export const useUserContextStore = create<UserContextStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      hasUserProfile: false,
      hasUserContext: false,
      hasAIInsights: false,
      isRefreshing: false,
      refreshPromise: null,

      // User data actions
      setUser: (user: ExtendedUser | null) => {
        set((state) => {
          state.user = user
          state.lastUpdated = new Date()
          state.error = null
          
          // Update cache flags
          state.hasUserProfile = !!user?.userProfile
          state.hasUserContext = !!user?.userContext
          state.hasAIInsights = !!user?.aiInsights
        })
      },

      updateUser: (updates: Partial<ExtendedUser>) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates)
            state.lastUpdated = new Date()
          }
        })
      },

      // Loading states
      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      // Cache flags
      setHasUserProfile: (has: boolean) => {
        set((state) => {
          state.hasUserProfile = has
        })
      },

      setHasUserContext: (has: boolean) => {
        set((state) => {
          state.hasUserContext = has
        })
      },

      setHasAIInsights: (has: boolean) => {
        set((state) => {
          state.hasAIInsights = has
        })
      },

      // Utility actions
      refreshUserData: async () => {
        const state = get()
        
        // If already refreshing, return the existing promise
        if (state.isRefreshing && state.refreshPromise) {
          return state.refreshPromise
        }
        
        // If we have recent data (less than 5 minutes old), don't refresh
        if (state.user && state.lastUpdated) {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          if (state.lastUpdated > fiveMinutesAgo) {
            return Promise.resolve()
          }
        }
        
        const { setLoading, setError } = state
        
        // Create the refresh promise
        const refreshPromise = (async () => {
          set((state) => {
            state.isRefreshing = true
            state.isLoading = true
            state.error = null
          })
          
          try {
            const response = await fetch('/api/user/context')
            if (!response.ok) {
              throw new Error('Failed to fetch user context')
            }
            
            const userData = await response.json()
            get().setUser(userData)
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error')
          } finally {
            set((state) => {
              state.isLoading = false
              state.isRefreshing = false
              state.refreshPromise = null
            })
          }
        })()
        
        // Store the promise to prevent duplicate requests
        set((state) => {
          state.refreshPromise = refreshPromise
        })
        
        return refreshPromise
      },

      clearUserData: () => {
        set((state) => {
          state.user = null
          state.error = null
          state.lastUpdated = null
          state.hasUserProfile = false
          state.hasUserContext = false
          state.hasAIInsights = false
          state.isRefreshing = false
          state.refreshPromise = null
        })
      },

      // Get user context for AI
      getUserContextForAI: () => {
        const { user } = get()
        if (!user) return null
        
        return {
          basic: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          },
          profile: user.userProfile,
          context: user.userContext,
          aiInsights: user.aiInsights,
          roles: user.roles || [],
          isAdmin: user.isAdmin || false
        }
      }
    })),
    {
      name: 'user-context-store',
      // Only persist essential data, not sensitive information
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          name: state.user.name,
          email: state.user.email,
          userProfile: state.user.userProfile,
          userContext: state.user.userContext,
          aiInsights: state.user.aiInsights,
          roles: state.user.roles,
          isAdmin: state.user.isAdmin
        } : null,
        hasUserProfile: state.hasUserProfile,
        hasUserContext: state.hasUserContext,
        hasAIInsights: state.hasAIInsights,
        lastUpdated: state.lastUpdated,
        isRefreshing: state.isRefreshing,
        refreshPromise: null // Don't persist promises
      })
    }
  )
)

// Hook to get user context for AI requests
export const useUserContextForAI = () => {
  const getUserContextForAI = useUserContextStore(state => state.getUserContextForAI)
  const refreshUserData = useUserContextStore(state => state.refreshUserData)
  const isLoading = useUserContextStore(state => state.isLoading)
  const hasUserProfile = useUserContextStore(state => state.hasUserProfile)
  const hasUserContext = useUserContextStore(state => state.hasUserContext)
  const hasAIInsights = useUserContextStore(state => state.hasAIInsights)
  
  return {
    getUserContextForAI,
    refreshUserData,
    isLoading,
    hasUserProfile,
    hasUserContext,
    hasAIInsights
  }
}
