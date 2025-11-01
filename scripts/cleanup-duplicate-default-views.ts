/**
 * Script to clean up duplicate default views with project IDs in the name
 * 
 * This fixes views created by the old migration script that used "Default (projectId)" format
 * Run with: npx tsx scripts/cleanup-duplicate-default-views.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('Starting cleanup: Removing duplicate default views with project IDs in name')
  
  try {
    // Find all views with names like "Default (projectId)"
    const viewsWithProjectId = await prisma.savedView.findMany({
      where: {
        name: {
          startsWith: 'Default ('
        }
      },
      include: {
        project: true
      }
    })

    console.log(`Found ${viewsWithProjectId.length} views with "Default (projectId)" format`)

    let merged = 0
    let deleted = 0
    let errors = 0

    for (const view of viewsWithProjectId) {
      try {
        // Check if a proper "Default" view exists for this project
        const properDefault = await prisma.savedView.findFirst({
          where: {
            userId: view.userId,
            name: 'Default',
            projectId: view.projectId
          }
        })

        if (properDefault) {
          // Merge filters from the old view into the proper one if the proper one is empty
          const oldFilters = view.filters as any
          const properFilters = properDefault.filters as any
          
          if (Object.keys(properFilters || {}).length === 0 && Object.keys(oldFilters || {}).length > 0) {
            await prisma.savedView.update({
              where: { id: properDefault.id },
              data: { filters: oldFilters }
            })
            console.log(`Merged filters from "${view.name}" into Default view for project ${view.projectId}`)
            merged++
          }
          
          // Delete the duplicate view
          await prisma.savedView.delete({
            where: { id: view.id }
          })
          console.log(`Deleted duplicate view "${view.name}" (ID: ${view.id})`)
          deleted++
        } else {
          // Rename this view to "Default" since no proper default exists
          await prisma.savedView.update({
            where: { id: view.id },
            data: { name: 'Default' }
          })
          console.log(`Renamed "${view.name}" to "Default" for project ${view.projectId}`)
        }
      } catch (error: any) {
        console.error(`Error processing view ${view.id} ("${view.name}"):`, error.message)
        errors++
      }
    }

    console.log('\nCleanup complete!')
    console.log(`Merged: ${merged}`)
    console.log(`Deleted: ${deleted}`)
    console.log(`Renamed: ${viewsWithProjectId.length - merged - deleted - errors}`)
    console.log(`Errors: ${errors}`)

  } catch (error) {
    console.error('Cleanup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run cleanup
cleanup()
  .then(() => {
    console.log('Cleanup script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error)
    process.exit(1)
  })

