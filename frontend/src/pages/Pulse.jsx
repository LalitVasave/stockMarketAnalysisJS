import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import HeatmapView from '../components/HeatmapView';
import Navbar from '../components/Navbar';
import SentimentFeed from '../components/SentimentFeed';
import SidebarFilters from '../components/SidebarFilters';
import StockCard from '../components/StockCard';
import StockModal from '../components/StockModal';
import TickerStrip from '../components/TickerStrip';
import { useMarketSocket } from '../hooks/useMarketSocket';
import { marketStore, useMarketStore } from '../store/marketStore';

const viewOptions = ['grid', 'table', 'heatmap'];

export default function Pulse() {
  useMarketSocket();

  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('grid');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [oiFilter, setOiFilter] = useState('All');
  const [signalFilter, setSignalFilter] = useState('All');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);

  const overview = useMarketStore((state) => state.overview);
  const ticks = useMarketStore((state) => state.ticks);
  const analyses = useMarketStore((state) => state.analyses);
  const sentimentFeed = useMarketStore((state) => state.sentimentFeed);
  const watchlist = useMarketStore((state) => state.watchlist);
  const selectedAnalysis = useMarketStore((state) => (selectedSymbol ? state.analyses[selectedSymbol] : null));

  useEffect(() => {
    marketStore.hydrateOverview();
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('/api/uploads', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        setUploadHistory(await response.json());
      } catch (error) {
        console.warn('Upload history unavailable', error);
      }
    }

    fetchHistory();
  }, []);

  const sectors = useMemo(() => ['All', ...new Set(overview.stocks.map((stock) => stock.sector))], [overview.stocks]);

  const filteredStocks = useMemo(() => {
    return overview.stocks
      .map((stock) => {
        const tick = ticks[stock.symbol];
        const analysis = analyses[stock.symbol] || stock;
        return {
          ...stock,
          ...analysis,
          live: tick ? { ...stock.price, ...tick } : stock.price,
        };
      })
      .filter((stock) => {
        if (watchlistOnly && !watchlist.includes(stock.symbol)) return false;
        if (sectorFilter !== 'All' && stock.sector !== sectorFilter) return false;
        if (oiFilter !== 'All' && stock.positioning?.oi_state !== oiFilter) return false;
        if (signalFilter !== 'All' && stock.prediction?.direction !== signalFilter) return false;
        return true;
      });
  }, [overview.stocks, ticks, analyses, watchlistOnly, watchlist, sectorFilter, oiFilter, signalFilter]);

  const userName = localStorage.getItem('userName') || 'Analyst';

  return (
    <main className="terminal-shell relative flex h-screen flex-1 flex-col overflow-hidden bg-[var(--bg)]">
      <div className="scanline-overlay pointer-events-none" />
      <div className="app-grid-bg pointer-events-none" />

      <Navbar />
      <TickerStrip indices={overview.indices} />

      <div className="flex flex-1 overflow-hidden">
        <SidebarFilters
          sectors={sectors}
          sectorFilter={sectorFilter}
          setSectorFilter={setSectorFilter}
          oiFilter={oiFilter}
          setOiFilter={setOiFilter}
          signalFilter={signalFilter}
          setSignalFilter={setSignalFilter}
          watchlistOnly={watchlistOnly}
          setWatchlistOnly={setWatchlistOnly}
        />

        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4 md:px-6">
          <section className="hero-panel mb-4 rounded-[28px] border border-[rgba(0,212,255,0.18)] p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="terminal-eyebrow">Added Without Replacing OG Pages</p>
                <h1 className="font-display text-3xl text-white md:text-5xl">NSE Pulse</h1>
                <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)] md:text-base">
                  The original project pages are restored. This terminal now lives as a separate route inside the existing app.
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
                <div className="hero-metric">
                  <span className="hero-label">Tracked Symbols</span>
                  <strong>{overview.stocks.length.toString().padStart(2, '0')}</strong>
                </div>
                <div className="hero-metric">
                  <span className="hero-label">Live Accuracy</span>
                  <strong>72.4%</strong>
                </div>
                <div className="hero-metric">
                  <span className="hero-label">Recent Pipelines</span>
                  <strong>{String(uploadHistory.length).padStart(2, '0')}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-4 flex flex-col gap-3 rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.86)] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="terminal-eyebrow">Command Surface</p>
              <h2 className="font-display text-xl text-white">Live Opportunity Matrix</h2>
            </div>
            <div className="inline-flex rounded-full border border-[rgba(0,212,255,0.18)] bg-[rgba(2,8,16,0.95)] p-1">
              {viewOptions.map((view) => (
                <button
                  key={view}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition ${
                    activeView === view
                      ? 'bg-[linear-gradient(90deg,rgba(0,212,255,0.18),rgba(0,255,136,0.15))] text-white shadow-[0_0_18px_rgba(0,212,255,0.2)]'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </button>
              ))}
            </div>
          </section>

          {activeView === 'grid' && (
            <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  watched={watchlist.includes(stock.symbol)}
                  onOpen={() => setSelectedSymbol(stock.symbol)}
                  onToggleWatch={() => marketStore.toggleWatchlist(stock.symbol)}
                />
              ))}
            </section>
          )}

          {activeView === 'table' && (
            <section className="overflow-hidden rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.92)] text-left text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-5 py-4">Symbol</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Change</th>
                      <th className="px-5 py-4">OI State</th>
                      <th className="px-5 py-4">Signal</th>
                      <th className="px-5 py-4">Confidence</th>
                      <th className="px-5 py-4">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="cursor-pointer border-b border-[rgba(13,31,45,0.9)] text-sm transition hover:bg-[rgba(0,212,255,0.05)]"
                        onClick={() => setSelectedSymbol(stock.symbol)}
                      >
                        <td className="px-5 py-4 font-display text-white">
                          <div>{stock.symbol}</div>
                          <div className="mt-1 text-xs text-[var(--text-muted)]">{stock.company}</div>
                        </td>
                        <td className="px-5 py-4 font-data text-white">{(stock.live?.ltp ?? stock.price?.ltp ?? 0).toFixed(2)}</td>
                        <td className={`px-5 py-4 font-data ${(stock.live?.change_pct ?? 0) >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
                          {(stock.live?.change_pct ?? 0) >= 0 ? '+' : ''}
                          {(stock.live?.change_pct ?? stock.price?.change_pct ?? 0).toFixed(2)}%
                        </td>
                        <td className="px-5 py-4">
                          <span className={`oi-badge oi-${stock.positioning?.oi_state}`}>{stock.positioning?.oi_state?.replaceAll('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-4 capitalize text-white">{stock.prediction?.direction}</td>
                        <td className="px-5 py-4">
                          <div className="h-2 w-full max-w-[180px] overflow-hidden rounded-full bg-[rgba(13,31,45,0.95)]">
                            <div className="confidence-glow h-full rounded-full bg-[var(--pulse)]" style={{ width: `${(stock.prediction?.vix_discounted_confidence ?? 0.5) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-4 font-data text-[var(--text-muted)]">{stock.sentiment?.score?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeView === 'heatmap' && <HeatmapView stocks={filteredStocks} onOpen={setSelectedSymbol} />}

          <section className="mt-5 rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.88)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="terminal-eyebrow">Existing Feature Preserved</p>
                <h3 className="font-display text-lg text-white">Recent Data Pipelines</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3">Resource Name</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Data Points</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.length > 0 ? uploadHistory.map((upload) => (
                    <tr
                      key={upload.id}
                      className="cursor-pointer border-t border-[rgba(13,31,45,0.9)] text-sm hover:bg-[rgba(0,212,255,0.04)]"
                      onClick={() => navigate('/prediction', {
                        state: {
                          historicalPrediction: upload.prediction,
                          filename: upload.filename,
                          rows: upload.rowsProcessed,
                          timestamp: upload.createdAt || upload.timestamp,
                        },
                      })}
                    >
                      <td className="px-4 py-4 text-white">{upload.filename}</td>
                      <td className="px-4 py-4 text-[var(--text-muted)]">{upload.createdAt || upload.timestamp}</td>
                      <td className="px-4 py-4">
                        <span className="status-badge border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.08)] text-[var(--bull)]">Ready</span>
                      </td>
                      <td className="px-4 py-4 text-right font-data text-white">{upload.rowsProcessed?.toLocaleString?.() ?? upload.rowsProcessed}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No data pipelines processed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <SentimentFeed items={sentimentFeed} />
        </div>
      </div>

      <StockModal symbol={selectedSymbol} analysis={selectedAnalysis} onClose={() => setSelectedSymbol(null)} />
    </main>
  );
}
