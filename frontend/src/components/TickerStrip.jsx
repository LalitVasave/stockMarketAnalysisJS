import React from 'react';

export default function TickerStrip({ indices }) {
  return (
    <section className="overflow-hidden border-b border-border-subtle bg-bg-dark/60">
      <div className="ticker-marquee flex min-w-max gap-10 px-6 py-3">
        {[...indices, ...indices].map((index, offset) => (
          <div key={`${index.name}-${offset}`} className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{index.name}</span>
            <span className="font-mono text-xs text-slate-300">{index.value.toLocaleString('en-IN')}</span>
            <span className={`font-mono text-xs ${index.change_pct >= 0 ? 'text-primary' : 'text-crimson-red'}`}>
              {index.change_pct >= 0 ? '+' : ''}
              {index.change_pct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
