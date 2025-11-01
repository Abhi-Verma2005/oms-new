/**
 * Script to create default views for all existing projects that don't have one
 * 
 * Run with: npx tsx scripts/backfill-default-views.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfill() {
  console.log('Starting backfill: Creating default views for existing projects')
  
  try {
    // Get all projects
    const projects = await prisma.project.findMany({
      include: {
        savedViews: {
          where: {
            name: 'Default'
          }
        }
      }
    })

    console.log(`Found ${projects.length} projects to check`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const project of projects) {
      try {
        // Check if default view already exists
        if (project.savedViews.length > 0) {
          console.log(`Skipped: Project ${project.id} (${project.name}) already has a default view`)
          skipped++
          continue
        }

        // Create default view
        await prisma.savedView.create({
          data: {
            userId: project.userId,
            name: 'Default',
            filters: {},
            projectId: project.id
          }
        })
        console.log(`Created default view for project ${project.id} (${project.name})`)
        created++

        // Try to migrate from ProjectFilterPreference if it exists
        const pref = await prisma.projectFilterPreference.findFirst({
          where: {
            userId: project.userId,
            projectId: project.id,
            page: 'publishers'
          }
        })

        if (pref && pref.data) {
          // Update the default view with preference data
          await prisma.savedView.updateMany({
            where: {
              userId: project.userId,
              name: 'Default',
              projectId: project.id
            },
            data: {
              filters: pref.data
            }
          })
          console.log(`Migrated filters from ProjectFilterPreference for project ${project.id}`)
        }
      } catch (error: any) {
        console.error(`Error processing project ${project.id}:`, error.message)
        errors++
      }
    }

    console.log('\nBackfill complete!')
    console.log(`Created: ${created}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Errors: ${errors}`)

  } catch (error) {
    console.error('Backfill failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run backfill
backfill()
  .then(() => {
    console.log('Backfill script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Backfill script failed:', error)
    process.exit(1)
  })

