#!/usr/bin/env node

/**
 * Test script to verify the orders page is rendering correctly
 * This script tests the orders API and data formatting
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testOrdersPage() {
  console.log('🧪 Testing Orders Page...\n')

  try {
    // Test 1: Orders API
    console.log('1. Testing Orders API...')
    
    const ordersResponse = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Mock session for testing
      }
    })

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text()
      console.log(`❌ Orders API Failed: ${error}`)
      return
    }

    const ordersData = await ordersResponse.json()
    console.log(`✅ Orders API Working: ${ordersData.orders?.length || 0} orders found`)

    if (ordersData.orders && ordersData.orders.length > 0) {
      const order = ordersData.orders[0]
      console.log(`   Sample Order:`)
      console.log(`   - ID: ${order.id}`)
      console.log(`   - Status: ${order.status}`)
      console.log(`   - Total: ${order.totalAmount} ${order.currency}`)
      console.log(`   - Items: ${order.items?.length || 0}`)
      console.log(`   - Created: ${order.createdAt}`)
    }

    // Test 2: Orders Page Rendering
    console.log('\n2. Testing Orders Page Rendering...')
    
    const pageResponse = await fetch(`${BASE_URL}/orders`, {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Mock session for testing
      }
    })

    if (!pageResponse.ok) {
      const error = await pageResponse.text()
      console.log(`❌ Orders Page Failed: ${error}`)
      return
    }

    const pageContent = await pageResponse.text()
    
    // Check for key elements
    const hasOrdersTitle = pageContent.includes('Orders')
    const hasTable = pageContent.includes('table')
    const hasOrderData = pageContent.includes('order')
    
    console.log(`✅ Orders Page Rendering:`)
    console.log(`   - Has Orders Title: ${hasOrdersTitle ? '✅' : '❌'}`)
    console.log(`   - Has Table: ${hasTable ? '✅' : '❌'}`)
    console.log(`   - Has Order Data: ${hasOrderData ? '✅' : '❌'}`)

    console.log('\n🎉 Orders page test completed!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Orders API - Working')
    console.log('   ✅ Orders Page - Rendering')
    console.log('\n💡 If you see rendering issues:')
    console.log('   1. Check browser console for JavaScript errors')
    console.log('   2. Verify CSS is loading correctly')
    console.log('   3. Check if there are any missing dependencies')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    process.exit(1)
  }
}

// Run the test
testOrdersPage()
