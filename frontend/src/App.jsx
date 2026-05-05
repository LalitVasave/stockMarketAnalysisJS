import React from 'react';
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Pulse from './pages/Pulse';
import Prediction from './pages/Prediction';
import Registration from './pages/Registration';
import Upload from './pages/Upload';
import NotFound from './pages/NotFound';

function AppLayout() {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 overflow-hidden md:pl-0">
        <Outlet />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/registration" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/registration" replace />} />
        <Route path="/registration" element={<Registration />} />

        <Route
          element={(
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          )}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
