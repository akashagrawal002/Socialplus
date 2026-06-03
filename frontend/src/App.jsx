import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useWorkspaceStore } from './hooks/useStore';

import Login        from './pages/Login';
import Register     from './pages/Register';
import Layout       from './components/Layout';
import Dashboard    from './pages/Dashboard';
import Competitors  from './pages/Competitors';
import Trends       from './pages/Trends';
import News         from './pages/News';
import Reels        from './pages/Reels';
import Posts        from './pages/Posts';
import Videos       from './pages/Videos';
import ContentStudio from './pages/ContentStudio';
import Engagement   from './pages/Engagement';
import History      from './pages/History';
import Settings     from './pages/Settings';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const fetchWorkspaces  = useWorkspaceStore((s) => s.fetchWorkspaces);

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Private — inside Layout shell */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="competitors" element={<Competitors />} />
        <Route path="trends"      element={<Trends />} />
        <Route path="news"        element={<News />} />
        <Route path="reels"       element={<Reels />} />
        <Route path="posts"       element={<Posts />} />
        <Route path="videos"      element={<Videos />} />
        <Route path="content"     element={<ContentStudio />} />
        <Route path="engagement"  element={<Engagement />} />
        <Route path="history"     element={<History />} />
        <Route path="settings"    element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
