import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppShell from './AppShell';
import PublicShell from './PublicShell';
import { useAuth } from '../context/AuthContext';
import ChatWidget from './ChatWidget';

export function RootLayout() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // While auth loads
  if (loading) {
    return <Outlet />;
  }

  const publicPaths = ['/', '/login', '/register', '/marketplace'];
  const isMaterialDetail = location.pathname.startsWith('/materials/');


  // Guest view
  if (!isAuthenticated) {
    if (!publicPaths.includes(location.pathname) && !isMaterialDetail) {
      return <Navigate to="/login" replace />;
    }

    return (
      <>
        <PublicShell>
          <Outlet />
        </PublicShell>
        <ChatWidget />
      </>
    );
  }

  // Authenticated view
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <ChatWidget />
    </>
  );
}

export default RootLayout;