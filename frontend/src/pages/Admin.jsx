import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Globe, Loader2, Search } from 'lucide-react';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Unauthorized access to administrative core.');
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
            <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 sticky top-0 bg-[#0b0f19]/80 backdrop-blur-xl z-20 w-full">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(13,242,89,0.1)]">
                        <Shield className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Network Command Center</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Vishleshak System Administration</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">System Status</span>
                        <span className="text-[10px] text-slate-400 font-mono">ENCRYPTED L3 CHANNEL</span>
                    </div>
                    <div className="h-8 w-px bg-white/5"></div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Find User..."
                            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:border-primary/50 outline-none w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Analysts', value: users.length, icon: <Users />, color: 'primary' },
                        { label: 'Live Connections', value: users.filter(u => u.status === 'Online').length, icon: <Globe />, color: 'primary' },
                        { label: 'Analysis Cycles', value: users.reduce((acc, u) => acc + u.analysisCount, 0), icon: <Activity />, color: 'primary' },
                        { label: 'Network Grade', value: 'TIER-1', icon: <Shield />, color: 'primary' },
                    ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
                            <div className="flex items-start justify-between mb-4">
                                <span className={`p-2 rounded-lg bg-primary/10 text-primary`}>{stat.icon}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">METRIC: {i+1}</span>
                            </div>
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</h4>
                            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* User Table */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                    <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Institutional Access Log</h3>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Live Updates Active</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                                <tr>
                                    <th className="px-8 py-4">Identity / Email</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Join Date</th>
                                    <th className="px-8 py-4 text-center">Data Pipelines</th>
                                    <th className="px-8 py-4 text-right">Access Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Synchronizing Network...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-slate-500 italic text-sm">
                                            No users found in the secure perimeter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300 group-hover:border-primary/30 transition-colors">
                                                        {user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white/90">{user.email}</span>
                                                        <span className="text-[9px] text-slate-500 font-mono">UID: {user.id.toString().padStart(4, '0')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`size-1.5 rounded-full ${user.status === 'Online' ? 'bg-primary shadow-[0_0_8px_#0df259] animate-pulse' : 'bg-slate-700'}`}></span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${user.status === 'Online' ? 'text-primary' : 'text-slate-600'}`}>
                                                        {user.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-xs text-slate-400 font-medium">
                                                {new Date(user.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">
                                                    {user.analysisCount} Units
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-[10px] font-black tracking-widest text-primary uppercase">Authenticated</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
