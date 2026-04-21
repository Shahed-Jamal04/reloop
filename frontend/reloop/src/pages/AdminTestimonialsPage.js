import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function AdminTestimonialsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/admin/testimonials/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load pending testimonials:', err);
      setError('Failed to load pending testimonials.');
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
        `${API_BASE_URL}/admin/testimonials/${id}/${action}`,
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
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h1 className="role-page-title">Testimonial Approvals</h1>
            <p className="role-page-lead mb-0">Approve or reject testimonials before they appear on the home page.</p>
          </div>
          <span className="badge bg-light text-dark fw-semibold">{items.length} pending</span>
        </div>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading pending testimonials…</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-chat-quote" />
          </div>
          <p className="fw-semibold text-secondary mb-1">No pending testimonials</p>
          <p className="text-secondary small mb-0">New submissions will appear here for review.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="row g-3">
          {items.map((t) => (
            <div key={t.id} className="col-12 col-lg-6">
              <article className="ds-surface ds-surface--pad h-100">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div>
                    <div className="fw-bold">{t.author_name}</div>
                    {t.author_role && <div className="text-secondary small">{t.author_role}</div>}
                  </div>
                  {t.rating != null && (
                    <span className="badge text-bg-warning text-dark">
                      <i className="bi bi-star-fill me-1" aria-hidden="true" />
                      {t.rating}
                    </span>
                  )}
                </div>

                <blockquote className="mt-3 mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                  “{t.quote}”
                </blockquote>

                <div className="d-flex gap-2 flex-wrap mt-3">
                  <button
                    type="button"
                    className="btn btn-success fw-bold"
                    disabled={savingId === t.id}
                    onClick={() => act(t.id, 'approve')}
                  >
                    <i className="bi bi-check-lg me-1" aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger fw-bold"
                    disabled={savingId === t.id}
                    onClick={() => act(t.id, 'reject')}
                  >
                    <i className="bi bi-x-lg me-1" aria-hidden="true" />
                    Reject
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminTestimonialsPage;
