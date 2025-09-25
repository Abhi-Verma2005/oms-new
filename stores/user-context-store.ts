import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types for User Context
interface CompanyInfo {
  name?: string
  size?: 'startup' | 'small' | 'medium' | 'enterprise'
  industry?: string
  role?: string
  department?: string
}

interface ProfessionalContext {
  experience?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  primaryGoals?: string[]
  currentProjects?: string[]
}

interface Preferences {
  communicationStyle?: 'formal' | 'casual' | 'technical' | 'brief'
  preferredContentType?: string[]
  timezone?: string
  workingHours?: {
    start?: string
    end?: string
    days?: string[]
  }
}

interface AIInsights {
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  expertiseLevel?: Record<string, number> // topic -> expertise level (0-1)
  personalityTraits?: string[]
  behaviorPatterns?: string[]
  lastAnalyzed?: string
}

interface UserContextData {
  company: CompanyInfo
  professional: ProfessionalContext
  preferences: Preferences
  aiInsights: AIInsights
  lastUpdated: string | null
  isLoaded: boolean
}

interface ContextUpdate {
  id: string
  type: string
  field?: string
  oldValue?: any
  newValue?: any
  aiConfidence?: number
  aiReasoning?: string
  source?: string
  timestamp: string
}

interface UserContextState extends UserContextData {
  // Loading states
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  
  // Context updates history
  updates: ContextUpdate[]
  recentUpdates: ContextUpdate[]
  
  // AI Analysis state
  isAnalyzing: boolean
  lastAnalysis: string | null
}

interface UserContextActions {
  // Core context management
  setContext: (context: Partial<UserContextData>) => void
  updateContext: (updates: Partial<UserContextData>) => Promise<void>
  clearContext: () => void
  
  // Company info actions
  updateCompanyInfo: (company: Partial<CompanyInfo>) => void
  setCompanySize: (size: CompanyInfo['size']) => void
  setIndustry: (industry: string) => void
  setRole: (role: string) => void
  
  // Professional context actions
  updateProfessionalContext: (professional: Partial<ProfessionalContext>) => void
  addPrimaryGoal: (goal: string) => void
  removePrimaryGoal: (goal: string) => void
  addCurrentProject: (project: string) => void
  removeCurrentProject: (project: string) => void
  
  // Preferences actions
  updatePreferences: (preferences: Partial<Preferences>) => void
  setCommunicationStyle: (style: Preferences['communicationStyle']) => void
  addPreferredContentType: (type: string) => void
  removePreferredContentType: (type: string) => void
  setWorkingHours: (hours: Preferences['workingHours']) => void
  
  // AI insights actions
  updateAIInsights: (insights: Partial<AIInsights>) => void
  setExpertiseLevel: (topic: string, level: number) => void
  addPersonalityTrait: (trait: string) => void
  setLearningStyle: (style: AIInsights['learningStyle']) => void
  
  // Context updates management
  addContextUpdate: (update: Omit<ContextUpdate, 'id' | 'timestamp'>) => void
  getRecentUpdates: (limit?: number) => ContextUpdate[]
  
  // Loading and error management
  setLoading: (loading: boolean) => void
  setUpdating: (updating: boolean) => void
  setError: (error: string | null) => void
  setAnalyzing: (analyzing: boolean) => void
  
  // Utility functions
  getContextSummary: () => string
  hasRecentUpdates: (hours?: number) => boolean
  needsUpdate: () => boolean
  
  // API integration
  fetchUserContext: () => Promise<void>
  saveUserContext: () => Promise<void>
  analyzeUserContext: (interactions?: any[]) => Promise<void>
}

type UserContextStore = UserContextState & UserContextActions

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

export const useUserContextStore = create<UserContextStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      company: {},
      professional: {},
      preferences: {},
      aiInsights: {},
      lastUpdated: null,
      isLoaded: false,
      
      // Loading states
      isLoading: false,
      isUpdating: false,
      error: null,
      
      // Context updates
      updates: [],
      recentUpdates: [],
      
      // AI Analysis
      isAnalyzing: false,
      lastAnalysis: null,

      // Core context management
      setContext: (context) => {
        set((state) => {
          if (context.company) state.company = { ...state.company, ...context.company }
          if (context.professional) state.professional = { ...state.professional, ...context.professional }
          if (context.preferences) state.preferences = { ...state.preferences, ...context.preferences }
          if (context.aiInsights) state.aiInsights = { ...state.aiInsights, ...context.aiInsights }
          if (context.lastUpdated) state.lastUpdated = context.lastUpdated
          if (context.isLoaded !== undefined) state.isLoaded = context.isLoaded
        })
      },

      updateContext: async (updates) => {
        const state = get()
        state.setUpdating(true)
        state.setError(null)
        
        try {
          // Update local state
          state.setContext(updates)
          
          // Add context update record
          Object.entries(updates).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
              Object.entries(value).forEach(([subKey, subValue]) => {
                state.addContextUpdate({
                  type: key.toUpperCase(),
                  field: subKey,
                  newValue: subValue,
                  source: 'manual_update'
                })
              })
            } else {
              state.addContextUpdate({
                type: key.toUpperCase(),
                field: key,
                newValue: value,
                source: 'manual_update'
              })
            }
          })
          
          // Save to backend
          await state.saveUserContext()
          
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Failed to update context')
          throw error
        } finally {
          state.setUpdating(false)
        }
      },

      clearContext: () => {
        set((state) => {
          state.company = {}
          state.professional = {}
          state.preferences = {}
          state.aiInsights = {}
          state.lastUpdated = null
          state.isLoaded = false
          state.updates = []
          state.recentUpdates = []
          state.error = null
        })
      },

      // Company info actions
      updateCompanyInfo: (company) => {
        set((state) => {
          state.company = { ...state.company, ...company }
          state.lastUpdated = new Date().toISOString()
        })
      },

      setCompanySize: (size) => {
        const state = get()
        state.updateCompanyInfo({ size })
        state.addContextUpdate({
          type: 'COMPANY_INFO',
          field: 'companySize',
          oldValue: state.company.size,
          newValue: size,
          source: 'user_action'
        })
      },

      setIndustry: (industry) => {
        const state = get()
        state.updateCompanyInfo({ industry })
        state.addContextUpdate({
          type: 'COMPANY_INFO',
          field: 'industry',
          oldValue: state.company.industry,
          newValue: industry,
          source: 'user_action'
        })
      },

      setRole: (role) => {
        const state = get()
        state.updateCompanyInfo({ role })
        state.addContextUpdate({
          type: 'COMPANY_INFO',
          field: 'role',
          oldValue: state.company.role,
          newValue: role,
          source: 'user_action'
        })
      },

      // Professional context actions
      updateProfessionalContext: (professional) => {
        set((state) => {
          state.professional = { ...state.professional, ...professional }
          state.lastUpdated = new Date().toISOString()
        })
      },

      addPrimaryGoal: (goal) => {
        const state = get()
        const currentGoals = state.professional.primaryGoals || []
        if (!currentGoals.includes(goal)) {
          state.updateProfessionalContext({ 
            primaryGoals: [...currentGoals, goal] 
          })
          state.addContextUpdate({
            type: 'GOALS',
            field: 'primaryGoals',
            oldValue: currentGoals,
            newValue: [...currentGoals, goal],
            source: 'user_action'
          })
        }
      },

      removePrimaryGoal: (goal) => {
        const state = get()
        const currentGoals = state.professional.primaryGoals || []
        const updatedGoals = currentGoals.filter(g => g !== goal)
        state.updateProfessionalContext({ primaryGoals: updatedGoals })
        state.addContextUpdate({
          type: 'GOALS',
          field: 'primaryGoals',
          oldValue: currentGoals,
          newValue: updatedGoals,
          source: 'user_action'
        })
      },

      addCurrentProject: (project) => {
        const state = get()
        const currentProjects = state.professional.currentProjects || []
        if (!currentProjects.includes(project)) {
          state.updateProfessionalContext({ 
            currentProjects: [...currentProjects, project] 
          })
          state.addContextUpdate({
            type: 'GOALS',
            field: 'currentProjects',
            oldValue: currentProjects,
            newValue: [...currentProjects, project],
            source: 'user_action'
          })
        }
      },

      removeCurrentProject: (project) => {
        const state = get()
        const currentProjects = state.professional.currentProjects || []
        const updatedProjects = currentProjects.filter(p => p !== project)
        state.updateProfessionalContext({ currentProjects: updatedProjects })
        state.addContextUpdate({
          type: 'GOALS',
          field: 'currentProjects',
          oldValue: currentProjects,
          newValue: updatedProjects,
          source: 'user_action'
        })
      },

      // Preferences actions
      updatePreferences: (preferences) => {
        set((state) => {
          state.preferences = { ...state.preferences, ...preferences }
          state.lastUpdated = new Date().toISOString()
        })
      },

      setCommunicationStyle: (style) => {
        const state = get()
        state.updatePreferences({ communicationStyle: style })
        state.addContextUpdate({
          type: 'COMMUNICATION_STYLE',
          field: 'communicationStyle',
          oldValue: state.preferences.communicationStyle,
          newValue: style,
          source: 'user_action'
        })
      },

      addPreferredContentType: (type) => {
        const state = get()
        const currentTypes = state.preferences.preferredContentType || []
        if (!currentTypes.includes(type)) {
          state.updatePreferences({ 
            preferredContentType: [...currentTypes, type] 
          })
          state.addContextUpdate({
            type: 'PREFERENCES',
            field: 'preferredContentType',
            oldValue: currentTypes,
            newValue: [...currentTypes, type],
            source: 'user_action'
          })
        }
      },

      removePreferredContentType: (type) => {
        const state = get()
        const currentTypes = state.preferences.preferredContentType || []
        const updatedTypes = currentTypes.filter(t => t !== type)
        state.updatePreferences({ preferredContentType: updatedTypes })
        state.addContextUpdate({
          type: 'PREFERENCES',
          field: 'preferredContentType',
          oldValue: currentTypes,
          newValue: updatedTypes,
          source: 'user_action'
        })
      },

      setWorkingHours: (hours) => {
        const state = get()
        state.updatePreferences({ workingHours: hours })
        state.addContextUpdate({
          type: 'WORKING_HOURS',
          field: 'workingHours',
          oldValue: state.preferences.workingHours,
          newValue: hours,
          source: 'user_action'
        })
      },

      // AI insights actions
      updateAIInsights: (insights) => {
        set((state) => {
          state.aiInsights = { ...state.aiInsights, ...insights }
          state.lastUpdated = new Date().toISOString()
        })
      },

      setExpertiseLevel: (topic, level) => {
        const state = get()
        const currentLevels = state.aiInsights.expertiseLevel || {}
        state.updateAIInsights({ 
          expertiseLevel: { ...currentLevels, [topic]: level } 
        })
        state.addContextUpdate({
          type: 'EXPERTISE',
          field: 'expertiseLevel',
          oldValue: currentLevels[topic],
          newValue: level,
          aiConfidence: 0.8, // Default confidence for manual updates
          source: 'user_action'
        })
      },

      addPersonalityTrait: (trait) => {
        const state = get()
        const currentTraits = state.aiInsights.personalityTraits || []
        if (!currentTraits.includes(trait)) {
          state.updateAIInsights({ 
            personalityTraits: [...currentTraits, trait] 
          })
          state.addContextUpdate({
            type: 'AI_INSIGHTS',
            field: 'personalityTraits',
            oldValue: currentTraits,
            newValue: [...currentTraits, trait],
            aiConfidence: 0.7,
            source: 'ai_analysis'
          })
        }
      },

      setLearningStyle: (style) => {
        const state = get()
        state.updateAIInsights({ learningStyle: style })
        state.addContextUpdate({
          type: 'LEARNING_STYLE',
          field: 'learningStyle',
          oldValue: state.aiInsights.learningStyle,
          newValue: style,
          aiConfidence: 0.8,
          source: 'ai_analysis'
        })
      },

      // Context updates management
      addContextUpdate: (update) => {
        const newUpdate: ContextUpdate = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          ...update
        }
        
        set((state) => {
          state.updates.push(newUpdate)
          state.recentUpdates = [newUpdate, ...state.recentUpdates.slice(0, 9)] // Keep last 10
        })
      },

      getRecentUpdates: (limit = 10) => {
        const state = get()
        return state.updates.slice(-limit).reverse()
      },

      // Loading and error management
      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setUpdating: (updating) => {
        set((state) => {
          state.isUpdating = updating
        })
      },

      setError: (error) => {
        set((state) => {
          state.error = error
        })
      },

      setAnalyzing: (analyzing) => {
        set((state) => {
          state.isAnalyzing = analyzing
        })
      },

      // Utility functions
      getContextSummary: () => {
        const state = get()
        const parts = []
        
        if (state.company.name) parts.push(`Company: ${state.company.name}`)
        if (state.company.industry) parts.push(`Industry: ${state.company.industry}`)
        if (state.company.role) parts.push(`Role: ${state.company.role}`)
        if (state.professional.experience) parts.push(`Experience: ${state.professional.experience}`)
        if (state.preferences.communicationStyle) parts.push(`Communication: ${state.preferences.communicationStyle}`)
        
        return parts.join(', ') || 'No context available'
      },

      hasRecentUpdates: (hours = 24) => {
        const state = get()
        if (!state.lastUpdated) return false
        
        const lastUpdate = new Date(state.lastUpdated)
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
        return lastUpdate > cutoff
      },

      needsUpdate: () => {
        const state = get()
        return !state.isLoaded || !state.lastUpdated || !state.hasRecentUpdates(168) // 1 week
      },

      // API integration
      fetchUserContext: async () => {
        const state = get()
        state.setLoading(true)
        state.setError(null)
        
        try {
          const response = await fetch('/api/user-context')
          if (!response.ok) throw new Error('Failed to fetch user context')
          
          const data = await response.json()
          state.setContext({
            ...data,
            isLoaded: true,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          })
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Failed to fetch context')
          throw error
        } finally {
          state.setLoading(false)
        }
      },

      saveUserContext: async () => {
        const state = get()
        state.setUpdating(true)
        
        try {
          const response = await fetch('/api/user-context', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: state.company,
              professional: state.professional,
              preferences: state.preferences,
              aiInsights: state.aiInsights
            })
          })
          
          if (!response.ok) throw new Error('Failed to save user context')
          
          const data = await response.json()
          state.setContext({
            lastUpdated: data.lastUpdated || new Date().toISOString()
          })
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Failed to save context')
          throw error
        } finally {
          state.setUpdating(false)
        }
      },

      analyzeUserContext: async (interactions = []) => {
        const state = get()
        state.setAnalyzing(true)
        
        try {
          const response = await fetch('/api/user-context/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactions })
          })
          
          if (!response.ok) throw new Error('Failed to analyze user context')
          
          const data = await response.json()
          
          // Update AI insights with analysis results
          state.updateAIInsights(data.insights)
          state.addContextUpdate({
            type: 'AI_INSIGHTS',
            field: 'analysis',
            newValue: data.insights,
            aiConfidence: data.confidence,
            aiReasoning: data.reasoning,
            source: 'ai_analysis'
          })
          
          state.lastAnalysis = new Date().toISOString()
        } catch (error) {
          state.setError(error instanceof Error ? error.message : 'Failed to analyze context')
          throw error
        } finally {
          state.setAnalyzing(false)
        }
      },
    })),
    {
      name: 'user-context-storage',
      partialize: (state) => ({
        company: state.company,
        professional: state.professional,
        preferences: state.preferences,
        aiInsights: state.aiInsights,
        lastUpdated: state.lastUpdated,
        isLoaded: state.isLoaded,
        updates: state.updates.slice(-50), // Keep last 50 updates
        recentUpdates: state.recentUpdates,
        lastAnalysis: state.lastAnalysis,
      }),
    }
  )
)

// Export types for use in other files
export type { UserContextData, CompanyInfo, ProfessionalContext, Preferences, AIInsights, ContextUpdate }

