const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// WebSocket URL utility function
function getWebSocketUrl() {
  return process.env.WEBSOCKET_URL || 'ws://localhost:8000';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.WS_PORT || 8000;

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

      // WebSocket connections are now handled by the independent ws-server
      // Redirect WebSocket requests to the WebSocket server
      if (pathname === '/api/notifications/ws') {
        const wsUrl = getWebSocketUrl();
        console.log('🔌 WebSocket connection attempt - redirecting to independent ws-server');
        res.writeHead(302, {
          'Location': `${wsUrl}${pathname}`
        });
        res.end();
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket server is now independent and runs separately

  server
    .once('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      const wsUrl = getWebSocketUrl();
      console.log('🎉 Next.js server started successfully!');
      console.log(`🌐 HTTP Server: http://${hostname}:${port}`);
      console.log('📝 Note: WebSocket server runs independently');
      console.log(`🔌 WebSocket Endpoint: ${wsUrl}/api/notifications/ws`);
      console.log('='.repeat(60));
    });
});
