import React, { useMemo } from 'react';
import { Bookmark, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

function Sparkline({ values = [] }) {
  const points = useMemo(() => {
    if (!values.length) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    return values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = max === min ? 50 : 100 - (((value - min) / (max - min)) * 100);
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full">
      <polyline
        fill="none"
        stroke="var(--pulse)"
        strokeWidth="3"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const sparkSeeds = {
  RELIANCE: [20, 28, 33, 29, 37, 41, 46],
  HDFCBANK: [18, 23, 24, 31, 29, 35, 38],
  ICICIBANK: [31, 27, 25, 29, 22, 20, 19],
  INFY: [22, 30, 35, 33, 40, 43, 49],
  TCS: [39, 34, 29, 31, 26, 23, 21],
  SBIN: [15, 22, 25, 32, 38, 42, 48],
  LT: [21, 25, 24, 29, 33, 34, 37],
  TATAMOTORS: [36, 34, 30, 28, 24, 21, 18],
};

export default function StockCard({ stock, onOpen, onToggleWatch, watched }) {
  const price = stock.live?.ltp ?? stock.price?.ltp ?? 0;
  const change = stock.live?.change_pct ?? stock.price?.change_pct ?? 0;
  const direction = stock.live?.direction ?? stock.prediction?.direction ?? 'neutral';
  const confidence = stock.live?.vix_discounted_confidence ?? stock.prediction?.vix_discounted_confidence ?? 0.5;
  const directionTone = direction === 'bullish' ? 'text-primary' : direction === 'bearish' ? 'text-crimson-red' : 'text-slate-300';

  return (
    <article
      role="button"
      tabIndex={0}
      className={`stock-card group relative overflow-hidden rounded-2xl border border-border-subtle bg-white/[0.02] p-5 text-left transition hover:-translate-y-1 hover:border-primary/20 ${
        direction === 'bullish' ? 'pulse-bull' : direction === 'bearish' ? 'pulse-bear' : 'pulse-neutral'
      }`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen();
      }}
    >
      <div className="particle-burst" key={`${direction}-${Math.round(price)}`}>
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} style={{ '--i': index }} />
        ))}
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wider">{stock.symbol}</p>
          <p className="mt-1 text-xs text-slate-400">{stock.company}</p>
        </div>
        <button
          className={`rounded-full border p-2 transition ${
            watched
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border-subtle bg-white/5 text-slate-muted'
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleWatch();
          }}
        >
          <Bookmark size={14} fill={watched ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div key={`price-${Math.round(price * 100)}`} className="digit-ticker is-updating font-mono text-3xl font-bold text-white">
            {price.toFixed(2)}
          </div>
          <div className={`mt-1 flex items-center gap-2 font-mono text-sm ${change >= 0 ? 'text-primary' : 'text-crimson-red'}`}>
            {change >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {change >= 0 ? '+' : ''}
            {change.toFixed(2)}%
          </div>
        </div>

        <span className={`oi-badge oi-${stock.positioning?.oi_state}`}>{stock.positioning?.oi_state?.replaceAll('_', ' ')}</span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-muted">
          <span>Confidence</span>
          <span className="font-mono text-white">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className={`confidence-glow h-full rounded-full ${
              direction === 'bullish' ? 'bg-primary' : direction === 'bearish' ? 'bg-crimson-red' : 'bg-slate-500'
            }`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-muted">Signal</p>
          <p className={`mt-1 text-base font-bold capitalize ${directionTone}`}>
            {direction}
          </p>
        </div>
        <div className="rounded-full border border-border-subtle bg-white/5 px-3 py-2 text-xs text-slate-muted">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-primary" />
            Sentiment {stock.sentiment?.score?.toFixed(2)}
          </div>
        </div>
      </div>

      <Sparkline values={sparkSeeds[stock.symbol] || [12, 16, 18, 17, 22, 24, 28]} />
    </article>
  );
}
