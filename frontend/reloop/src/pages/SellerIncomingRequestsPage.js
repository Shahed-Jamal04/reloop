import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import RequestThreadModal from '../components/RequestThreadModal';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function SellerIncomingRequestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [chat, setChat] = useState(null); // { id, title, counterpart }

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
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <h1 className="role-page-title">Incoming requests</h1>
            <p className="role-page-lead mb-0">Respond to buyers who are interested in your listings.</p>
          </div>
          <div className="form-check form-switch text-white">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="showAll"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="showAll">
              Show accepted / rejected
            </label>
          </div>
        </div>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading requests…</span>
        </div>
      )}

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {!loading && items.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-inbox" />
          </div>
          <p className="fw-semibold text-secondary mb-1">No incoming requests</p>
          <p className="text-secondary small mb-0">When buyers request your materials, they will appear here.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="d-grid gap-3">
          {items.map((r) => (
            <article key={r.id} className="ds-surface ds-surface--pad">
              <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-2">
                <strong className="fs-6">{r.material_title}</strong>
                <span className={`badge ${badgeClass(r.status)}`}>{r.status}</span>
              </div>
              <div className="request-card-img mb-2">
                <img
                  src={resolveAssetUrl(r.material_image)}
                  alt=""
                  onError={(e) => {
                    if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="text-secondary small">
                Buyer: {r.buyer_name} {r.buyer_email ? `(${r.buyer_email})` : ''}
              </div>
              {r.message && <p className="mt-2 mb-0 small">{r.message}</p>}

              <div className="d-flex gap-2 flex-wrap mt-3">
                {(r.status || '').toLowerCase() === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success fw-bold"
                      disabled={savingId === r.id}
                      onClick={() => updateStatus(r.id, 'accepted')}
                    >
                      <i className="bi bi-check-lg me-1" aria-hidden="true" />
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger fw-bold"
                      disabled={savingId === r.id}
                      onClick={() => updateStatus(r.id, 'rejected')}
                    >
                      <i className="bi bi-x-lg me-1" aria-hidden="true" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-outline-success fw-semibold ms-auto ms-sm-0"
                  onClick={() => setChat({ id: r.id, title: r.material_title, counterpart: r.buyer_name })}
                >
                  <i className="bi bi-chat-dots me-1" aria-hidden="true" />
                  Message buyer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <RequestThreadModal
        open={!!chat}
        onClose={() => setChat(null)}
        requestId={chat?.id}
        title={chat?.title}
        counterpartName={chat?.counterpart}
      />
    </div>
  );
}

export default SellerIncomingRequestsPage;
