#!/usr/bin/env tsx

/**
 * Migration script to move data from legacy UserContext to new UserProfile and UserAIInsights tables
 * 
 * Usage:
 * npx tsx scripts/migrate-user-context.ts
 * 
 * Options:
 * --dry-run: Show what would be migrated without actually doing it
 * --batch-size: Number of users to process at once (default: 100)
 * --user-id: Migrate specific user only
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationOptions {
  dryRun: boolean
  batchSize: number
  userId?: string
}

async function migrateUserContext(options: MigrationOptions) {
  console.log('🚀 Starting UserContext migration...')
  console.log(`Options:`, options)

  try {
    // Get users to migrate
    let whereClause: any = {}
    if (options.userId) {
      whereClause.userId = options.userId
    }

    const legacyContexts = await prisma.userContext.findMany({
      where: whereClause,
      include: { user: true },
      take: options.batchSize
    })

    console.log(`📊 Found ${legacyContexts.length} legacy contexts to migrate`)

    if (legacyContexts.length === 0) {
      console.log('✅ No contexts to migrate')
      return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const legacyContext of legacyContexts) {
      try {
        console.log(`\n👤 Processing user: ${legacyContext.user.email || legacyContext.userId}`)

        // Check if already migrated
        const existingProfile = await prisma.userProfile.findUnique({
          where: { userId: legacyContext.userId }
        })

        const existingAIInsights = await prisma.userAIInsights.findUnique({
          where: { userId: legacyContext.userId }
        })

        if (existingProfile && existingAIInsights) {
          console.log(`⏭️  Already migrated, skipping`)
          skipped++
          continue
        }

        if (options.dryRun) {
          console.log(`🔍 Would migrate user ${legacyContext.userId}`)
          migrated++
          continue
        }

        // Migrate user-provided data to UserProfile
        if (!existingProfile) {
          await prisma.userProfile.create({
            data: {
              userId: legacyContext.userId,
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
          console.log(`✅ Created UserProfile`)
        }

        // Migrate AI-generated data to UserAIInsights
        if (!existingAIInsights) {
          const aiInsights = legacyContext.aiInsights as any || {}
          
          await prisma.userAIInsights.create({
            data: {
              userId: legacyContext.userId,
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
          console.log(`✅ Created UserAIInsights`)
        }

        // Mark legacy context as migrated
        await prisma.userContext.update({
          where: { userId: legacyContext.userId },
          data: {
            aiMetadata: {
              ...(legacyContext.aiMetadata as any || {}),
              migrated: true,
              migratedAt: new Date().toISOString()
            }
          }
        })

        console.log(`✅ Marked as migrated`)
        migrated++

      } catch (error) {
        console.error(`❌ Error migrating user ${legacyContext.userId}:`, error)
        errors++
      }
    }

    console.log(`\n📈 Migration Summary:`)
    console.log(`✅ Migrated: ${migrated}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)

    if (options.dryRun) {
      console.log(`\n🔍 This was a dry run. No data was actually migrated.`)
      console.log(`Run without --dry-run to perform the actual migration.`)
    }

  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2)
  
  const options: MigrationOptions = {
    dryRun: false,
    batchSize: 100,
    userId: undefined
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--batch-size':
        options.batchSize = parseInt(args[i + 1]) || 100
        i++
        break
      case '--user-id':
        options.userId = args[i + 1]
        i++
        break
      case '--help':
        console.log(`
UserContext Migration Script

Usage: npx tsx scripts/migrate-user-context.ts [options]

Options:
  --dry-run              Show what would be migrated without actually doing it
  --batch-size <number>  Number of users to process at once (default: 100)
  --user-id <id>         Migrate specific user only
  --help                 Show this help message

Examples:
  npx tsx scripts/migrate-user-context.ts --dry-run
  npx tsx scripts/migrate-user-context.ts --batch-size 50
  npx tsx scripts/migrate-user-context.ts --user-id "user123"
        `)
        process.exit(0)
        break
    }
  }

  return options
}

// Run migration
if (require.main === module) {
  const options = parseArgs()
  migrateUserContext(options)
}

export { migrateUserContext }

