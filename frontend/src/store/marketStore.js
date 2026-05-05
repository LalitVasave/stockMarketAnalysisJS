import { useSyncExternalStore } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const fallbackStocks = [
  {
    symbol: 'RELIANCE',
    company: 'Reliance Industries',
    sector: 'Energy',
    price: { ltp: 2847.5, change_pct: 1.23 },
    positioning: { oi_state: 'long_buildup' },
    prediction: { direction: 'bullish', vix_discounted_confidence: 0.73 },
    sentiment: { score: 0.42 },
  },
  {
    symbol: 'HDFCBANK',
    company: 'HDFC Bank',
    sector: 'Banking',
    price: { ltp: 1628.35, change_pct: 0.84 },
    positioning: { oi_state: 'long_buildup' },
    prediction: { direction: 'bullish', vix_discounted_confidence: 0.68 },
    sentiment: { score: 0.27 },
  },
  {
    symbol: 'ICICIBANK',
    company: 'ICICI Bank',
    sector: 'Banking',
    price: { ltp: 1194.8, change_pct: -0.62 },
    positioning: { oi_state: 'short_buildup' },
    prediction: { direction: 'bearish', vix_discounted_confidence: 0.66 },
    sentiment: { score: -0.11 },
  },
  {
    symbol: 'INFY',
    company: 'Infosys',
    sector: 'IT',
    price: { ltp: 1492.1, change_pct: 1.88 },
    positioning: { oi_state: 'short_covering' },
    prediction: { direction: 'bullish', vix_discounted_confidence: 0.79 },
    sentiment: { score: 0.35 },
  },
  {
    symbol: 'TCS',
    company: 'TCS',
    sector: 'IT',
    price: { ltp: 3842.55, change_pct: -1.16 },
    positioning: { oi_state: 'short_buildup' },
    prediction: { direction: 'bearish', vix_discounted_confidence: 0.71 },
    sentiment: { score: -0.18 },
  },
  {
    symbol: 'SBIN',
    company: 'State Bank of India',
    sector: 'PSU Bank',
    price: { ltp: 812.9, change_pct: 2.32 },
    positioning: { oi_state: 'short_covering' },
    prediction: { direction: 'bullish', vix_discounted_confidence: 0.82 },
    sentiment: { score: 0.52 },
  },
  {
    symbol: 'LT',
    company: 'Larsen & Toubro',
    sector: 'Infrastructure',
    price: { ltp: 3710.25, change_pct: 0.42 },
    positioning: { oi_state: 'long_buildup' },
    prediction: { direction: 'bullish', vix_discounted_confidence: 0.63 },
    sentiment: { score: 0.16 },
  },
  {
    symbol: 'TATAMOTORS',
    company: 'Tata Motors',
    sector: 'Auto',
    price: { ltp: 986.4, change_pct: -1.94 },
    positioning: { oi_state: 'short_buildup' },
    prediction: { direction: 'bearish', vix_discounted_confidence: 0.76 },
    sentiment: { score: -0.33 },
  },
];

const initialState = {
  overview: { indices: [], stocks: fallbackStocks },
  ticks: {},
  analyses: {},
  sentimentFeed: [],
  vix: 16.8,
  marketStatus: 'open',
  watchlist: ['RELIANCE', 'INFY', 'SBIN'],
};

let state = initialState;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

async function safeJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

const actions = {
  async hydrateOverview() {
    try {
      const overview = await safeJson(`${API_BASE_URL}/api/market/overview`);
      const analyses = Object.fromEntries(overview.stocks.map((stock) => [stock.symbol, stock]));
      setState((current) => ({ ...current, overview, analyses, sentimentFeed: overview.sentiment_feed || [] }));
    } catch (error) {
      console.warn('Using terminal fallback overview.', error);
      const fallback = {
        indices: [
          { name: 'Nifty 50', value: 22541.2, change_pct: 0.82 },
          { name: 'Bank Nifty', value: 48772.4, change_pct: 1.18 },
          { name: 'Sensex', value: 74108.5, change_pct: 0.69 },
        ],
        stocks: fallbackStocks,
        sentiment_feed: [
          { symbol: 'RELIANCE', headline: 'Fallback feed active: backend unreachable, using local simulation.', score: 0.18 },
        ],
      };
      const analyses = Object.fromEntries(fallbackStocks.map((stock) => [stock.symbol, stock]));
      setState((current) => ({ ...current, overview: fallback, analyses, sentimentFeed: fallback.sentiment_feed }));
    }
  },

  async loadAnalysis(symbol) {
    if (!symbol || state.analyses[symbol]?.prediction_history) return;
    try {
      const analysis = await safeJson(`${API_BASE_URL}/api/stock/${symbol}/analysis`);
      setState((current) => ({
        ...current,
        analyses: { ...current.analyses, [symbol]: analysis },
      }));
    } catch (error) {
      console.warn(`Analysis fetch failed for ${symbol}.`, error);
    }
  },

  updateTick(symbol, payload) {
    setState((current) => ({
      ...current,
      ticks: { ...current.ticks, [symbol]: payload },
    }));
  },

  setSnapshot(snapshot) {
    const nextTicks = Object.fromEntries(snapshot.ticks.map((tick) => [tick.symbol, tick]));
    setState((current) => ({
      ...current,
      ticks: nextTicks,
      vix: snapshot.vix ?? current.vix,
      marketStatus: snapshot.marketStatus ?? current.marketStatus,
    }));
  },

  setVix(vix) {
    setState((current) => ({ ...current, vix }));
  },

  toggleWatchlist(symbol) {
    setState((current) => ({
      ...current,
      watchlist: current.watchlist.includes(symbol)
        ? current.watchlist.filter((item) => item !== symbol)
        : [...current.watchlist, symbol],
    }));
  },
};

export function useMarketStore(selector = (snapshot) => snapshot) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
}

export const marketStore = {
  getState: getSnapshot,
  ...actions,
};
