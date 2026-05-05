import React from 'react';

export default function SentimentFeed({ items = [] }) {
  return (
    <section className="mt-5 rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.88)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="terminal-eyebrow">FinBERT Feed</p>
          <h3 className="font-display text-lg text-white">Sentiment Tape</h3>
        </div>
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Recent Predictions Accuracy: 72.4%</div>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row">
        {items.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex-1 rounded-[20px] border border-[rgba(0,212,255,0.1)] bg-[rgba(2,8,16,0.75)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm text-white">{item.symbol}</span>
              <span className={`font-data text-sm ${item.score >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
                {item.score >= 0 ? '+' : ''}
                {item.score.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">{item.headline}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
