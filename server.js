const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { notificationWebSocketServer } = require('./ws-server/src/websocket-server.js');

// WebSocket URL utility function
function getWebSocketUrl() {
  return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000; // Use standard Next.js port for development

console.log('🚀 Starting Next.js server...');
console.log(`📡 Environment: ${dev ? 'development' : 'production'}`);
console.log(`🌐 Hostname: ${hostname}`);
console.log(`🔌 Port: ${port}`);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port, turbo: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js app prepared successfully');
  
  const server = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Log all incoming requests
      console.log(`📥 ${req.method} ${pathname} - ${new Date().toISOString()}`);

      // Handle WebSocket upgrade requests
      if (pathname === '/api/notifications/ws') {
        console.log('🔌 WebSocket connection attempt detected');
        console.log('📋 Headers:', {
          upgrade: req.headers.upgrade,
          connection: req.headers.connection,
          'sec-websocket-key': req.headers['sec-websocket-key'],
          'sec-websocket-version': req.headers['sec-websocket-version']
        });
        
        // Handle WebSocket upgrade
        if (req.headers.upgrade !== 'websocket') {
          console.log('❌ WebSocket upgrade failed - not a websocket request');
          res.writeHead(400);
          res.end('Expected WebSocket upgrade');
          return;
        }
        
        console.log('✅ WebSocket upgrade request validated, passing to WebSocket server');
        // The WebSocket server will handle this
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Set up WebSocket server on the same server
  console.log('🔧 Setting up WebSocket server...');
  notificationWebSocketServer.createWebSocketServer(server);
  console.log('✅ WebSocket server configured');

  server
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      const wsUrl = getWebSocketUrl();
      console.log('🎉 Next.js server with WebSocket started successfully!');
      console.log(`🌐 HTTP Server: http://${hostname}:${port}`);
      console.log(`🔌 WebSocket Endpoint: ${wsUrl}/api/notifications/ws`);
      console.log('📊 Both HTTP and WebSocket running on the same port!');
      console.log('='.repeat(60));
    });
});
