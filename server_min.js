const express = require('express');
const app = express();
console.log('--- MINIMAL DIAGNOSTIC SERVER ---');
app.get('/api/test', (req, res) => res.json({ status: 'online', diagnostic: true }));
app.listen(3000, () => {
    console.log('DIAGNOSTIC SERVER RUNNING ON PORT 3000');
});
