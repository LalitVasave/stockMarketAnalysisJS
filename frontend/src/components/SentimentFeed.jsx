import React from 'react';

export default function SentimentFeed({ items = [] }) {
  return (
    <section className="mt-5 rounded-2xl border border-border-subtle bg-white/[0.01] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">FinBERT Feed</p>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sentiment Tape</h3>
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-muted">Recent Predictions Accuracy: 72.4%</div>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row">
        {items.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex-1 rounded-xl border border-border-subtle bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-white uppercase tracking-wider">{item.symbol}</span>
              <span className={`font-mono text-sm ${item.score >= 0 ? 'text-primary' : 'text-crimson-red'}`}>
                {item.score >= 0 ? '+' : ''}
                {item.score.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-slate-300">{item.headline}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
