import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function AdminApprovalsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/admin/materials/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
      setError('Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const act = async (id, action) => {
    try {
      setSavingId(id);
      await axios.patch(
        `${API_BASE_URL}/admin/materials/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      const msg = err.response?.data?.error || 'Action failed.';
      setError(msg);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">Approvals</h1>
        <p className="role-page-lead mb-0">Approve or reject new listings before they appear in the marketplace.</p>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading pending listings…</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-clipboard-check" />
          </div>
          <p className="fw-semibold text-secondary mb-1">No pending listings</p>
          <p className="text-secondary small mb-0">When sellers create new listings, they will appear here for approval.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="d-grid gap-3">
          {items.map((m) => (
            <article key={m.id} className="ds-surface ds-surface--pad">
              <div className="d-flex justify-content-between gap-2 flex-wrap align-items-start mb-2">
                <strong className="fs-6">{m.title}</strong>
                <span className="badge bg-warning text-dark">{m.status || 'pending'}</span>
              </div>

              <div className="request-card-img mb-2">
                <img
                  src={resolveAssetUrl(m.image)}
                  alt=""
                  onError={(e) => {
                    if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              <div className="text-secondary small">
                Seller: {m.seller_name} {m.seller_email ? `(${m.seller_email})` : ''}
              </div>
              <div className="d-flex gap-2 flex-wrap mt-2">
                {m.category && <span className="badge text-bg-light border">{m.category}</span>}
                {m.price != null && (
                  <span className="badge text-bg-light border">${Number(m.price).toLocaleString()}</span>
                )}
                {m.quantity != null && <span className="badge text-bg-light border">Qty: {m.quantity}</span>}
              </div>

              {m.description && <p className="text-secondary small mt-2 mb-0 line-clamp-2">{m.description}</p>}

              <div className="d-flex gap-2 flex-wrap mt-3">
                <button
                  type="button"
                  className="btn btn-success fw-bold"
                  disabled={savingId === m.id}
                  onClick={() => act(m.id, 'approve')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger fw-bold"
                  disabled={savingId === m.id}
                  onClick={() => act(m.id, 'reject')}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminApprovalsPage;

