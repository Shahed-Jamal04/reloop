import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Marketplace.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function Marketplace() {
  const [materials, setMaterials] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setError('');
        const response = await axios.get(`${API_BASE_URL}/materials`);
        setMaterials(response.data);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
        setError('Failed to load marketplace items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="container">
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? materials.filter((m) => {
        const hay = [
          m.title,
          m.description,
          m.category,
          m.seller_name,
          m.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
    : materials;

  return (
    <div className="page-shell">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Marketplace</h1>
            <p className="page-subtitle">
              Browse leftover stock from factories and brands. Search by title, category, seller, or status.
            </p>
          </div>
          <div className="header-actions">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search materials..."
            />
            <Link to="/" className="link-btn">
              Back to Home
            </Link>
          </div>
        </div>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

        {filtered.length === 0 ? (
          <p style={{ marginTop: '2rem' }}>No items available yet. Check back soon.</p>
        ) : (
          <div className="grid">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to={`/materials/${item.id}`}
                className="card"
              >
                <div className="card-media">
                  <img
                    src={resolveAssetUrl(item.image)}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="card-body">
                  <div className="card-top">
                    <h3 className="card-title">{item.title}</h3>
                    {item.category && <span className="pill-badge">{item.category}</span>}
                  </div>

                  <p className="card-desc">{item.description || 'No description provided.'}</p>

                  <div className="card-row">
                    <span className="meta">
                      Qty: {item.quantity ?? '—'} · {item.status || '—'}
                    </span>
                    {item.price != null && (
                      <span className="price">${Number(item.price).toLocaleString()}</span>
                    )}
                  </div>

                  {item.seller_name && <p className="seller">Seller: {item.seller_name}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;

