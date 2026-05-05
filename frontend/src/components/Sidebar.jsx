import { useNavigate, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { LayoutGrid, TrendingUp, Activity, Database, LogOut, Shield, Radar, Menu, X } from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const [userName] = useState(() => localStorage.getItem('userName') || 'Guest Analyst');
    const [userEmail] = useState(() => localStorage.getItem('userEmail') || 'not.authenticated@sys');
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('v_pred_result');
        localStorage.removeItem('v_hist_data');
        localStorage.removeItem('v_metrics');
        localStorage.removeItem('v_asset');
        localStorage.removeItem('v_model');
        localStorage.removeItem('v_confidence');
        navigate('/registration');
    };

    const closeSidebar = () => setIsOpen(false);
    const navItems = [
        { name: 'Overview', path: '/dashboard', icon: <LayoutGrid className="w-5 h-5" /> },
        { name: 'NSE Pulse', path: '/pulse', icon: <Radar className="w-5 h-5" /> },
        { name: 'Prediction Engine', path: '/prediction', icon: <TrendingUp className="w-5 h-5" /> },
        { name: 'Data Ingestion', path: '/upload', icon: <Database className="w-5 h-5" /> },
        { name: 'Network Command', path: '/admin', icon: <Shield className="w-5 h-5" /> },
    ];

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-deep-indigo text-white shadow-[0_0_20px_rgba(0,0,0,0.35)] md:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>

            {isOpen && (
                <button
                    type="button"
                    aria-label="Close navigation overlay"
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-40 h-full w-[18rem] flex-shrink-0 border-r border-border-subtle bg-deep-indigo transition-transform duration-300 md:static md:z-20 md:w-64 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } flex flex-col`}
            >
            <div className="p-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <div className="size-8 bg-primary rounded flex items-center justify-center text-deep-indigo shadow-[0_0_20px_rgba(13,242,89,0.2)]">
                    <Activity className="w-5 h-5 font-bold" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white italic uppercase">Vishleshak</h1>
                </div>
                <button type="button" onClick={closeSidebar} className="text-slate-muted hover:text-white md:hidden">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-0.5 mt-2">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-muted/60">Core Navigation</p>

                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                ? 'bg-white/5 text-primary border border-white/5'
                                : 'text-slate-muted hover:text-white hover:bg-white/5'
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        {item.icon}
                        <span className="text-sm font-semibold">{item.name}</span>
                    </NavLink>
                ))}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 mt-4 rounded-lg text-slate-muted hover:text-white hover:bg-white/5 transition-all text-left"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </nav>

            <div className="p-4 mx-4 mb-4 rounded-xl bg-white/[0.02] border border-border-subtle overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-muted">Session Monitor</p>
                    <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Secure</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] text-white font-mono font-bold truncate">{userEmail}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Status: Link Encrypted</p>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-border-subtle bg-white/[0.01]">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/5">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{userName}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Identity Verified</span>
                    </div>
                </div>
            </div>
            </aside>
        </>
    );
}
