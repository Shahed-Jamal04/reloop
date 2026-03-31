import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function Dashboard({ variant }) {
  const { user } = useAuth();
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
      {/* Hero Banner */}
      <section className="dashboard-hero">
        <div className="container">
          <h2>Welcome Back, {user?.name}! 👋</h2>
          <p>
            {variant === 'seller'
              ? 'Manage your leftover stock and connect with buyers'
              : 'Discover leftover stock deals from factories and brands'}
          </p>
        </div>
      </section>

      <div className="dashboard-content">
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_listings}</p>
            <p className="quick-stat-label">{variant === 'seller' ? 'Approved Listings' : 'Active Listings'}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.pending_requests}</p>
            <p className="quick-stat-label">{variant === 'seller' ? 'Incoming Requests' : 'Pending Requests'}</p>
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

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {variant === 'seller' && (
            <div className="dashboard-card">
              <h3>📦 My Listings</h3>
              <p>Manage and track your leftover stock listings</p>
              <p className="card-stat">{stats?.active_listings} Active</p>
              <button onClick={() => navigate('/seller/listings')}>Go to Listings</button>
            </div>
          )}

          {variant === 'buyer' && (
            <div className="dashboard-card">
              <h3>🛒 Shopping Cart</h3>
              <p>View and manage items you plan to buy</p>
              <p className="card-stat">{stats?.cart_items} Items</p>
              <button>Go to Cart</button>
            </div>
          )}

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
