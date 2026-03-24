import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        if (user?.id) {
          const response = await axios.get(`${API_BASE_URL}/stats/user-stats/${user.id}`);
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        // Set default values if API fails
        setStats({
          active_listings: 0,
          pending_requests: 0,
          active_orders: 0,
          items_traded: 0,
          cart_items: 0,
          unread_messages: 0,
          total_orders: 0,
          total_payments: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <div className="nav-brand">Reloop</div>
        </nav>
        <div style={{ padding: '100px 20px', textAlign: 'center' }}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">Reloop</div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Hero Banner */}
      <section className="dashboard-hero">
        <div className="container">
          <h2>Welcome Back, {user?.name}! 👋</h2>
          <p>Explore the future of circular economy with Reloop</p>
        </div>
      </section>

      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_listings}</p>
            <p className="quick-stat-label">Active Listings</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.pending_requests}</p>
            <p className="quick-stat-label">Pending Requests</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_orders}</p>
            <p className="quick-stat-label">Active Orders</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.items_traded}</p>
            <p className="quick-stat-label">Items Traded</p>
          </div>
        </div>

        {/* User Info */}
        <div className="welcome-card">
          <h1>Your Profile</h1>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> <span className="badge">{user?.role}</span></p>
          <p className="profile-subtitle">Account Status: Active ✓</p>
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📦 My Listings</h3>
            <p>Manage and track your material listings</p>
            <p className="card-stat">{stats?.active_listings} Active</p>
            <button>Go to Listings</button>
          </div>

          <div className="dashboard-card">
            <h3>🛒 Shopping Cart</h3>
            <p>View and manage cart items</p>
            <p className="card-stat">{stats?.cart_items} Items</p>
            <button>Go to Cart</button>
          </div>

          <div className="dashboard-card">
            <h3>💬 Messages</h3>
            <p>Communicate with buyers and sellers</p>
            <p className="card-stat">{stats?.unread_messages} Unread</p>
            <button>Go to Messages</button>
          </div>

          <div className="dashboard-card">
            <h3>📊 Orders</h3>
            <p>Track your orders and transactions</p>
            <p className="card-stat">{stats?.total_orders} Total</p>
            <button>Go to Orders</button>
          </div>

          <div className="dashboard-card">
            <h3>💰 Payments</h3>
            <p>View transaction history and invoices</p>
            <p className="card-stat">${stats?.total_payments} Total</p>
            <button>Go to Payments</button>
          </div>

          <div className="dashboard-card">
            <h3>⚙️ Settings</h3>
            <p>Manage your account preferences</p>
            <p className="card-stat">Profile 85%</p>
            <button>Go to Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
