const http = require('http');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test Tester'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('HTTP', res.statusCode, body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
