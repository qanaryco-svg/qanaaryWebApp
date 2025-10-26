// server.js - Production server for Next.js with Passenger support
const next = require('next');
const { createServer } = require('http');

const port = parseInt(process.env.PORT || '3456', 10);
const server = next({ dev: false });
const handle = server.getRequestHandler();

server.prepare().then(() => {
  createServer((req, res) => {
    return handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
