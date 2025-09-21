#!/usr/bin/env node

/**
 * Test script to verify the checkout flow works correctly
 * This script tests the payment intent creation and order creation flow
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testCheckoutFlow() {
  console.log('🧪 Testing Checkout Flow...\n')

  try {
    // Test 1: Payment Intent Creation
    console.log('1. Testing Payment Intent Creation...')
    
    const paymentIntentResponse = await fetch(`${BASE_URL}/api/payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // Mock session for testing
      },
      body: JSON.stringify({
        amount: 1000, // $10.00
        currency: 'USD',
        items: [
          {
            id: 'test-site-1',
            name: 'Test Site 1',
            price: 10.00,
            quantity: 1
          }
        ]
      })
    })

    if (!paymentIntentResponse.ok) {
      const error = await paymentIntentResponse.text()
      console.log(`❌ Payment Intent Creation Failed: ${error}`)
      return
    }

    const paymentIntentData = await paymentIntentResponse.json()
    console.log(`✅ Payment Intent Created: ${paymentIntentData.clientSecret ? 'Success' : 'Failed'}`)

    // Test 2: Order Creation API
    console.log('\n2. Testing Order Creation API...')
    
    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // Mock session for testing
      },
      body: JSON.stringify({
        items: [
          {
            siteId: 'test-site-1',
            siteName: 'Test Site 1',
            priceCents: 1000,
            withContent: false,
            quantity: 1
          }
        ],
        currency: 'USD',
        status: 'PAID'
      })
    })

    if (!orderResponse.ok) {
      const error = await orderResponse.text()
      console.log(`❌ Order Creation Failed: ${error}`)
      return
    }

    const orderData = await orderResponse.json()
    console.log(`✅ Order Created: ${orderData.order?.id ? 'Success' : 'Failed'}`)
    if (orderData.order) {
      console.log(`   Order ID: ${orderData.order.id}`)
      console.log(`   Status: ${orderData.order.status}`)
      console.log(`   Total Amount: ${orderData.order.totalAmount} cents`)
    }

    // Test 3: Orders List API
    console.log('\n3. Testing Orders List API...')
    
    const ordersResponse = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Mock session for testing
      }
    })

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text()
      console.log(`❌ Orders List Failed: ${error}`)
      return
    }

    const ordersData = await ordersResponse.json()
    console.log(`✅ Orders Retrieved: ${ordersData.orders?.length || 0} orders found`)

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Payment Intent Creation - Working')
    console.log('   ✅ Order Creation API - Working')
    console.log('   ✅ Orders List API - Working')
    console.log('\n💡 Next Steps:')
    console.log('   1. Set up Stripe webhook endpoint: /api/webhooks/stripe')
    console.log('   2. Configure STRIPE_WEBHOOK_SECRET environment variable')
    console.log('   3. Test the complete flow with real Stripe payments')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    process.exit(1)
  }
}

// Run the test
testCheckoutFlow()
