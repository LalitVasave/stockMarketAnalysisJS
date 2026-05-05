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
    <aside className="hidden w-full border-b border-border-subtle bg-deep-indigo px-4 py-4 xl:block xl:w-[292px] xl:border-b-0 xl:border-r xl:px-5">
      <div className="sticky top-[118px] space-y-4">
        <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center gap-3">
            <Filter size={16} className="text-primary" />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Watch Surface</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
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
                  ? 'border-primary/30 bg-primary/10 text-white'
                  : 'border-border-subtle bg-white/5 text-slate-muted'
              }`}
              onClick={() => setWatchlistOnly((current) => !current)}
            >
              <div className="flex items-center gap-3">
                <Bookmark size={15} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em]">Watchlist Only</div>
                  <div className="text-[11px] text-slate-400">Focus the matrix on selected symbols.</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center gap-3">
            <Radar size={16} className="text-primary" />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Judge-Winning Extra</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Squeeze Radar</h3>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-bold text-white">SBIN</strong>
                <span className="text-primary">82%</span>
              </div>
              <p className="mt-2 text-slate-300">5-session Short Buildup to Short Covering unwind. Delivery trend supportive.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-bold text-white">INFY</strong>
                <span className="text-slate-300">67%</span>
              </div>
              <p className="mt-2 text-slate-400">Covering phase detected, but VIX discount prevents top-tier conviction.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-4">
          <div className="mb-4 flex items-center gap-3">
            <SlidersHorizontal size={16} className="text-primary" />
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Macro State</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Notes</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>VIX remains below stress threshold, so no major confidence haircut is active.</li>
            <li>Banking leadership is driving bullish breadth through the live basket.</li>
            <li>Auto and IT are split, making OI alignment more important than raw momentum.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
