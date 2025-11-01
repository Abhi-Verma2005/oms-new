/**
 * Migration script to move ProjectFilterPreference data to default views
 * 
 * This script:
 * 1. Finds all ProjectFilterPreference entries
 * 2. Creates default views for each project/user combination
 * 3. Migrates filter data from ProjectFilterPreference to default views
 * 
 * Run with: npx tsx scripts/migrate-project-filters-to-default-views.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('Starting migration: ProjectFilterPreference -> Default Views')
  
  try {
    // Get all project filter preferences
    const preferences = await prisma.projectFilterPreference.findMany({
      include: {
        user: true,
        project: true
      }
    })

    console.log(`Found ${preferences.length} ProjectFilterPreference entries to migrate`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const pref of preferences) {
      try {
        // Use "Default" as the name (not "Default (projectId)")
        const defaultViewName = 'Default'
        
        // Check if default view already exists for this project
        const existing = await prisma.savedView.findFirst({
          where: {
            userId: pref.userId,
            name: defaultViewName,
            projectId: pref.projectId
          }
        })

        if (existing) {
          // Update existing default view with preference data if it's empty or older
          if (!existing.filters || Object.keys(existing.filters as any).length === 0 || 
              (existing.updatedAt && pref.updatedAt && pref.updatedAt > existing.updatedAt)) {
            await prisma.savedView.update({
              where: { id: existing.id },
              data: {
                filters: pref.data,
                updatedAt: new Date()
              }
            })
            console.log(`Updated default view for project ${pref.projectId}, user ${pref.userId}`)
            migrated++
          } else {
            console.log(`Skipped: Default view already exists with data for project ${pref.projectId}`)
            skipped++
          }
        } else {
          // Create new default view
          await prisma.savedView.create({
            data: {
              userId: pref.userId,
              name: defaultViewName,
              filters: pref.data,
              projectId: pref.projectId
            }
          })
          console.log(`Created default view for project ${pref.projectId}, user ${pref.userId}`)
          migrated++
        }
      } catch (error: any) {
        console.error(`Error migrating preference for project ${pref.projectId}:`, error.message)
        errors++
      }
    }

    console.log('\nMigration complete!')
    console.log(`Migrated: ${migrated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Errors: ${errors}`)
    console.log('\nNote: ProjectFilterPreference entries are preserved for rollback safety.')
    console.log('You can delete them manually after verifying the migration.')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })

