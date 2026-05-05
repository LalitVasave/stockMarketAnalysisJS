const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { Worker } = require('worker_threads');
const http = require('http');
const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('--- VISHLESHAK BOOT SEQUENCE ---');
console.log('[1/5] Core modules loaded.');

const authenticateToken = require('./middleware/auth.js');
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3005;
const server = http.createServer(app);

console.log('[2/5] Creating WebSocket Server...');
const wss = new WebSocket.Server({ server });

console.log('[3/5] Starting Simulation Engine...');
// Simulation Variables
let currentPrice = 500.00;
const historyLength = 20;
const priceHistory = [];
let lastTimestamp = Math.floor(Date.now() / 1000);

for (let i = 0; i < historyLength; i++) {
    priceHistory.push(currentPrice);
}

function calculateSMA(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
}
function generateTick() {
    // Smoother random walk with volatility control
    const volatility = 0.002; // 0.2% max change per tick
    const changePercent = (Math.random() - 0.5) * 2 * volatility;
    
    const open = currentPrice;
    currentPrice = open * (1 + changePercent);
    
    // Ensure price stays positive and realistic
    if (currentPrice < 10) currentPrice = 10;
    
    const close = currentPrice;
    const high = Math.max(open, close) + (Math.random() * 0.2);
    const low = Math.min(open, close) - (Math.random() * 0.2);

    priceHistory.push(close);
    if (priceHistory.length > historyLength) priceHistory.shift();
    const sma = calculateSMA(priceHistory);
    lastTimestamp += 60;

    return {
        type: 'tick',
        symbol: 'MOCK_SPY',
        time: lastTimestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        sma: parseFloat(sma.toFixed(2))
    };
}

function broadcastTick() {
    const tick = generateTick();
    const dataString = JSON.stringify(tick);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

setInterval(broadcastTick, 1500);

wss.on('connection', (ws) => {
    console.log('New client connected to live feed');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'auth' && data.token) {
                jwt.verify(data.token, process.env.JWT_SECRET, (err, decoded) => {
                    if (!err && decoded) {
                        ws.userId = decoded.userId;
                        console.log(`WebSocket client identified as User: ${ws.userId}`);
                    }
                });
            }
        } catch (e) {
            // Silent catch for malformed frames
        }
    });

    ws.send(JSON.stringify({
        type: 'info',
        message: 'Connected to Vishleshak Live Engine',
        symbol: 'MOCK_SPY',
        currentPrice: currentPrice,
        currentSMA: calculateSMA(priceHistory)
    }));
});

function notifyUser(userId, payload) {
    const dataString = JSON.stringify(payload);
    wss.clients.forEach(client => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Health Check
app.get('/api/test', (req, res) => res.json({ status: 'online', port: PORT }));

// --- Authentication Routes ---
console.log('[4/5] Mounting API Endpoints...');
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash }
        });
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        res.json({ token, email: user.email, role: user.role });
    } catch (error) {
        console.error('Reg error:', error);
        res.status(400).json({ error: 'Registration failed. Email might already exist.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Secure Demo Access logic
        if (email === 'guest@quantai.demo' && password === 'simulation_bypass_2026') {
             const token = jwt.sign(
                { userId: 9999, role: 'USER' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );
            return res.json({ token, email: 'guest@quantai.demo', role: 'USER' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        res.json({ token, email: user.email, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Login error' });
    }
});

const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.get('/api/uploads', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === 9999) {
            // Mock history for demo user
            return res.json([
                { id: 1, filename: 'Q1_MARKET_DATA.csv', rowsProcessed: 5420, prediction: 104.22, createdAt: new Date().toISOString() },
                { id: 2, filename: 'SPY_HISTORICAL.csv', rowsProcessed: 12500, prediction: 512.45, createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]);
        }

        const history = await prisma.upload.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.post('/api/predict', authenticateToken, (req, res) => {
    const { asset = 'BTC/USD', model = 'LSTM', confidence = 80, days = 30 } = req.body;
    const basePrice = currentPrice;
    const syntheticDataset = Array.from({ length: 60 }, (_, i) => ({
        Date: new Date(Date.now() - (60 - i) * 86400000).toISOString().split('T')[0],
        Open: (basePrice * (0.98 + Math.random() * 0.04)).toFixed(2),
        Close: (basePrice * (0.98 + Math.random() * 0.04)).toFixed(2),
    }));

    console.log(`Starting Prediction Sequence for ${asset} (${syntheticDataset.length} rows)...`);
    const worker = new Worker(path.join(__dirname, 'aiWorker.js'), {
        workerData: { dataset: syntheticDataset, days: parseInt(days) }
    });

    worker.on('message', (message) => {
        if (message.status === 'complete') {
            res.json({ 
                asset, 
                model, 
                confidence: parseInt(confidence), 
                historical: syntheticDataset, // Added historical context
                predictions: message.predictions,
                metrics: message.metrics
            });
        } else if (message.status === 'error') {
            res.status(500).json({ error: 'AI processing failed', details: message.error });
        }
    });

    worker.on('error', (err) => {
        console.error('Worker error:', err);
        res.status(500).json({ error: 'Worker thread error.' });
    });
});

// --- ADMIN CONTROL ENDPOINTS ---
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        // Strict Role-Based Access Control
        if (req.user.role !== 'ADMIN') {
            console.warn(`Unauthorized Admin access attempt by UID: ${req.user.userId}`);
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { uploads: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            joined: u.createdAt,
            analysisCount: u._count.uploads,
            status: Math.random() > 0.3 ? 'Online' : 'Offline' // Visual mock for 'Live' feel
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error('Admin Fetch Error:', err);
        res.status(500).json({ error: 'Failed to access Admin restricted data' });
    }
});

app.post('/api/upload', authenticateToken, upload.single('dataset'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            fs.unlinkSync(req.file.path);
            const worker = new Worker(path.join(__dirname, 'aiWorker.js'), {
                workerData: { dataset: results }
            });
            worker.on('message', (message) => {
                if (message.status === 'complete') {
                    if (req.user.userId === 9999) {
                        // Bypass DB for demo user
                        return res.json({ message: 'Success', rowsProcessed: results.length, predictions: message.predictions, metrics: message.metrics });
                    }
                    
                    prisma.upload.create({
                        data: {
                            filename: req.file.originalname,
                            rowsProcessed: results.length,
                            prediction: message.predictions?.[0]?.predictedClose != null ? parseFloat(message.predictions[0].predictedClose) : null,
                            userId: req.user.userId
                        }
                    }).then(() => {
                        // Notify client of pipeline update
                        notifyUser(req.user.userId, { type: 'PIPELINE_UPDATED' });
                        res.json({ message: 'Success', rowsProcessed: results.length, predictions: message.predictions, metrics: message.metrics });
                    }).catch((dbErr) => {
                        console.error('DB error:', dbErr);
                        res.status(500).json({ error: 'Failed to save history' });
                    });
                } else {
                    res.status(500).json({ error: 'AI failed' });
                }
            });
        });
});

console.log('[5/5] Finalizing Server Listen...');
server.listen(PORT, () => {
    console.log(`Vishleshak Server Running on http://localhost:${PORT}`);
    console.log(`WebSocket: Connected`);
});
