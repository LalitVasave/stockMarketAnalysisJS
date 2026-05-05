import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import ConfidenceGauge from './ConfidenceGauge';
import OIHistoryPanel from './OIHistoryPanel';
import StockChart from './StockChart';
import { marketStore, useMarketStore } from '../store/marketStore';

function scoreBar(label, value, tone, detail) {
  const toneClass = tone === 'bull' ? 'bg-[var(--bull)]' : tone === 'bear' ? 'bg-[var(--bear)]' : 'bg-[var(--amber)]';
  return (
    <div className="rounded-[18px] border border-[rgba(0,212,255,0.08)] bg-[rgba(2,8,16,0.72)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white">{label}</span>
        <span className="font-data text-sm text-[var(--text-muted)]">{Math.round(value * 100)}%</span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[rgba(13,31,45,0.95)]">
        <div className={`confidence-glow h-full rounded-full ${toneClass}`} style={{ width: `${value * 100}%` }} />
      </div>
      <p className="text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

export default function StockModal({ symbol, analysis, onClose }) {
  const liveTick = useMarketStore((state) => (symbol ? state.ticks[symbol] : null));
  const vix = useMarketStore((state) => state.vix);

  useEffect(() => {
    if (symbol) marketStore.loadAnalysis(symbol);
  }, [symbol]);

  if (!symbol) return null;

  const current = analysis || marketStore.getState().analyses[symbol];
  const price = liveTick?.ltp ?? current?.price?.ltp;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(2,8,16,0.72)] backdrop-blur-md">
      <div className="modal-shell h-full w-full max-w-[1440px] overflow-y-auto border-l border-[rgba(0,212,255,0.16)] bg-[rgba(3,10,17,0.98)] p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="terminal-eyebrow">Deep Analysis Surface</p>
            <h2 className="font-display text-2xl text-white">{symbol}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-[rgba(0,212,255,0.14)] bg-[rgba(5,15,26,0.88)] p-3 text-[var(--pulse)]">
              <Download size={18} />
            </button>
            <button className="rounded-full border border-[rgba(255,59,92,0.18)] bg-[rgba(255,59,92,0.08)] p-3 text-[var(--bear)]" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {!current ? (
          <div className="rounded-[28px] border border-[rgba(0,212,255,0.1)] bg-[rgba(5,15,26,0.88)] p-8 shimmer-card">
            <div className="h-10 w-64 rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="mt-6 h-72 rounded-[24px] bg-[rgba(255,255,255,0.04)]" />
          </div>
        ) : (
          <div className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[1.5fr,0.9fr]">
              <div className="rounded-[28px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="terminal-eyebrow">Panel 1</p>
                    <h3 className="font-display text-xl text-white">TradingView-Style Chart</h3>
                  </div>
                  <div className="flex gap-2">
                    {['SMA20', 'EMA9', 'BB'].map((overlay) => (
                      <span key={overlay} className="rounded-full border border-[rgba(0,212,255,0.12)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        {overlay}
                      </span>
                    ))}
                  </div>
                </div>
                <StockChart symbol={symbol} livePrice={price} />
              </div>

              <div className="space-y-5 rounded-[28px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)] p-5">
                <div>
                  <p className="terminal-eyebrow">Panel 2</p>
                  <h3 className="font-display text-xl text-white">Confidence Breakdown</h3>
                </div>
                <div className="flex justify-center">
                  <ConfidenceGauge value={current.prediction?.vix_discounted_confidence} label={current.prediction?.direction} />
                </div>
                <div className="grid gap-3">
                  {scoreBar('Technical Alignment', current.confidence_breakdown?.technical_score ?? 0.71, 'bull', `RSI ${current.technical?.rsi_14} + MACD ${current.technical?.macd_hist} + BB %B ${current.technical?.bb_pct_b}`)}
                  {scoreBar('OI Positioning Alignment', current.confidence_breakdown?.oi_alignment ?? 0.82, 'bull', `${current.positioning?.oi_state?.replaceAll('_', ' ')} aligned with ${current.prediction?.direction}`)}
                  {scoreBar('FinBERT Sentiment', current.confidence_breakdown?.sentiment_score ?? 0.65, current.sentiment?.score >= 0 ? 'bull' : 'bear', `${current.sentiment?.headline_count} headlines -> ${current.sentiment?.score}`)}
                  {scoreBar('VIX Discount', Math.abs(current.confidence_breakdown?.vix_discount ?? 0.05), 'neutral', `India VIX ${vix.toFixed(2)} keeps the model in a steady regime.`)}
                </div>
                <div className={`rounded-full border px-4 py-3 text-center text-sm uppercase tracking-[0.24em] ${
                  current.prediction?.positioning_alignment === 'aligned'
                    ? 'border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.08)] text-[var(--bull)]'
                    : current.prediction?.positioning_alignment === 'divergent'
                      ? 'border-[rgba(255,59,92,0.18)] bg-[rgba(255,59,92,0.08)] text-[var(--bear)]'
                      : 'border-[rgba(255,184,0,0.18)] bg-[rgba(255,184,0,0.08)] text-[var(--amber)]'
                }`}>
                  {current.prediction?.positioning_alignment}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-[28px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)] p-5">
                <OIHistoryPanel items={current.oi_history || []} />
              </div>

              <div className="rounded-[28px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)] p-5">
                <p className="terminal-eyebrow">Panel 4</p>
                <h3 className="font-display text-xl text-white">Indicator Matrix</h3>
                <div className="mt-4 overflow-hidden rounded-[24px] border border-[rgba(0,212,255,0.08)]">
                  <table className="w-full text-sm">
                    <tbody>
                      {(current.indicators_table || []).map((row) => (
                        <tr key={row.label} className="border-b border-[rgba(13,31,45,0.9)]">
                          <td className="px-4 py-3 text-white">{row.label}</td>
                          <td className={`px-4 py-3 font-data ${row.bias === 'bullish' ? 'text-[var(--bull)]' : row.bias === 'bearish' ? 'text-[var(--bear)]' : 'text-[var(--amber)]'}`}>
                            {row.value}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{row.hint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.9)] p-5">
              <p className="terminal-eyebrow">Panel 5</p>
              <h3 className="font-display text-xl text-white">Prediction History</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Direction</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Actual Outcome</th>
                      <th className="px-4 py-3">Hit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(current.prediction_history || []).map((row) => (
                      <tr key={row.timestamp} className="border-t border-[rgba(13,31,45,0.9)]">
                        <td className="px-4 py-3 text-[var(--text-muted)]">{row.timestamp}</td>
                        <td className="px-4 py-3 capitalize text-white">{row.predicted_direction}</td>
                        <td className="px-4 py-3 font-data text-white">{Math.round(row.confidence * 100)}%</td>
                        <td className="px-4 py-3 uppercase text-[var(--text-muted)]">{row.actual_outcome}</td>
                        <td className={`px-4 py-3 font-display ${row.hit ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
                          {row.hit ? '✓' : '✗'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
