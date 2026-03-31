import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './Marketplace.css';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function MaterialDetail() {
  const { id } = useParams();
  const { isAuthenticated, token, user } = useAuth();
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
        setError('Failed to load item. It may have been removed.');
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
          <p>Loading item...</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="page-shell">
        <div className="container">
          <p style={{ color: 'red' }}>{error || 'Item not found.'}</p>
          <Link to="/marketplace" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← Back to marketplace
          </Link>
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
      setRequestSuccess('Request sent to seller.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send request.';
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
            <p className="page-subtitle">{material.description || 'No description provided.'}</p>
          </div>
          <div className="header-actions">
            <Link to="/marketplace" className="link-btn">
              ← Back
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
                <p className="kv-label">Quantity</p>
                <p className="kv-value">{material.quantity ?? '—'}</p>
              </div>
              <div className="kv">
                <p className="kv-label">Price</p>
                <p className="kv-value">{material.price != null ? `$${Number(material.price).toLocaleString()}` : '—'}</p>
              </div>
              <div className="kv">
                <p className="kv-label">Seller</p>
                <p className="kv-value">{material.seller_name || '—'}</p>
              </div>
              <div className="kv">
                <p className="kv-label">Contact</p>
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
                    placeholder="Message to seller (optional)"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(44,62,80,0.18)',
                      padding: 12,
                      fontFamily: 'inherit',
                    }}
                  />
                  <button className="primary-btn" disabled={requestLoading} onClick={submitRequest}>
                    {requestLoading ? 'Sending...' : 'Send request'}
                  </button>
                  {requestSuccess && <div style={{ color: '#1f7f49', fontWeight: 800 }}>{requestSuccess}</div>}
                </div>
              ) : (
                <button className="primary-btn" disabled>
                  Login as buyer to request
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

