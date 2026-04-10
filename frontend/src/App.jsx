import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

// Pages
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Prediction from './pages/Prediction';
import Admin from './pages/Admin';

// Components
import Sidebar from './components/Sidebar';

function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-dark text-slate-200 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/registration" replace />} />
        <Route path="/registration" element={<Registration />} />

        {/* Persistent Layout Section: All sub-routes share the same Sidebar instance */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/registration" replace />;
  return children;
}

export default App;
