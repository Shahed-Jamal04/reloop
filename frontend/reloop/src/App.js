import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import HomePage from './pages/HomePage';
import Marketplace from './pages/Marketplace';
import MaterialDetail from './pages/MaterialDetail';
import SellerListings from './pages/SellerListings';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import BuyerRequestsPage from './pages/BuyerRequestsPage';
import OrdersPage from './pages/OrdersPage';
import SellerIncomingRequestsPage from './pages/SellerIncomingRequestsPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';
import AdminTestimonialsPage from './pages/AdminTestimonialsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import PublicNav from './components/PublicNav';
import RoleRoute from './components/RoleRoute';
import RootLayout from './components/RootLayout';

function RoleBasedDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'seller') {
    return <Navigate to="/dashboard/seller" replace />;
  }

  return <Navigate to="/dashboard/buyer" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Global layout (sidebar everywhere) */}
          <Route element={<RootLayout />}>
            {/* Public pages (guest menu will show login/register links) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/materials/:id" element={<MaterialDetail />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Auth-only redirect helper */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedDashboard />
                </ProtectedRoute>
              }
            />

            {/* Buyer */}
            <Route
              path="/dashboard/buyer"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['buyer']}>
                    <BuyerDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['buyer']}>
                    <BuyerRequestsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['buyer', 'seller']}>
                    <OrdersPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Seller */}
            <Route
              path="/dashboard/seller"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['seller']}>
                    <SellerDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/listings"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['seller']}>
                    <SellerListings />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/requests"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['seller']}>
                    <SellerIncomingRequestsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['admin']}>
                    <AdminDashboard />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/materials"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['admin']}>
                    <AdminApprovalsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/testimonials"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['admin']}>
                    <AdminTestimonialsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <RoleRoute allow={['admin']}>
                    <AdminUsersPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
