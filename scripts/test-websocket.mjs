#!/usr/bin/env node

import WebSocket from 'ws';

const wsHost = process.env.WS_HOST || 'localhost:8000';
const wsUrl = `ws://${wsHost}/api/notifications/ws`;

console.log('Connecting to WebSocket server...');

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Authenticate as admin
  ws.send(JSON.stringify({
    type: 'authenticate',
    userId: 'test-admin',
    isAdmin: true
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received message:', message);
  
  if (message.type === 'notification') {
    console.log('🔔 New notification received:', message.data.title);
  }
});

ws.on('close', (code, reason) => {
  console.log(`❌ WebSocket closed: ${code} ${reason}`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep the connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

console.log('WebSocket test client running. Press Ctrl+C to exit.');
