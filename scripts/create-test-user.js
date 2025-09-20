#!/usr/bin/env node

/**
 * Create Test User Script
 * Creates a test user for webhook testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        // Check if test user already exists
        const existingUser = await prisma.user.findUnique({
            where: { id: 'quick-test-user' }
        });

        if (existingUser) {
            console.log('✅ Test user already exists:', existingUser.email);
            return;
        }

        // Create test user
        const testUser = await prisma.user.create({
            data: {
                id: 'quick-test-user',
                email: 'test@example.com',
                name: 'Test User',
                // Add other required fields based on your schema
            }
        });

        console.log('✅ Test user created successfully:', testUser);
    } catch (error) {
        console.error('❌ Error creating test user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
