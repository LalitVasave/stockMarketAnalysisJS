import React from 'react';

const colors = {
  long_buildup: '#00FF88',
  short_covering: '#1D9E75',
  long_unwinding: '#FFB800',
  short_buildup: '#FF3B5C',
};

export default function OIHistoryPanel({ items = [] }) {
  const latest = items.slice(0, 10).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="terminal-eyebrow">20 Session Positioning</p>
          <h3 className="font-display text-lg text-white">OI State History</h3>
        </div>
        <div className="rounded-full border border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.05)] px-4 py-2 text-xs text-[var(--bull)]">
          Squeeze Setup Detected
        </div>
      </div>

      <div className="rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.72)] p-4">
        <div className="flex h-56 items-end gap-3">
          {latest.map((item) => {
            const total = item.long_buildup + item.short_covering + item.long_unwinding + item.short_buildup;
            return (
              <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-2xl bg-[rgba(13,31,45,0.9)]">
                  {['long_buildup', 'short_covering', 'long_unwinding', 'short_buildup'].map((key) => (
                    <div
                      key={key}
                      style={{
                        height: `${(item[key] / total) * 100}%`,
                        background: colors[key],
                        boxShadow: `0 0 18px ${colors[key]}44`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <div className="font-data text-[11px] text-white">{item.pcr}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.date.slice(5)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
