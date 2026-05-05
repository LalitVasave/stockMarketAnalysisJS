import React from 'react';
import { Activity, Clock3, Search, Signal, Wifi } from 'lucide-react';
import { useMarketStore } from '../store/marketStore';

function marketClock() {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function Navbar() {
  const vix = useMarketStore((state) => state.vix);
  const marketStatus = useMarketStore((state) => state.marketStatus);
  const [time, setTime] = React.useState(marketClock());

  React.useEffect(() => {
    const timer = window.setInterval(() => setTime(marketClock()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="holo-nav sticky top-0 z-20 border-b border-[rgba(0,212,255,0.14)] bg-[rgba(2,8,16,0.82)] pl-20 pr-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.08)] text-[var(--pulse)] shadow-[0_0_26px_rgba(0,212,255,0.18)]">
            <Activity size={22} />
          </div>
          <div>
            <p className="terminal-eyebrow">NSE Live Stock Analysis Platform</p>
            <h2 className="font-display text-xl uppercase tracking-[0.22em] text-white">NSE Pulse</h2>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 xl:mx-8 xl:max-w-xl">
          <div className="flex items-center gap-3 rounded-full border border-[rgba(0,212,255,0.12)] bg-[rgba(5,15,26,0.95)] px-4 py-3">
            <Search size={16} className="text-[var(--pulse)]" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Search symbol, company, sector, OI posture..."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="nav-chip">
            <Signal size={15} className="text-[var(--amber)]" />
            <div>
              <span className="nav-chip-label">India VIX</span>
              <strong className={vix > 20 ? 'text-[var(--bear)]' : 'text-[var(--bull)]'}>{vix.toFixed(2)}</strong>
            </div>
          </div>
          <div className="nav-chip">
            <Wifi size={15} className="text-[var(--pulse)]" />
            <div>
              <span className="nav-chip-label">Market Status</span>
              <strong className="capitalize text-white">{marketStatus.replace('_', ' ')}</strong>
            </div>
          </div>
          <div className="nav-chip">
            <Clock3 size={15} className="text-[var(--pulse)]" />
            <div>
              <span className="nav-chip-label">IST Time</span>
              <strong className="font-data text-white">{time}</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
