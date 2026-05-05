import React from 'react';

export default function ConfidenceGauge({ value = 0.5, label = 'Confidence' }) {
  const pct = Math.max(0, Math.min(value, 1));
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (pct * circumference);

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#00FF88" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(13,31,45,1)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 18px rgba(0,212,255,0.45))', transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-data text-4xl text-white">{Math.round(pct * 100)}%</div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">{label}</div>
      </div>
    </div>
  );
}
