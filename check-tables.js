const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables...')
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('📊 Existing tables:')
    tables.forEach(table => console.log('  -', table.table_name))
    
    // Check if cart_items exists
    const cartTable = tables.find(t => t.table_name === 'cart_items')
    if (!cartTable) {
      console.log('❌ cart_items table missing')
      
      // Create cart_items table
      console.log('📦 Creating cart_items table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS cart_items (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      
      console.log('✅ cart_items table created')
    } else {
      console.log('✅ cart_items table exists')
    }
    
    // Check if orders table exists
    const ordersTable = tables.find(t => t.table_name === 'orders')
    if (!ordersTable) {
      console.log('❌ orders table missing')
      
      // Create orders table
      console.log('📦 Creating orders table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          total DECIMAL(10,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      
      console.log('✅ orders table created')
    } else {
      console.log('✅ orders table exists')
    }
    
    // Check if projects table exists
    const projectsTable = tables.find(t => t.table_name === 'projects')
    if (!projectsTable) {
      console.log('❌ projects table missing')
      
      // Create projects table
      console.log('📦 Creating projects table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
      
      console.log('✅ projects table created')
    } else {
      console.log('✅ projects table exists')
    }
    
    console.log('🎉 All required tables are ready!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
