import React from 'react';

function cellStyle(stock, index) {
  const confidence = stock.prediction?.vix_discounted_confidence ?? 0.5;
  const hue = stock.prediction?.direction === 'bullish' ? 'rgba(0,255,136,' : stock.prediction?.direction === 'bearish' ? 'rgba(255,59,92,' : 'rgba(255,184,0,';
  const sizeMap = ['col-span-2 row-span-2', 'col-span-2', 'row-span-2', 'col-span-1'];
  return {
    className: sizeMap[index % sizeMap.length],
    background: `${hue}${Math.max(0.24, confidence)})`,
  };
}

export default function HeatmapView({ stocks, onOpen }) {
  return (
    <section className="grid auto-rows-[120px] grid-cols-2 gap-4 lg:grid-cols-4">
      {stocks.map((stock, index) => {
        const style = cellStyle(stock, index);
        return (
          <button
            key={stock.symbol}
            className={`rounded-2xl border border-border-subtle p-4 text-left transition hover:-translate-y-1 hover:border-primary/20 ${style.className}`}
            style={{ background: `linear-gradient(135deg, ${style.background}, rgba(22,27,34,0.92))` }}
            onClick={() => onOpen(stock.symbol)}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white uppercase tracking-wider">{stock.symbol}</div>
                  <div className="text-xs text-slate-400">{stock.company}</div>
                </div>
                <span className={`oi-badge oi-${stock.positioning?.oi_state}`}>{stock.positioning?.oi_state?.replaceAll('_', ' ')}</span>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white">{Math.round((stock.prediction?.vix_discounted_confidence ?? 0.5) * 100)}%</div>
                <div className="mt-1 text-sm capitalize text-white/90">{stock.prediction?.direction}</div>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
