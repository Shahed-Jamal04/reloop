import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppShell from './AppShell';
import { useAuth } from '../context/AuthContext';

export function RootLayout() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // While auth state loads, avoid flicker
  if (loading) {
    return <Outlet />;
  }

  const publicPaths = ['/', '/login', '/register'];

  // Guests can only access public pages, and they should be clean (no sidebar/topbar)
  if (!isAuthenticated) {
    if (!publicPaths.includes(location.pathname)) {
      return <Navigate to="/login" replace />;
    }
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default RootLayout;

