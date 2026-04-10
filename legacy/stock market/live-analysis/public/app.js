// --- 1. Initialize TradingView Lightweight Chart ---
const chartProperties = {
    layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#8c90a1',
    },
    grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
    },
};

const domElement = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(domElement, chartProperties);

// Create Candlestick Series
const candleSeries = chart.addCandlestickSeries({
    upColor: '#00d26a',
    downColor: '#f84960',
    borderDownColor: '#f84960',
    borderUpColor: '#00d26a',
    wickDownColor: '#f84960',
    wickUpColor: '#00d26a',
});

// Create Line Series for SMA (Simple Moving Average)
const smaSeries = chart.addLineSeries({
    color: '#E6A23C', // TradingView orange
    lineWidth: 2,
    crosshairMarkerVisible: false,
    priceLineVisible: false, // Don't show current price line for SMA to avoid clutter
});

// Handle Window Resize
window.addEventListener('resize', () => {
    chart.resize(domElement.clientWidth, domElement.clientHeight);
});


// --- 2. WebSocket Connection and Data Handling ---

const wsStatusEl = document.getElementById('ws-status');
const currentPriceEl = document.getElementById('current-price');
const priceChangeEl = document.getElementById('price-change');
const currentSmaEl = document.getElementById('current-sma');
const signalBadgeEl = document.getElementById('live-signal');

// Connect to the WebSocket server running on the same host
const socketUrl = 'ws://localhost:3001';
console.log("Attempting WebSocket connection to:", socketUrl);
const ws = new WebSocket(socketUrl);

let previousPrice = null;

ws.onopen = () => {
    wsStatusEl.textContent = '● LIVE FEED CONNECTED';
    wsStatusEl.classList.add('connected');
};

ws.onclose = () => {
    wsStatusEl.textContent = 'Disconnected';
    wsStatusEl.classList.remove('connected');
    wsStatusEl.style.color = '#f84960';
};

let lastChartTime = 0;

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("WS Data:", data.type, data.time || "N/A");

        if (data.type === 'info') {
            updatePriceDisplay(data.currentPrice);
            currentSmaEl.textContent = data.currentSMA.toFixed(2);

            // LightweightCharts requires data to be seeded before it can update
            lastChartTime = Math.floor(Date.now() / 1000);

            candleSeries.setData([
                { time: lastChartTime, open: data.currentPrice, high: data.currentPrice, low: data.currentPrice, close: data.currentPrice }
            ]);
            smaSeries.setData([
                { time: lastChartTime, value: data.currentSMA }
            ]);
            return;
        }

        if (data.type === 'tick') {
            // Enforce strictly incrementing time for the chart
            let tickTime = data.time;
            if (tickTime <= lastChartTime) {
                tickTime = lastChartTime + 60;
            }
            lastChartTime = tickTime;

            candleSeries.update({
                time: tickTime,
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close,
            });

            smaSeries.update({
                time: tickTime,
                value: data.sma,
            });

            updatePriceDisplay(data.close);
            currentSmaEl.textContent = data.sma.toFixed(2);
            updateTradingSignal(data.close, data.sma);
        }
    } catch (err) {
        console.error("WS Parse Error:", err);
    }
};

function updatePriceDisplay(newPrice) {
    currentPriceEl.textContent = newPrice.toFixed(2);

    // Animate color based on tick direction
    if (previousPrice !== null) {
        if (newPrice > previousPrice) {
            currentPriceEl.className = 'stat-value price up';
            // Optional: calculate percentage change for the session here
        } else if (newPrice < previousPrice) {
            currentPriceEl.className = 'stat-value price down';
        }
    }
    previousPrice = newPrice;
}

function updateTradingSignal(price, sma) {
    // A very basic crossover strategy for demonstration:
    // If price crosses highly above MA, it's a Buy signal. If below, Sell.
    const diff = price - sma;
    const diffPercent = (diff / sma) * 100;

    if (diffPercent > 0.2) { // Price >= 0.2% above SMA
        signalBadgeEl.textContent = 'BUY SIGNAL';
        signalBadgeEl.className = 'signal-badge buy';
    } else if (diffPercent < -0.2) { // Price <= 0.2% below SMA
        signalBadgeEl.textContent = 'SELL SIGNAL';
        signalBadgeEl.className = 'signal-badge sell';
    } else {
        signalBadgeEl.textContent = 'NEUTRAL';
        signalBadgeEl.className = 'signal-badge neutral';
    }
}
