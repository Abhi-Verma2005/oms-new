import { prisma } from '@/lib/db'

/**
 * Migration utility to move data from legacy UserContext to new UserProfile and UserAIInsights tables
 */

export async function migrateUserContextToNewArchitecture(userId: string) {
  try {
    // Get legacy user context
    const legacyContext = await prisma.userContext.findUnique({
      where: { userId }
    })

    if (!legacyContext) {
      return { migrated: false, reason: 'No legacy context found' }
    }

    // Check if already migrated
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    const existingAIInsights = await prisma.userAIInsights.findUnique({
      where: { userId }
    })

    if (existingProfile && existingAIInsights) {
      return { migrated: false, reason: 'Already migrated' }
    }

    // Migrate user-provided data to UserProfile
    if (!existingProfile) {
      await prisma.userProfile.create({
        data: {
          userId,
          // Company Information
          companyName: legacyContext.companyName,
          companySize: legacyContext.companySize,
          industry: legacyContext.industry,
          role: legacyContext.role,
          department: legacyContext.department,
          
          // Professional Context
          experience: legacyContext.experience,
          primaryGoals: legacyContext.primaryGoals,
          currentProjects: legacyContext.currentProjects,
          
          // Preferences
          communicationStyle: legacyContext.communicationStyle,
          preferredContentType: legacyContext.preferredContentType,
          timezone: legacyContext.timezone,
          workingHours: legacyContext.workingHours,
          
          // Default marketing values
          marketingOptIn: false,
          newsletterOptIn: false
        }
      })
    }

    // Migrate AI-generated data to UserAIInsights
    if (!existingAIInsights) {
      const aiInsights = legacyContext.aiInsights as any || {}
      
      await prisma.userAIInsights.create({
        data: {
          userId,
          // AI-Generated Personality & Behavior Analysis
          personalityTraits: aiInsights.personalityTraits || [],
          behaviorPatterns: aiInsights.behaviorPatterns || {},
          learningStyle: legacyContext.learningStyle || 'reading',
          expertiseLevel: legacyContext.expertiseLevel || {},
          
          // AI Conversation Analysis
          conversationTone: aiInsights.conversationTone || 'professional',
          communicationPatterns: aiInsights.communicationPatterns || {},
          topicInterests: aiInsights.topicInterests || [],
          painPoints: aiInsights.painPoints || [],
          
          // Dynamic AI Metadata
          aiMetadata: legacyContext.aiMetadata || {},
          
          // AI Confidence & Reasoning
          confidenceScore: aiInsights.confidenceScore || 0.5,
          lastAnalysisAt: legacyContext.lastUpdated
        }
      })
    }

    // Mark legacy context as migrated (add a flag)
    await prisma.userContext.update({
      where: { userId },
      data: {
        // We'll add a migration flag to the aiMetadata field
        aiMetadata: {
          ...(legacyContext.aiMetadata as any || {}),
          migrated: true,
          migratedAt: new Date().toISOString()
        }
      }
    })

    return { migrated: true, reason: 'Successfully migrated' }

  } catch (error) {
    console.error('Error migrating user context:', error)
    return { migrated: false, reason: 'Migration failed', error: error.message }
  }
}

/**
 * Get user context with automatic migration
 */
export async function getUserContextWithMigration(userId: string) {
  try {
    // Check if user has new architecture data
    const [userProfile, userAIInsights] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userAIInsights.findUnique({ where: { userId } })
    ])

    // If both exist, return new architecture data
    if (userProfile && userAIInsights) {
      return {
        profile: userProfile,
        aiInsights: userAIInsights,
        architecture: 'new'
      }
    }

    // If neither exist, check for legacy data
    const legacyContext = await prisma.userContext.findUnique({
      where: { userId }
    })

    if (legacyContext) {
      // Check if already migrated
      const isMigrated = (legacyContext.aiMetadata as any)?.migrated === true
      
      if (!isMigrated) {
        // Attempt migration
        const migrationResult = await migrateUserContextToNewArchitecture(userId)
        
        if (migrationResult.migrated) {
          // Return migrated data
          const [newProfile, newAIInsights] = await Promise.all([
            prisma.userProfile.findUnique({ where: { userId } }),
            prisma.userAIInsights.findUnique({ where: { userId } })
          ])
          
          return {
            profile: newProfile,
            aiInsights: newAIInsights,
            architecture: 'migrated'
          }
        }
      }

      // Return legacy data if migration failed or already migrated
      return {
        profile: null,
        aiInsights: null,
        legacyContext,
        architecture: 'legacy'
      }
    }

    // No data found
    return {
      profile: null,
      aiInsights: null,
      legacyContext: null,
      architecture: 'none'
    }

  } catch (error) {
    console.error('Error getting user context:', error)
    return {
      profile: null,
      aiInsights: null,
      legacyContext: null,
      architecture: 'error',
      error: error.message
    }
  }
}

/**
 * Create a unified user context object for AI consumption
 */
export function createUnifiedUserContext(contextData: any) {
  const { profile, aiInsights, legacyContext, architecture } = contextData

  if (architecture === 'new' || architecture === 'migrated') {
    return {
      user: {
        id: profile?.userId,
        // Add other user fields as needed
      },
      // User-provided data (stable, with consent)
      profile: profile ? {
        company: {
          name: profile.companyName,
          size: profile.companySize,
          industry: profile.industry,
          role: profile.role,
          department: profile.department,
          website: profile.website
        },
        professional: {
          experience: profile.experience,
          primaryGoals: profile.primaryGoals,
          currentProjects: profile.currentProjects,
          budget: profile.budget,
          teamSize: profile.teamSize
        },
        preferences: {
          communicationStyle: profile.communicationStyle,
          preferredContentType: profile.preferredContentType,
          timezone: profile.timezone,
          workingHours: profile.workingHours,
          language: profile.language
        },
        marketing: {
          leadSource: profile.leadSource,
          leadScore: profile.leadScore,
          marketingOptIn: profile.marketingOptIn,
          newsletterOptIn: profile.newsletterOptIn
        }
      } : undefined,
      // AI-generated insights (dynamic, rapidly updated)
      aiInsights: aiInsights ? {
        personalityTraits: aiInsights.personalityTraits,
        behaviorPatterns: aiInsights.behaviorPatterns,
        learningStyle: aiInsights.learningStyle,
        expertiseLevel: aiInsights.expertiseLevel,
        conversationTone: aiInsights.conversationTone,
        communicationPatterns: aiInsights.communicationPatterns,
        topicInterests: aiInsights.topicInterests,
        painPoints: aiInsights.painPoints,
        confidenceScore: aiInsights.confidenceScore,
        lastAnalysisAt: aiInsights.lastAnalysisAt
      } : undefined,
      // Dynamic AI metadata (arbitrary, namespaced keys)
      aiMetadata: aiInsights?.aiMetadata || {}
    }
  }

  // Legacy fallback
  if (architecture === 'legacy' && legacyContext) {
    const aiInsights = legacyContext.aiInsights as any || {}
    
    return {
      user: {
        id: legacyContext.userId,
      },
      profile: {
        company: {
          name: legacyContext.companyName,
          size: legacyContext.companySize,
          industry: legacyContext.industry,
          role: legacyContext.role,
          department: legacyContext.department
        },
        professional: {
          experience: legacyContext.experience,
          primaryGoals: legacyContext.primaryGoals,
          currentProjects: legacyContext.currentProjects
        },
        preferences: {
          communicationStyle: legacyContext.communicationStyle,
          preferredContentType: legacyContext.preferredContentType,
          timezone: legacyContext.timezone,
          workingHours: legacyContext.workingHours
        }
      },
      aiInsights: {
        personalityTraits: aiInsights.personalityTraits || [],
        behaviorPatterns: aiInsights.behaviorPatterns || {},
        learningStyle: legacyContext.learningStyle,
        expertiseLevel: legacyContext.expertiseLevel,
        conversationTone: aiInsights.conversationTone || 'professional',
        communicationPatterns: aiInsights.communicationPatterns || {},
        topicInterests: aiInsights.topicInterests || [],
        painPoints: aiInsights.painPoints || [],
        confidenceScore: aiInsights.confidenceScore || 0.5
      },
      aiMetadata: legacyContext.aiMetadata || {}
    }
  }

  // No data
  return {
    user: undefined,
    profile: undefined,
    aiInsights: undefined,
    aiMetadata: {}
  }
}

