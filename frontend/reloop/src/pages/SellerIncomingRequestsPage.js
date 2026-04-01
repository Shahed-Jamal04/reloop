import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function SellerIncomingRequestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setItems(showAll ? data : data.filter((r) => (r.status || '').toLowerCase() === 'pending'));
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
      setError('Failed to load incoming requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, showAll]);

  const updateStatus = async (id, status) => {
    try {
      setSavingId(id);
      await axios.patch(
        `${API_BASE_URL}/requests/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update status.';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  const badgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-warning text-dark';
    if (s === 'accepted') return 'bg-success';
    if (s === 'rejected') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div>
          <h1 style={{ marginTop: 0 }}>Incoming Requests</h1>
          <p style={{ color: '#5f6b7a' }}>Requests buyers sent for your listings.</p>
        </div>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="showAll"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="showAll">
            Show accepted/rejected
          </label>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!loading && items.length === 0 && <p>No incoming requests yet.</p>}

      {!loading && items.length > 0 && (
        <div className="d-grid gap-3" style={{ maxWidth: 1000 }}>
          {items.map((r) => (
            <div
              key={r.id}
              className="card border-0 shadow-sm"
            >
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                  <strong>{r.material_title}</strong>
                  <span className={`badge ${badgeClass(r.status)}`}>{r.status}</span>
                </div>
                <div className="mt-2" style={{ height: 140, overflow: 'hidden', borderRadius: 12 }}>
                  <img
                    src={resolveAssetUrl(r.material_image)}
                    alt={r.material_title}
                    onError={(e) => {
                      if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div className="text-secondary mt-1">
                  Buyer: {r.buyer_name} {r.buyer_email ? `(${r.buyer_email})` : ''}
                </div>
                {r.message && <div className="mt-2">{r.message}</div>}

                {(r.status || '').toLowerCase() === 'pending' && (
                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <button
                      type="button"
                      className="btn btn-success fw-bold"
                      disabled={savingId === r.id}
                      onClick={() => updateStatus(r.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger fw-bold"
                      disabled={savingId === r.id}
                      onClick={() => updateStatus(r.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerIncomingRequestsPage;

