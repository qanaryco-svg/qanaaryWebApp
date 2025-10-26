const express = require('express');
const app = express();
const port = 3002;

app.get('/', (req, res) => {
  res.send('Hello from Express Test Server');
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Express test server listening at http://127.0.0.1:${port}`);
});