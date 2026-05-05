import { useEffect } from 'react';
import { marketStore } from '../store/marketStore';

import { WS_URL } from '../config';

function startLocalFallback() {
  const symbols = ['RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY', 'TCS', 'SBIN', 'LT', 'TATAMOTORS'];
  return window.setInterval(() => {
    symbols.forEach((symbol, index) => {
      const previous = marketStore.getState().ticks[symbol]?.ltp || 500 + (index * 10);
      const drift = (Math.random() - 0.5) * 8;
      marketStore.updateTick(symbol, {
        ltp: Number((previous + drift).toFixed(2)),
        change_pct: Number(((Math.random() - 0.4) * 3).toFixed(2)),
        direction: drift >= 0 ? 'bullish' : 'bearish',
        oi_state: drift >= 0 ? 'long_buildup' : 'short_buildup',
        confidence: Number((0.58 + Math.random() * 0.26).toFixed(2)),
        sentiment_score: Number(((Math.random() - 0.5) * 0.9).toFixed(2)),
        regime: drift >= 3 ? 'bull' : drift <= -3 ? 'bear' : 'sideways',
        vix_discounted_confidence: Number((0.58 + Math.random() * 0.22).toFixed(2)),
      });
    });
    marketStore.setVix(Number((16.8 + (Math.random() - 0.5)).toFixed(2)));
  }, 2200);
}

export function useMarketSocket() {
  useEffect(() => {
    let ws;
    let fallbackTimer;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'snapshot') {
          marketStore.setSnapshot(message);
          return;
        }
        if (message.type === 'tick') {
          marketStore.updateTick(message.symbol, message);
          return;
        }
        if (message.type === 'vix') {
          marketStore.setVix(message.vix);
        }
      };

      ws.onopen = () => {
        if (fallbackTimer) {
          window.clearInterval(fallbackTimer);
          fallbackTimer = undefined;
        }
      };

      ws.onclose = () => {
        if (!fallbackTimer) fallbackTimer = startLocalFallback();
        reconnectTimer = window.setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (fallbackTimer) window.clearInterval(fallbackTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, []);
}
