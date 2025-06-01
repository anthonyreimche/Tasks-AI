const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url);
  
  // Extract the pathname
  let pathname = `.${parsedUrl.pathname}`;
  
  // If path ends with '/', serve index.html
  if (pathname === './') {
    pathname = './index.html';
  }
  
  // Get the file extension
  const ext = path.extname(pathname);
  
  // Maps file extension to MIME type
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Read file from filesystem
  fs.readFile(pathname, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If the requested file doesn't exist, try to serve index.html
        // This helps with SPA routing
        fs.readFile('./index.html', (err, content) => {
          if (err) {
            // If index.html doesn't exist either, return 404
            res.writeHead(404);
            res.end('404 Not Found');
            return;
          }
          
          // Serve index.html
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // For other errors, return 500
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    // If file exists, serve it with proper content type
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data, 'utf-8');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────┐
  │                                               │
  │   Tasks AI Server                             │
  │                                               │
  │   Server running at: http://localhost:${PORT}    │
  │                                               │
  │   Press Ctrl+C to stop the server             │
  │                                               │
  └───────────────────────────────────────────────┘
  `);
});
