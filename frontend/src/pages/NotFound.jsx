import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const hasToken = Boolean(localStorage.getItem('token'));

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-bg-dark px-6">
      <div className="w-full max-w-xl rounded-2xl border border-border-subtle bg-white/[0.02] p-10 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Route Not Found</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">404</h1>
        <p className="mt-4 text-sm text-slate-400">
          The page you are trying to open does not exist in this build.
        </p>
        <div className="mt-7">
          <Link
            to={hasToken ? '/dashboard' : '/registration'}
            className="inline-flex rounded-xl border border-primary/20 bg-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/15"
          >
            {hasToken ? 'Go To Dashboard' : 'Go To Login'}
          </Link>
        </div>
      </div>
    </main>
  );
}

