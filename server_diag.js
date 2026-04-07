const http = require('http');
console.log('--- PURE NODE BOOT ---');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Vishleshak Engine Diagnostic: OK\n');
}).listen(3005, () => {
  console.log('DIAGNOSTIC SERVER RUNNING ON PORT 3005');
});
