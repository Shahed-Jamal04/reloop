import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './rolePages.css';

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
      <div className="role-page dashboard-container">
        <div className="d-flex justify-content-center align-items-center py-5 gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page dashboard-container">
      <section className="dashboard-hero">
        <div className="container">
          <h2>Welcome back, {user?.name}</h2>
          <p>
            {variant === 'seller'
              ? 'Manage your listings and connect with buyers.'
              : 'Discover surplus materials and track your requests.'}
          </p>
        </div>
      </section>

      <div className="dashboard-content">
        <div className="quick-stats">
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_listings}</p>
            <p className="quick-stat-label">{variant === 'seller' ? 'Approved listings' : 'Active listings'}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.pending_requests}</p>
            <p className="quick-stat-label">{variant === 'seller' ? 'Incoming requests' : 'Pending requests'}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_orders}</p>
            <p className="quick-stat-label">Active orders</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.items_traded}</p>
            <p className="quick-stat-label">Items traded</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {variant === 'seller' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-card-list text-success" aria-hidden="true" /> My listings
              </h3>
              <p>Manage and track your material listings.</p>
              <p className="card-stat">{stats?.active_listings} active</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/seller/listings')}>
                Go to listings
              </button>
            </div>
          )}

          {variant === 'buyer' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-bag text-success" aria-hidden="true" /> Marketplace
              </h3>
              <p>Browse surplus materials from sellers.</p>
              <p className="card-stat">Explore</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/marketplace')}>
                Browse materials
              </button>
            </div>
          )}

          {variant === 'buyer' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-chat-left-text text-success" aria-hidden="true" /> My requests
              </h3>
              <p>Track requests you sent to sellers.</p>
              <p className="card-stat">{stats?.pending_requests} pending</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/requests')}>
                View requests
              </button>
            </div>
          )}

          {variant === 'seller' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-inbox text-success" aria-hidden="true" /> Incoming requests
              </h3>
              <p>Respond to buyers interested in your listings.</p>
              <p className="card-stat">{stats?.pending_requests} pending</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/seller/requests')}>
                View requests
              </button>
            </div>
          )}

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-receipt text-success" aria-hidden="true" /> Orders
            </h3>
            <p>Track orders and transactions.</p>
            <p className="card-stat">{stats?.total_orders} total</p>
            <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/orders')}>
              View orders
            </button>
          </div>

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-credit-card text-success" aria-hidden="true" /> Payments
            </h3>
            <p>Transaction history and invoices.</p>
            <p className="card-stat">${stats?.total_payments ?? 0} total</p>
            <button type="button" className="btn btn-outline-secondary fw-bold px-4" disabled>
              Coming soon
            </button>
          </div>

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-gear text-success" aria-hidden="true" /> Settings
            </h3>
            <p>Account and profile preferences.</p>
            <p className="card-stat">Profile</p>
            <button type="button" className="btn btn-outline-secondary fw-bold px-4" onClick={() => navigate('/profile')}>
              Go to profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
