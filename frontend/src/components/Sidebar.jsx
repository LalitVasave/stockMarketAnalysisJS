import { useNavigate, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutGrid, TrendingUp, Activity, Database, LogOut, Plus } from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('Guest Analyst');

    useEffect(() => {
        const stored = localStorage.getItem('userName');
        if (stored) setUserName(stored);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/registration');
    };
    const navItems = [
        { name: 'Overview', path: '/dashboard', icon: <LayoutGrid className="w-5 h-5" /> },
        { name: 'Prediction Engine', path: '/prediction', icon: <TrendingUp className="w-5 h-5" /> },
        { name: 'Data Ingestion', path: '/upload', icon: <Database className="w-5 h-5" /> },
    ];

    return (
        <aside className="w-64 flex-shrink-0 bg-deep-indigo border-r border-border-subtle flex flex-col z-20 h-full">
            <div className="p-6 flex items-center gap-3">
                <div className="size-8 bg-primary rounded flex items-center justify-center text-deep-indigo shadow-[0_0_20px_rgba(13,242,89,0.2)]">
                    <Activity className="w-5 h-5 font-bold" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white italic uppercase">Vishleshak</h1>
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

            <div className="p-4 mx-4 mb-4 rounded-xl bg-white/[0.02] border border-border-subtle">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-muted mb-3">Quick Actions</p>
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/upload')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-primary text-deep-indigo hover:brightness-110 transition-all font-bold text-xs"
                    >
                        <Plus className="w-4 h-4" />
                        New Analysis
                    </button>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-border-subtle">
                <div className="flex items-center gap-3 px-2">
                    <img alt="User Profile" className="size-8 rounded-full object-cover ring-2 ring-primary/20"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqIv2b4NtnhmaOs8mbAp32sXZFZRoSY-S2LHfu3crCQJkYOo3lKTWoNl0ME2ahwsBa41pwoRUHBfvBCsvspjWjsa3z0-kUM9sNLrO1NwKxNHokWP6AZ2chIMfb4QtNjMh9QT9_fHu-mRolJFFMtsPOHV2Haxk0J8_ok6XSqn1GZowTkf0W1_XTkN_U2xY1OH6WqqwufEKRe9YRnm4ILGvG5R_bXavdjpw2y7VLgV1MHUAoPuOTa7QM3kx5kCAHcGuOIIbdcybqFSvb" />
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{userName}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Pro Trader</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
