import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
    <div>
      <h1 style={{ marginTop: 0 }}>Approvals</h1>
      <p style={{ color: '#5f6b7a' }}>Approve or reject new listings before they appear in the marketplace.</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && items.length === 0 && <p>No pending listings.</p>}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'white',
                border: '1px solid rgba(44,62,80,0.12)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{m.title}</strong>
                <span style={{ fontWeight: 800, color: '#6b7788' }}>{m.status}</span>
              </div>
              <div style={{ marginTop: 6, color: '#6b7788' }}>
                Seller: {m.seller_name} {m.seller_email ? `(${m.seller_email})` : ''}
              </div>
              {m.category && <div style={{ marginTop: 6 }}>Category: <strong>{m.category}</strong></div>}
              {m.description && <div style={{ marginTop: 8 }}>{m.description}</div>}

              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={savingId === m.id}
                  onClick={() => act(m.id, 'approve')}
                  style={{ padding: '10px 12px', borderRadius: 12, border: 'none', background: '#27ae60', color: 'white', fontWeight: 800 }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={savingId === m.id}
                  onClick={() => act(m.id, 'reject')}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(44,62,80,0.18)', background: 'white', fontWeight: 800 }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminApprovalsPage;

