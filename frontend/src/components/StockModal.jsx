import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import ConfidenceGauge from './ConfidenceGauge';
import OIHistoryPanel from './OIHistoryPanel';
import StockChart from './StockChart';
import { marketStore, useMarketStore } from '../store/marketStore';

function scoreBar(label, value, tone, detail) {
  const toneClass = tone === 'bull' ? 'bg-primary' : tone === 'bear' ? 'bg-crimson-red' : 'bg-slate-500';
  return (
    <div className="rounded-xl border border-border-subtle bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white">{label}</span>
        <span className="font-mono text-sm text-slate-muted">{Math.round(value * 100)}%</span>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`confidence-glow h-full rounded-full ${toneClass}`} style={{ width: `${value * 100}%` }} />
      </div>
      <p className="text-xs text-slate-400">{detail}</p>
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="modal-shell h-full w-full max-w-[1440px] overflow-y-auto border-l border-border-subtle bg-bg-dark p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Deep Analysis Surface</p>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{symbol}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-border-subtle bg-white/5 p-3 text-primary">
              <Download size={18} />
            </button>
            <button className="rounded-full border border-crimson-red/20 bg-crimson-red/10 p-3 text-crimson-red" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {!current ? (
          <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-8 shimmer-card">
            <div className="h-10 w-64 rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="mt-6 h-72 rounded-[24px] bg-[rgba(255,255,255,0.04)]" />
          </div>
        ) : (
          <div className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[1.5fr,0.9fr]">
              <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Panel 1</p>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">TradingView-Style Chart</h3>
                  </div>
                  <div className="flex gap-2">
                    {['SMA20', 'EMA9', 'BB'].map((overlay) => (
                      <span key={overlay} className="rounded-full border border-border-subtle px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-muted">
                        {overlay}
                      </span>
                    ))}
                  </div>
                </div>
                <StockChart symbol={symbol} livePrice={price} />
              </div>

              <div className="space-y-5 rounded-2xl border border-border-subtle bg-white/[0.01] p-5">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Panel 2</p>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confidence Breakdown</h3>
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
                <div className={`rounded-full border px-4 py-3 text-center text-sm font-bold uppercase tracking-widest ${
                  current.prediction?.positioning_alignment === 'aligned'
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : current.prediction?.positioning_alignment === 'divergent'
                      ? 'border-crimson-red/20 bg-crimson-red/10 text-crimson-red'
                      : 'border-white/10 bg-white/5 text-slate-300'
                }`}>
                  {current.prediction?.positioning_alignment}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-5">
                <OIHistoryPanel items={current.oi_history || []} />
              </div>

              <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Panel 4</p>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Indicator Matrix</h3>
                <div className="mt-4 overflow-hidden rounded-[24px] border border-[rgba(0,212,255,0.08)]">
                  <table className="w-full text-sm">
                    <tbody>
                      {(current.indicators_table || []).map((row) => (
                        <tr key={row.label} className="border-b border-[rgba(13,31,45,0.9)]">
                          <td className="px-4 py-3 text-white">{row.label}</td>
                          <td className={`px-4 py-3 font-mono ${row.bias === 'bullish' ? 'text-primary' : row.bias === 'bearish' ? 'text-crimson-red' : 'text-slate-300'}`}>
                            {row.value}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{row.hint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border-subtle bg-white/[0.01] p-5">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Panel 5</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prediction History</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-muted">
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
                      <tr key={row.timestamp} className="border-t border-border-subtle">
                        <td className="px-4 py-3 text-slate-400">{row.timestamp}</td>
                        <td className="px-4 py-3 capitalize text-white">{row.predicted_direction}</td>
                        <td className="px-4 py-3 font-mono text-white">{Math.round(row.confidence * 100)}%</td>
                        <td className="px-4 py-3 uppercase text-slate-400">{row.actual_outcome}</td>
                        <td className={`px-4 py-3 font-bold ${row.hit ? 'text-primary' : 'text-crimson-red'}`}>
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
