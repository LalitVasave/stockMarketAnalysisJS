const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss =cd  new WebSocket.Server({ server });

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Simulation Variables
let currentPrice = 500.00; // Starting price for our mock stock
const historyLength = 20;   // Length of the Moving Average
const priceHistory = [];    // Array to hold recent prices for MA calculation
let lastTimestamp = Math.floor(Date.now() / 1000);

// Seed initial history so we can calculate an immediate moving average
for (let i = 0; i < historyLength; i++) {
    priceHistory.push(currentPrice);
}

// Helper to calculate Simple Moving Average
function calculateSMA(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
}

// The core Simulation Engine
function generateTick() {
    // Random walk: Price goes up or down by max 0.5%
    const volatility = 0.005; // 0.5%
    const changePercent = (Math.random() * volatility * 2) - volatility;

    // Sometimes force a bigger jump (a "news event")
    const isEvent = Math.random() < 0.05; // 5% chance
    const multiplier = isEvent ? 3 : 1;

    let open = currentPrice;

    // Simulate intraday high/low (candlestick wicks)
    const tickMovement = currentPrice * changePercent * multiplier;
    let close = currentPrice + tickMovement;

    // Calculate High and Low for a realistic candle
    let high = Math.max(open, close) + (Math.random() * Math.abs(tickMovement));
    let low = Math.min(open, close) - (Math.random() * Math.abs(tickMovement));

    // Ensure prices don't go negative
    if (low < 0) low = 0.01;
    if (close < 0) close = 0.01;

    currentPrice = close; // Set for next tick

    // Update Moving Average
    priceHistory.push(close);
    if (priceHistory.length > historyLength) {
        priceHistory.shift(); // Remove oldest price
    }
    const sma = calculateSMA(priceHistory);

    // Increment timestamp (simulate 1 minute candles appearing every second)
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

// Broadcast to all connected clients
function broadcastTick() {
    const tick = generateTick();
    const dataString = JSON.stringify(tick);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataString);
        }
    });
}

// Generate a tick every 1.5 seconds
setInterval(broadcastTick, 1500);

wss.on('connection', (ws) => {
    console.log('New client connected to live feed');

    // Send initial state immediately upon connection
    const currentSMA = calculateSMA(priceHistory);
    ws.send(JSON.stringify({
        type: 'info',
        message: 'Connected to Live Trading Simulator',
        symbol: 'MOCK_SPY',
        currentPrice: currentPrice,
        currentSMA: currentSMA
    }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Live Stock Market Analysis Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server attached.`);
});
