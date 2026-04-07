import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Registration() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/register';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Save JWT properly
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', fullName || email.split('@')[0]);
            navigate('/dashboard');
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoAccess = () => {
        localStorage.setItem('token', 'demo_institutional_token');
        localStorage.setItem('userName', fullName || 'Guest Analyst');
        navigate('/dashboard');
    };

    return (
        <div className="page-wrapper flex-col justify-between items-center w-full h-full overflow-y-auto">
            <nav className="w-full p-10 flex justify-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-deep-indigo shadow-[0_0_20px_rgba(13,242,89,0.3)]">
                        <span className="material-symbols-outlined font-bold text-2xl">query_stats</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-[0.3em] text-white uppercase">Vishleshak</h1>
                </div>
            </nav>

            <main className="flex-grow flex items-center justify-center px-6 py-8 w-full">
                <div className="w-full max-w-[580px]">
                    <div className="glass-card-subtle rounded-[2rem] p-10 md:p-14 relative overflow-hidden">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-serif text-white mb-5 font-bold tracking-tight">
                                {isLogin ? 'Analyst Login' : 'Secure Analyst Onboarding'}
                            </h2>
                            <p className="text-slate-400 font-body-serif italic text-xl">Enter the high-frequency intelligence perimeter.</p>
                            {errorMsg && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold">
                                    {errorMsg}
                                </div>
                            )}
                        </header>

                        <form className="space-y-8" onSubmit={handleAuth}>
                            {!isLogin && (
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">Full Identity</label>
                                    <input 
                                        className="w-full rounded-xl border-white/5 bg-white/5 py-4.5 px-5 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm" 
                                        placeholder="e.g. Alexander Sterling" 
                                        type="text" 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">Professional Credential</label>
                                <input 
                                    className="w-full rounded-xl border-white/5 bg-white/5 py-4.5 px-5 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm" 
                                    placeholder="analyst@institutional.com" 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 ml-1">Secure Access Key</label>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-xl border-white/5 bg-white/5 py-4.5 px-5 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all text-sm" 
                                        placeholder="••••••••••••" 
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <span onClick={() => setShowPassword(!showPassword)} className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-xl cursor-pointer hover:text-primary transition-colors">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </div>
                                <div className="pt-3">
                                    <div className="flex gap-2 mb-3">
                                        <div className="strength-meter-bar bg-primary"></div>
                                        <div className="strength-meter-bar bg-primary"></div>
                                        <div className="strength-meter-bar bg-primary"></div>
                                        <div className="strength-meter-bar bg-white/10"></div>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Encryption Level: Tier 3</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Complex Requirements Met</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 py-2">
                                <div className="relative flex items-center h-6">
                                    <input className="custom-checkbox absolute opacity-0 w-6 h-6 cursor-pointer z-10" id="terms" type="checkbox" />
                                    <label className="flex items-center cursor-pointer" htmlFor="terms">
                                        <span className="check-box w-6 h-6 border border-white/10 rounded-md flex items-center justify-center transition-all duration-200 bg-white/5">
                                            <span className="material-symbols-outlined check-icon text-deep-indigo text-lg font-bold scale-0 opacity-0 transition-all duration-200">check</span>
                                        </span>
                                    </label>
                                </div>
                                <label className="text-xs text-slate-400 leading-relaxed font-medium" htmlFor="terms">
                                    I verify compliance with the <a className="text-white hover:text-primary transition-colors underline underline-offset-4 decoration-white/20" href="#">Institutional Protocols</a> and <a className="text-white hover:text-primary transition-colors underline underline-offset-4 decoration-white/20" href="#">Privacy Governance</a>.
                                </label>
                            </div>

                            <button disabled={isLoading} type="submit" className="w-full rounded-xl bg-primary py-5 text-xs font-bold tracking-[0.25em] uppercase text-deep-indigo shadow-lg shadow-primary/5 hover:shadow-[0_0_20px_rgba(13,242,89,0.4)] hover:brightness-105 transition-all">
                                {isLoading ? 'Authenticating...' : (isLogin ? 'Initialize Login' : 'Initialize Terminal Access')}
                            </button>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-xs tracking-wide text-slate-500 font-medium">
                                {isLogin ? 'New Analyst?' : 'Existing Institutional Partner?'}
                                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-white hover:text-primary transition-colors font-bold ml-1 border-b border-white/20 cursor-pointer">
                                    {isLogin ? 'Apply for Network' : 'Login to Network'}
                                </button>
                            </p>
                            <div className="mt-6 flex justify-center">
                                <button 
                                    type="button" 
                                    onClick={handleDemoAccess}
                                    className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-600 hover:text-primary transition-all flex items-center gap-2 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-all"></span>
                                    Connect to Simulation Core (Demo Mode)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full pb-10 px-6 mt-auto shrink-0">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col items-center gap-10">
                        <div className="relative w-full flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <span className="relative bg-deep-indigo px-6 text-[10px] uppercase tracking-[0.4em] text-slate-600 font-bold">Trusted by Elite Firms</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
