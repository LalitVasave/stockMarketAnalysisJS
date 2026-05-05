import React from 'react';

export default function TickerStrip({ indices }) {
  return (
    <section className="overflow-hidden border-b border-[rgba(0,212,255,0.09)] bg-[rgba(4,12,20,0.86)]">
      <div className="ticker-marquee flex min-w-max gap-10 px-6 py-3">
        {[...indices, ...indices].map((index, offset) => (
          <div key={`${index.name}-${offset}`} className="flex items-center gap-3">
            <span className="font-display text-sm uppercase tracking-[0.24em] text-white">{index.name}</span>
            <span className="font-data text-sm text-[var(--text-primary)]">{index.value.toLocaleString('en-IN')}</span>
            <span className={`font-data text-sm ${index.change_pct >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
              {index.change_pct >= 0 ? '+' : ''}
              {index.change_pct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
