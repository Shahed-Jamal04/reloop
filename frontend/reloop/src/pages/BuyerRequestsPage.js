import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function BuyerRequestsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await axios.get(`${API_BASE_URL}/requests/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (err) {
        console.error('Failed to load buyer requests:', err);
        setError('Failed to load your requests.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>My Requests</h1>
      <p style={{ color: '#5f6b7a' }}>Requests you sent to sellers.</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && items.length === 0 && <p>No requests yet.</p>}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
          {items.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'white',
                border: '1px solid rgba(44,62,80,0.12)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{r.material_title}</strong>
                <span style={{ fontWeight: 800, color: '#1f7f49' }}>{r.status}</span>
              </div>
              <div style={{ marginTop: 10, height: 140, overflow: 'hidden', borderRadius: 12 }}>
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
              <div style={{ marginTop: 6, color: '#6b7788' }}>Seller: {r.seller_name}</div>
              {r.message && <div style={{ marginTop: 8 }}>{r.message}</div>}
              <div style={{ marginTop: 10 }}>
                <Link to={`/materials/${r.material_id}`}>View material</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerRequestsPage;

