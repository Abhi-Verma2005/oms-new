#!/usr/bin/env node

/**
 * Test script to verify the complete notification flow
 * 1. Test WebSocket server health
 * 2. Test WebSocket connection
 * 3. Test notification broadcast
 * 4. Test admin API
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8000;
const BASE_URL = `http://localhost:${PORT}`;
const WS_URL = `ws://localhost:${PORT}`;

console.log('🧪 Testing Complete Notification Flow...');
console.log(`📡 WebSocket Server: ${BASE_URL}`);
console.log(`🔌 WebSocket URL: ${WS_URL}/api/notifications/ws`);
console.log('='.repeat(60));

// Test 1: WebSocket Server Health
console.log('\n1️⃣ Testing WebSocket Server Health...');
const healthReq = http.get(`${BASE_URL}/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ WebSocket Server Status:', {
        status: result.status,
        connectedClients: result.connectedClients,
        adminClients: result.adminClients
      });
      
      // Test 2: WebSocket Connection
      testWebSocketConnection();
    } catch (error) {
      console.log('❌ Health Check Failed:', error.message);
    }
  });
});

healthReq.on('error', (error) => {
  console.log('❌ Health Check Error:', error.message);
  console.log('💡 Make sure the WebSocket server is running:');
  console.log('   cd websocket-server && npm start');
});

function testWebSocketConnection() {
  console.log('\n2️⃣ Testing WebSocket Connection...');
  const ws = new WebSocket(`${WS_URL}/api/notifications/ws`);

  ws.on('open', () => {
    console.log('✅ WebSocket Connected Successfully');
    
    // Authenticate as a regular user
    ws.send(JSON.stringify({
      type: 'authenticate',
      userId: 'test-user-123',
      isAdmin: false
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 WebSocket Message:', {
        type: message.type,
        clientId: message.clientId,
        userId: message.userId
      });
      
      if (message.type === 'authenticated') {
        console.log('✅ WebSocket Authentication Successful');
        // Test 3: Send test notification
        testNotificationBroadcast();
      }
    } catch (error) {
      console.log('❌ WebSocket Message Parse Error:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('✅ WebSocket Connection Closed');
  });

  ws.on('error', (error) => {
    console.log('❌ WebSocket Error:', error.message);
  });
}

function testNotificationBroadcast() {
  console.log('\n3️⃣ Testing Notification Broadcast...');
  
  const testNotification = {
    id: 'test-' + Date.now(),
    title: 'Test Notification',
    body: 'This is a test notification from the test script',
    isGlobal: true,
    targetUserIds: [],
    priority: 'NORMAL',
    type: {
      id: 'test-type',
      name: 'test',
      displayName: 'Test',
      icon: '🔔',
      color: '#3B82F6'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const broadcastData = JSON.stringify({ notification: testNotification });

  const broadcastReq = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/broadcast',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(broadcastData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('✅ Broadcast Response:', result);
        
        if (result.success) {
          console.log('\n🎉 Notification Flow Test Complete!');
          console.log('📋 Summary:');
          console.log('   ✅ WebSocket server is running');
          console.log('   ✅ WebSocket connection established');
          console.log('   ✅ User authentication working');
          console.log('   ✅ Notification broadcast successful');
          console.log('\n💡 Next Steps:');
          console.log('   1. Start your main app: cd oms && npm run dev');
          console.log('   2. Login as a user');
          console.log('   3. Open admin panel: /admin/notifications');
          console.log('   4. Create and send a notification');
          console.log('   5. Check if notification appears in user\'s dropdown');
        } else {
          console.log('❌ Broadcast failed:', result.message);
        }
      } catch (error) {
        console.log('❌ Broadcast Response Parse Error:', error.message);
      }
    });
  });

  broadcastReq.on('error', (error) => {
    console.log('❌ Broadcast Error:', error.message);
  });

  broadcastReq.write(broadcastData);
  broadcastReq.end();
}

// Test 4: Admin API Test (if main app is running)
console.log('\n4️⃣ Testing Admin API (if main app is running)...');
const adminReq = http.get('http://localhost:3000/api/admin/notifications', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Admin API is accessible');
    } else if (res.statusCode === 401) {
      console.log('⚠️ Admin API requires authentication (expected)');
    } else {
      console.log('❌ Admin API Error:', res.statusCode);
    }
  });
});

adminReq.on('error', (error) => {
  console.log('⚠️ Admin API not accessible (main app not running)');
  console.log('💡 Start main app with: cd oms && npm run dev');
});
