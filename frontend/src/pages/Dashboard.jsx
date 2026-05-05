import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import LiveChart from '../components/LiveChart';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_BASE_URL, WS_URL } from '../config';

export default function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const { data: wsData, isConnected } = useWebSocket(WS_URL, token);

    const [marketDelta, setMarketDelta] = useState(0);
    const [startPrice, setStartPrice] = useState(null);
    const [uploadHistory, setUploadHistory] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [userName, setUserName] = useState('Analyst');

    const fetchHistory = async () => {
        try {
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/uploads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                console.warn("Session expired or unauthorized. Redirecting to login...");
                localStorage.removeItem('token');
                window.location.href = '/registration';
                return;
            }

            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            setUploadHistory(data);
        } catch (err) {
            console.error('History fetch failed:', err);
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('userName');
        if (stored) setUserName(stored);
        
        fetchHistory();
    }, []);

    useEffect(() => {
        if (wsData) {
            if (wsData.type === 'tick') {
                const currentPrice = wsData.close;
                if (!startPrice) {
                    setStartPrice(wsData.open);
                } else {
                    const delta = ((currentPrice - startPrice) / startPrice) * 100;
                    setMarketDelta(delta);
                }
            } else if (wsData.type === 'PIPELINE_UPDATED') {
                console.info('Pipeline update received via WebSocket. Refreshing history...');
                fetchHistory();
            }
        }
    }, [wsData, startPrice]);

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-bg-dark h-[100vh]">
            <header className="h-16 flex-shrink-0 flex items-center justify-between pl-20 pr-4 md:px-8 border-b border-border-subtle sticky top-0 bg-bg-dark/90 backdrop-blur-md z-10 w-full">
                <div className="flex items-center gap-8 flex-1">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Refined Market Dashboard</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`size-1.5 rounded-full ${isConnected ? 'bg-primary shadow-[0_0_8px_#0df259] animate-pulse-soft' : 'bg-crimson-red shadow-[0_0_8px_#ff4d4d]'}`}></span>
                            <p className="text-[10px] text-slate-muted uppercase font-bold tracking-widest transition-opacity duration-300">
                                {isConnected ? 'Live Feed Active' : 'Connecting to Core...'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pt-6 md:p-8 space-y-8 md:space-y-10 custom-scrollbar w-full relative">
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col gap-1 mb-8">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">System Intelligence Ready</p>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {userName}</h1>
                        <p className="text-sm text-slate-500 font-medium">Your institutional analysis perimeter is active and secure.</p>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-bold text-slate-muted uppercase tracking-[0.25em]">Performance at a Glance</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="border-b md:border-b-0 md:border-r border-border-subtle pb-4 md:pb-0 md:pr-6">
                            <p className="text-[10px] font-bold text-slate-muted uppercase tracking-widest mb-2">Total Predictions</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-white">12,482</span>
                                <span className="text-[10px] font-bold text-primary">+12.4%</span>
                            </div>
                        </div>
                        <div className="border-b md:border-b-0 md:border-r border-border-subtle pb-4 md:pb-0 md:pr-6 md:pl-2">
                            <p className="text-[10px] font-bold text-slate-muted uppercase tracking-widest mb-2">System Load</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-white">24.8%</span>
                                <span className="text-[10px] font-bold text-slate-muted">Nominal</span>
                            </div>
                        </div>
                        <div className="border-b md:border-b-0 md:border-r border-border-subtle pb-4 md:pb-0 md:pr-6 md:pl-2">
                            <p className="text-[10px] font-bold text-slate-muted uppercase tracking-widest mb-2">Market Delta</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl font-bold tracking-tight ${marketDelta >= 0 ? 'text-primary' : 'text-crimson-red'}`}>
                                    {marketDelta >= 0 ? '+' : ''}{marketDelta.toFixed(2)}%
                                </span>
                                <span className={`text-[10px] font-bold ${marketDelta >= 0 ? 'text-primary' : 'text-crimson-red'}`}>
                                    {marketDelta >= 0 ? '+' : '-'}{Math.abs(marketDelta + (marketDelta >= 0 ? -0.01 : 0.01)).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="md:pl-2">
                            <p className="text-[10px] font-bold text-slate-muted uppercase tracking-widest mb-2">Signal Strength</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-primary">84.0</span>
                                <span className="text-[10px] font-bold text-primary/60">High</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="bg-white/[0.01] rounded-xl border border-border-subtle flex flex-col overflow-hidden relative">
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Intraday Momentum</h3>
                            <p className="text-xs text-slate-muted mt-0.5 font-medium">S&amp;P 500 Composite AI Feed (Real-time)</p>
                        </div>
                        <div className="flex bg-white/[0.02] p-0.5 rounded border border-border-subtle">
                            <button className="px-3 py-1 text-[10px] font-bold rounded text-slate-muted hover:text-white md:block hidden transition-colors uppercase">1H</button>
                            <button className="px-3 py-1 text-[10px] font-bold rounded bg-white/5 text-white uppercase">1D</button>
                        </div>
                    </div>
                    <div className="relative h-[350px] w-full border-t border-border-subtle overflow-hidden">
                        <LiveChart wsData={wsData} />
                    </div>
                </div>

                <div className="bg-white/[0.01] rounded-xl border border-border-subtle overflow-hidden">
                    <div className="px-8 py-5 border-b border-border-subtle flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Recent Data Pipelines</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/[0.02] text-[10px] font-bold text-slate-muted uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-3 border-b border-border-subtle">Resource Name</th>
                                    <th className="px-8 py-3 border-b border-border-subtle hidden md:table-cell">Timestamp</th>
                                    <th className="px-8 py-3 border-b border-border-subtle">Status</th>
                                    <th className="px-8 py-3 border-b border-border-subtle text-right">Data Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {isInitialLoad ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-shimmer">
                                            <td className="px-8 py-4"><div className="h-10 bg-white/5 rounded-md w-48"></div></td>
                                            <td className="px-8 py-4 hidden md:table-cell"><div className="h-4 bg-white/5 rounded-md w-32"></div></td>
                                            <td className="px-8 py-4"><div className="h-6 bg-white/5 rounded-full w-20"></div></td>
                                            <td className="px-8 py-4 text-right"><div className="h-4 bg-white/5 rounded-md w-16 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : uploadHistory.length > 0 ? (
                                    uploadHistory.map((upload) => (
                                        <tr 
                                            key={upload.id} 
                                            className="hover:bg-white/[0.04] transition-all group cursor-pointer active:brightness-95"
                                            onClick={() => navigate('/prediction', { 
                                                state: { 
                                                    historicalPrediction: upload.prediction,
                                                    filename: upload.filename,
                                                    rows: upload.rowsProcessed,
                                                    timestamp: upload.createdAt
                                                } 
                                            })}
                                        >
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded bg-white/5 flex items-center justify-center text-slate-muted group-hover:text-primary transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-semibold text-white/90">{upload.filename}</span>
                                                        <span className="text-[10px] text-slate-600 font-mono">#INGEST-{upload.id.toString().slice(-4)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-xs text-slate-400 font-medium hidden md:table-cell">{upload.createdAt || upload.timestamp}</td>
                                            <td className="px-8 py-4">
                                                <span className="status-badge bg-primary/5 text-primary border-primary/20">
                                                    Ready
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right font-mono text-xs text-slate-400">{upload.rowsProcessed.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-8 text-center text-slate-500 text-sm">
                                            No data pipelines processed yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
