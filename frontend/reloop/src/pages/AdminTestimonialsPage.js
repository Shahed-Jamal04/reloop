import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div>
          <h1 className="h3 mb-1">Testimonial Approvals</h1>
          <p className="text-secondary mb-0">Approve or reject testimonials before they appear on the home page.</p>
        </div>
        <span className="text-secondary small">{items.length} pending</span>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 mt-3">
          <div className="spinner-border" role="status" aria-label="Loading" />
          <span className="fw-semibold">Loading...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="alert alert-info mt-3" role="alert">
          No pending testimonials.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="row g-3 mt-1">
          {items.map((t) => (
            <div key={t.id} className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="fw-bold">{t.author_name}</div>
                    {t.rating != null && <span className="badge bg-secondary">{t.rating}</span>}
                  </div>
                  {t.author_role && <div className="text-secondary small">{t.author_role}</div>}
                  <div className="mt-3" style={{ whiteSpace: 'pre-wrap' }}>
                    “{t.quote}”
                  </div>

                  <div className="d-flex gap-2 flex-wrap mt-3">
                    <button
                      type="button"
                      className="btn btn-success fw-bold"
                      disabled={savingId === t.id}
                      onClick={() => act(t.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger fw-bold"
                      disabled={savingId === t.id}
                      onClick={() => act(t.id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminTestimonialsPage;

