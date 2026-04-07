import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Pages
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Prediction from './pages/Prediction';

// Components
import Sidebar from './components/Sidebar';

function AppLayout({ children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-dark text-slate-200 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}

// Wrapping all protected views in a single mounted instance
function PersistentPages() {
  const location = useLocation();
  const path = location.pathname;
  
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/registration" replace />;
  }

  return (
    <AppLayout>
      <div className={`w-full h-full ${path.includes('/dashboard') ? 'flex flex-col flex-1' : 'hidden'}`}>
        <Dashboard />
      </div>
      <div className={`w-full h-full ${path.includes('/upload') ? 'flex flex-col flex-1' : 'hidden'}`}>
        <Upload />
      </div>
      <div className={`w-full h-full ${path.includes('/prediction') ? 'flex flex-col flex-1' : 'hidden'}`}>
        <Prediction />
      </div>
    </AppLayout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/registration" replace />} />
        <Route path="/registration" element={<Registration />} />

        {/* Instead of unmounting specific routes, we point all of them to the Permanent Pages handler */}
        <Route path="/dashboard" element={<PersistentPages />} />
        <Route path="/upload" element={<PersistentPages />} />
        <Route path="/prediction" element={<PersistentPages />} />
      </Routes>
    </Router>
  );
}

export default App;
