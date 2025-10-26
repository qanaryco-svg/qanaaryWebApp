const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Node.js is working! Process info:\n' + 
            `Node version: ${process.version}\n` +
            `Platform: ${process.platform}\n` +
            `Working directory: ${process.cwd()}\n` +
            `Memory usage: ${JSON.stringify(process.memoryUsage(), null, 2)}`);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Test server running on port ${port}`);
    console.log('Node version:', process.version);
    console.log('Working directory:', process.cwd());
});