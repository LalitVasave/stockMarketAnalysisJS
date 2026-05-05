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
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-bg-dark/90 pl-20 pr-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-white/5 text-primary shadow-[0_0_20px_rgba(13,242,89,0.12)]">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">NSE Live Stock Analysis Platform</p>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">NSE Pulse</h2>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 xl:mx-8 xl:max-w-xl">
          <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-white/5 px-4 py-3">
            <Search size={16} className="text-primary" />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-muted"
              placeholder="Search symbol, company, sector, OI posture..."
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white/5 px-4 py-3">
            <Signal size={15} className="text-primary/80" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-muted">India VIX</span>
              <strong className={`block font-mono text-sm font-bold ${vix > 20 ? 'text-crimson-red' : 'text-primary'}`}>{vix.toFixed(2)}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white/5 px-4 py-3">
            <Wifi size={15} className="text-primary" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-muted">Market Status</span>
              <strong className="block text-sm font-semibold capitalize text-white">{marketStatus.replace('_', ' ')}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white/5 px-4 py-3">
            <Clock3 size={15} className="text-primary" />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-muted">IST Time</span>
              <strong className="block font-mono text-sm font-bold text-white">{time}</strong>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
