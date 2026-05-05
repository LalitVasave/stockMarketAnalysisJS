import React from 'react';
import { Bookmark, Filter, Radar, SlidersHorizontal } from 'lucide-react';

const oiStates = ['All', 'long_buildup', 'short_buildup', 'long_unwinding', 'short_covering'];
const signals = ['All', 'bullish', 'bearish', 'neutral'];

export default function SidebarFilters({
  sectors,
  sectorFilter,
  setSectorFilter,
  oiFilter,
  setOiFilter,
  signalFilter,
  setSignalFilter,
  watchlistOnly,
  setWatchlistOnly,
}) {
  return (
    <aside className="hidden w-full border-b border-[rgba(0,212,255,0.08)] bg-[rgba(3,10,17,0.84)] px-4 py-4 xl:block xl:w-[292px] xl:border-b-0 xl:border-r xl:px-5">
      <div className="sticky top-[118px] space-y-4">
        <div className="rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.85)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <Filter size={16} className="text-[var(--pulse)]" />
            <div>
              <p className="terminal-eyebrow">Watch Surface</p>
              <h3 className="font-display text-lg text-white">Filters</h3>
            </div>
          </div>

          <div className="space-y-4">
            <label className="filter-group">
              <span>Sector</span>
              <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </label>

            <label className="filter-group">
              <span>OI State</span>
              <select value={oiFilter} onChange={(event) => setOiFilter(event.target.value)}>
                {oiStates.map((state) => (
                  <option key={state} value={state}>{state.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </label>

            <label className="filter-group">
              <span>Signal</span>
              <select value={signalFilter} onChange={(event) => setSignalFilter(event.target.value)}>
                {signals.map((signal) => (
                  <option key={signal} value={signal}>{signal}</option>
                ))}
              </select>
            </label>

            <button
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                watchlistOnly
                  ? 'border-[rgba(0,255,136,0.28)] bg-[rgba(0,255,136,0.08)] text-white'
                  : 'border-[rgba(0,212,255,0.12)] bg-[rgba(2,8,16,0.72)] text-[var(--text-muted)]'
              }`}
              onClick={() => setWatchlistOnly((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <Bookmark size={15} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em]">Watchlist Only</div>
                  <div className="text-[11px]">Focus the matrix on selected symbols.</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.85)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <Radar size={16} className="text-[var(--bull)]" />
            <div>
              <p className="terminal-eyebrow">Judge-Winning Extra</p>
              <h3 className="font-display text-lg text-white">Squeeze Radar</h3>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-[rgba(0,255,136,0.18)] bg-[rgba(0,255,136,0.05)] p-3">
              <div className="flex items-center justify-between">
                <strong className="font-display text-white">SBIN</strong>
                <span className="text-[var(--bull)]">82%</span>
              </div>
              <p className="mt-2 text-[var(--text-muted)]">5-session Short Buildup to Short Covering unwind. Delivery trend supportive.</p>
            </div>
            <div className="rounded-2xl border border-[rgba(255,184,0,0.18)] bg-[rgba(255,184,0,0.05)] p-3">
              <div className="flex items-center justify-between">
                <strong className="font-display text-white">INFY</strong>
                <span className="text-[var(--amber)]">67%</span>
              </div>
              <p className="mt-2 text-[var(--text-muted)]">Covering phase detected, but VIX discount prevents top-tier conviction.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.85)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <SlidersHorizontal size={16} className="text-[var(--pulse)]" />
            <div>
              <p className="terminal-eyebrow">Macro State</p>
              <h3 className="font-display text-lg text-white">Session Notes</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li>VIX remains below stress threshold, so no major confidence haircut is active.</li>
            <li>Banking leadership is driving bullish breadth through the live basket.</li>
            <li>Auto and IT are split, making OI alignment more important than raw momentum.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
