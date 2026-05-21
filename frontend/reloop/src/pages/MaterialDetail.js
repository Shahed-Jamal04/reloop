import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './Marketplace.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatListingPrice } from '../utils/materialPricing';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function MaterialDetail() {
  const { id } = useParams();
  const { isAuthenticated, token, user } = useAuth();
  const { t } = useTheme();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setError('');
        const response = await axios.get(`${API_BASE_URL}/materials/${id}`);
        setMaterial(response.data);
      } catch (err) {
        console.error('Failed to load material:', err);
        setError(t('failedLoadItem'));
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="container">
          <p>{t('loadingItem')}</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="page-shell">
        <div className="container">
          <p className="text-danger">{error || t('itemNotFound')}</p>
          <div className="d-flex flex-wrap gap-3 mt-3">
            <Link to="/">{t('home')}</Link>
            <Link to="/marketplace">{t('backToMarketplace')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const canRequest = isAuthenticated && user?.role === 'buyer';

  const submitRequest = async () => {
    try {
      setRequestLoading(true);
      setRequestSuccess('');
      await axios.post(
        `${API_BASE_URL}/requests`,
        { material_id: Number(id), message: requestMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestMessage('');
      setRequestSuccess(t('requestSentSuccess'));
    } catch (err) {
      const msg = err.response?.data?.error || t('failedSendRequest');
      setError(msg);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">{material.title}</h1>
            <p className="page-subtitle">{material.description || t('noDescription')}</p>
          </div>
          <div className="header-actions d-flex flex-wrap gap-2">
            <Link to="/" className="link-btn">
              ← {t('home')}
            </Link>
            <Link to="/marketplace" className="link-btn">
              {t('browseMaterials')}
            </Link>
          </div>
        </div>

        <div className="detail-layout">
          <div className="detail-media">
            <img
              src={resolveAssetUrl(material.image)}
              alt={material.title}
              onError={(e) => {
                if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="detail-card">
            <div className="card-row">
              {material.category && <span className="pill-badge">{material.category}</span>}
              <span className="badge bg-secondary">{material.status || '—'}</span>
            </div>

            <div className="detail-kv">
              <div className="kv">
                <p className="kv-label">{t('quantity')}</p>
                <p className="kv-value">{material.quantity ?? '—'}</p>
              </div>
              <div className="kv">
                <p className="kv-label">{t('priceTotal')}</p>
                <p className="kv-value">{formatListingPrice(material.price, material.quantity, t)}</p>
              </div>
              <div className="kv">
                <p className="kv-label">{t('seller')}</p>
                <p className="kv-value">{material.seller_name || '—'}</p>
              </div>
              <div className="kv">
                <p className="kv-label">{t('contactLabel')}</p>
                <p className="kv-value">{material.seller_email || '—'}</p>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              {canRequest ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                    className="form-control"
                    placeholder={t('messageToSellerPlaceholder')}
                  />
                  <button className="primary-btn" disabled={requestLoading} onClick={submitRequest}>
                    {requestLoading ? t('sending') : t('sendRequest')}
                  </button>
                  {requestSuccess && <div className="text-success fw-bold">{requestSuccess}</div>}
                </div>
              ) : (
                <button className="primary-btn" disabled>
                  {t('loginAsBuyerToRequest')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaterialDetail;

