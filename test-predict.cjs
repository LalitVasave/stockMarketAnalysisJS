const http = require('http');

function postApi(path, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': data.length };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost', port: 3000,
      path: path, method: 'POST', headers
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  try {
    // 1. Register Mock
    const r = await postApi('/api/register', null, { email: 'pe' + Date.now() + '@t.com', password: 'P' });
    const auth = JSON.parse(r.body);
    
    // 2. Predict
    const p = await postApi('/api/predict', auth.token, { asset: 'BTC / USD', model: 'LSTM', confidence: 92, days: 30 });
    console.log("Prediction Complete:");
    console.log("Status:", p.status);
    console.log("Body:", p.body.substring(0, 500));
  } catch (err) {
    console.error("Test failed", err);
  }
}
test();
