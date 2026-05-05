const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('redis');

const port = Number(process.env.PORT || 8080);
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379/0';
const tickStream = process.env.TICK_STREAM || 'ticks';
const streamBlockMs = Number(process.env.STREAM_BLOCK_MS || 2000);
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const latestBySymbol = new Map();
let latestVix = 16.8;

function pushSnapshot(ws) {
  const symbols = Array.from(latestBySymbol.values());
  ws.send(JSON.stringify({
    type: 'snapshot',
    vix: latestVix,
    marketStatus: 'open',
    ticks: symbols,
  }));
}

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

wss.on('connection', (ws) => {
  pushSnapshot(ws);
});

async function startStreamConsumer() {
  const redis = createClient({ url: redisUrl });
  redis.on('error', (err) => console.error('Redis error:', err));
  await redis.connect();
  console.log(`Connected to Redis at ${redisUrl}`);

  let lastId = '$';
  while (true) {
    try {
      // XREAD BLOCK <ms> STREAMS ticks <id>
      const response = await redis.xRead(
        [{ key: tickStream, id: lastId }],
        { BLOCK: streamBlockMs, COUNT: 250 }
      );

      if (!response) continue;
      for (const stream of response) {
        for (const message of stream.messages) {
          lastId = message.id;
          const fields = message.message || {};
          const symbol = fields.symbol;
          if (!symbol) continue;

          let payload = {};
          try {
            payload = fields.payload ? JSON.parse(fields.payload) : {};
          } catch {
            payload = {};
          }

          const tick = { symbol, ...payload };
          latestBySymbol.set(symbol, tick);

          broadcast({
            type: 'tick',
            symbol,
            ts: payload.ts || new Date().toISOString(),
            ...tick,
            vix_discounted_confidence: tick.vix_discounted_confidence ?? tick.confidence,
          });
        }
      }
    } catch (err) {
      console.error('Stream consume loop error:', err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function startVixPublisher() {
  const redis = createClient({ url: redisUrl });
  redis.on('error', (err) => console.error('Redis VIX client error:', err));
  await redis.connect();

  setInterval(async () => {
    try {
      const raw = await redis.get('market:vix');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.vix === 'number') latestVix = parsed.vix;
      }
    } catch {
      // keep last vix
    }
    broadcast({ type: 'vix', vix: latestVix, ts: new Date().toISOString() });
  }, 2000);
}

server.listen(port, () => {
  console.log(`NSE Pulse gateway listening on ${port}`);
});

startStreamConsumer().catch((err) => {
  console.error('Failed to start stream consumer:', err);
  process.exitCode = 1;
});

startVixPublisher().catch((err) => {
  console.error('Failed to start VIX publisher:', err);
  process.exitCode = 1;
});
