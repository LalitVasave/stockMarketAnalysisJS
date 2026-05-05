const http = require('http');
const WebSocket = require('ws');

const port = Number(process.env.PORT || 8080);
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const symbols = [
  { symbol: 'RELIANCE', ltp: 2847.5, change_pct: 1.23, direction: 'bullish', oi_state: 'long_buildup', confidence: 0.73, regime: 'bull', sentiment_score: 0.42, volume: 2481000 },
  { symbol: 'HDFCBANK', ltp: 1628.35, change_pct: 0.84, direction: 'bullish', oi_state: 'long_buildup', confidence: 0.68, regime: 'bull', sentiment_score: 0.27, volume: 1930000 },
  { symbol: 'ICICIBANK', ltp: 1194.8, change_pct: -0.62, direction: 'bearish', oi_state: 'short_buildup', confidence: 0.66, regime: 'sideways', sentiment_score: -0.11, volume: 1540000 },
  { symbol: 'INFY', ltp: 1492.1, change_pct: 1.88, direction: 'bullish', oi_state: 'short_covering', confidence: 0.79, regime: 'bull', sentiment_score: 0.35, volume: 1120000 },
  { symbol: 'TCS', ltp: 3842.55, change_pct: -1.16, direction: 'bearish', oi_state: 'short_buildup', confidence: 0.71, regime: 'bear', sentiment_score: -0.18, volume: 610000 },
  { symbol: 'SBIN', ltp: 812.9, change_pct: 2.32, direction: 'bullish', oi_state: 'short_covering', confidence: 0.82, regime: 'bull', sentiment_score: 0.52, volume: 3230000 },
];

function pushSnapshot(ws) {
  ws.send(JSON.stringify({
    type: 'snapshot',
    vix: 16.8,
    marketStatus: 'open',
    ticks: symbols,
  }));
}

function fluctuate(symbol) {
  const directionBias = symbol.direction === 'bullish' ? 1 : -1;
  const drift = (Math.random() - 0.45) * 0.35 * directionBias;
  symbol.change_pct = Number((symbol.change_pct + drift / 10).toFixed(2));
  symbol.ltp = Number((symbol.ltp * (1 + (drift / 1000))).toFixed(2));
  symbol.confidence = Number(Math.max(0.42, Math.min(0.9, symbol.confidence + (Math.random() - 0.5) * 0.03)).toFixed(2));
  symbol.volume += Math.round(Math.random() * 50000);
  return symbol;
}

wss.on('connection', (ws) => {
  pushSnapshot(ws);
});

setInterval(() => {
  const time = new Date().toISOString();
  symbols.forEach((symbol) => {
    const tick = fluctuate(symbol);
    const payload = JSON.stringify({
      type: 'tick',
      symbol: tick.symbol,
      ts: time,
      ...tick,
      vix_discounted_confidence: tick.confidence,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  const vix = Number((16.8 + (Math.random() - 0.5) * 0.8).toFixed(2));
  const vixPayload = JSON.stringify({ type: 'vix', vix, ts: time });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(vixPayload);
    }
  });
}, 2000);

server.listen(port, () => {
  console.log(`NSE Pulse gateway listening on ${port}`);
});
