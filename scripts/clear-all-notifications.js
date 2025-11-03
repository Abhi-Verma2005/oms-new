#!/usr/bin/env node

/**
 * Clear all notifications and user notification reads from the database
 * Usage: node scripts/clear-all-notifications.js
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function clearAllNotifications() {
  console.log('🗑️  Clear All Notifications Script');
  console.log('=====================================\n');

  try {
    // Count existing records
    const notificationCount = await prisma.notification.count();
    const readCount = await prisma.userNotificationRead.count();

    console.log(`📊 Current database state:`);
    console.log(`   - Notifications: ${notificationCount}`);
    console.log(`   - User notification reads: ${readCount}\n`);

    if (notificationCount === 0 && readCount === 0) {
      console.log('✅ Database is already empty. Nothing to clear.');
      process.exit(0);
    }

    // Ask for confirmation
    const answer = await question('⚠️  Are you sure you want to delete ALL notifications and user reads? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Operation cancelled.');
      process.exit(0);
    }

    console.log('\n🗑️  Starting deletion...\n');

    // Delete user notification reads first (they have foreign key to notifications)
    console.log('1. Deleting user notification reads...');
    const deletedReads = await prisma.userNotificationRead.deleteMany({});
    console.log(`   ✅ Deleted ${deletedReads.count} user notification reads`);

    // Delete all notifications (this will cascade delete reads, but we already deleted them)
    console.log('2. Deleting all notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);

    // Verify deletion
    const remainingNotifications = await prisma.notification.count();
    const remainingReads = await prisma.userNotificationRead.count();

    console.log('\n📊 Final database state:');
    console.log(`   - Notifications: ${remainingNotifications}`);
    console.log(`   - User notification reads: ${remainingReads}`);

    if (remainingNotifications === 0 && remainingReads === 0) {
      console.log('\n✅ Successfully cleared all notifications and user reads!');
    } else {
      console.log('\n⚠️  Warning: Some records may still exist.');
    }

  } catch (error) {
    console.error('\n❌ Error clearing notifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

clearAllNotifications();

