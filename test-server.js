const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Test Server Running on Port 3001</h1>');
});

server.listen(3001, 'localhost', () => {
    console.log('Server running at http://localhost:3001/');
});