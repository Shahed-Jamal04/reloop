import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function Dashboard({ variant }) {
  const { user } = useAuth();
  const { t } = useTheme();
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
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page dashboard-container">
      <section className="dashboard-hero">
        <div className="container">
          <h2>{t('welcomeBack')}, {user?.name}</h2>
          <p>
            {variant === 'seller'
              ? t('manageListings')
              : t('discoverMaterials')}
          </p>
        </div>
      </section>

      <div className="dashboard-content">
        <div className="quick-stats">
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_listings}</p>
            <p className="quick-stat-label">{variant === 'seller' ? t('approvedListings') : t('activeListings')}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.pending_requests}</p>
            <p className="quick-stat-label">{variant === 'seller' ? t('incomingRequests') : t('pendingRequests')}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.active_orders}</p>
            <p className="quick-stat-label">{t('activeOrders')}</p>
          </div>
          <div className="quick-stat">
            <p className="quick-stat-number">{stats?.items_traded}</p>
            <p className="quick-stat-label">{t('itemsTraded')}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {variant === 'seller' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-card-list text-success" aria-hidden="true" /> {t('myListings')}
              </h3>
              <p>{t('manageTrackListings')}</p>
              <p className="card-stat">{stats?.active_listings} {t('active')}</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/seller/listings')}>
                {t('goToListings')}
              </button>
            </div>
          )}

          {variant === 'buyer' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-bag text-success" aria-hidden="true" /> {t('marketplace')}
              </h3>
              <p>{t('browseSurplus')}</p>
              <p className="card-stat">{t('explore')}</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/marketplace')}>
                {t('browseMaterials')}
              </button>
            </div>
          )}

          {variant === 'buyer' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-chat-left-text text-success" aria-hidden="true" /> {t('myRequests')}
              </h3>
              <p>{t('trackRequests')}</p>
              <p className="card-stat">{stats?.pending_requests} {t('pending')}</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/requests')}>
                {t('viewRequests')}
              </button>
            </div>
          )}

          {variant === 'seller' && (
            <div className="dashboard-card">
              <h3>
                <i className="bi bi-inbox text-success" aria-hidden="true" /> {t('incomingRequests')}
              </h3>
              <p>{t('incomingRequestsDesc')}</p>
              <p className="card-stat">{stats?.pending_requests} {t('pending')}</p>
              <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/seller/requests')}>
                {t('viewRequests')}
              </button>
            </div>
          )}

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-receipt text-success" aria-hidden="true" /> {t('orders')}
            </h3>
            <p>{t('trackOrders')}</p>
            <p className="card-stat">{stats?.total_orders} {t('total')}</p>
            <button type="button" className="btn btn-success fw-bold px-4" onClick={() => navigate('/orders')}>
              {t('viewOrders')}
            </button>
          </div>

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-credit-card text-success" aria-hidden="true" /> {t('payments')}
            </h3>
            <p>{t('mockPayments')}</p>
            <p className="card-stat">${Number(stats?.total_payments ?? 0).toLocaleString()} {t('recorded')}</p>
            <button type="button" className="btn btn-outline-secondary fw-bold px-4" onClick={() => navigate('/orders')}>
              {t('ordersPay')}
            </button>
          </div>

          <div className="dashboard-card">
            <h3>
              <i className="bi bi-gear text-success" aria-hidden="true" /> {t('settings')}
            </h3>
            <p>{t('accountProfile')}</p>
            <p className="card-stat">{t('profile')}</p>
            <button type="button" className="btn btn-outline-secondary fw-bold px-4" onClick={() => navigate('/profile')}>
              {t('goToProfile')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
