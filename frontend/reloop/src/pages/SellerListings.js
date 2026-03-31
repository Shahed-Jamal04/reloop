import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Marketplace.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function SellerListings() {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    price: '',
    image: '',
    category_id: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/categories`);
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadListings = async () => {
    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}/materials/me/listings`, {
        headers: authHeaders,
      });
      setListings(response.data);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setError('Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let imagePath = form.image;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const up = await axios.post(`${API_BASE_URL}/uploads/materials-image`, fd, {
          headers: { ...authHeaders },
        });
        imagePath = up.data.path;
      }

      await axios.post(
        `${API_BASE_URL}/materials`,
        {
          ...form,
          image: imagePath,
          quantity: form.quantity ? Number(form.quantity) : null,
          price: form.price ? Number(form.price) : null,
          category_id: form.category_id ? Number(form.category_id) : null,
        },
        { headers: { ...authHeaders, 'Content-Type': 'application/json' } }
      );

      setForm({
        title: '',
        description: '',
        quantity: '',
        price: '',
        image: '',
        category_id: '',
      });
      setImageFile(null);

      await loadListings();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create listing.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'available') return 'bg-success';
    if (s === 'pending') return 'bg-warning text-dark';
    if (s === 'removed' || s === 'rejected') return 'bg-danger';
    return 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center gap-2">
          <div className="spinner-border" role="status" aria-label="Loading" />
          <span className="fw-semibold">Loading your listings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
        <div>
          <h1 className="h3 mb-1">My Listings</h1>
          <p className="text-secondary mb-0">Create listings (pending approval) and manage your stock.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3 mt-1">
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Create new listing</h2>

              <form onSubmit={handleSubmit} className="vstack gap-3">
                <div>
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="e.g. Surplus cotton fabric"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Describe condition, packaging, notes..."
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-semibold">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      placeholder="Optional"
                      value={form.quantity}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label fw-semibold">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      className="form-control"
                      placeholder="Optional"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label fw-semibold">Category</label>
                  <select
                    name="category_id"
                    className="form-select"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select category...
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">New listings are created as <strong>pending</strong> until admin approval.</div>
                </div>

                <div>
                  <label className="form-label fw-semibold">Image</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <div className="form-text">Or provide a URL/path below (optional).</div>
                  <input
                    type="text"
                    name="image"
                    className="form-control"
                    placeholder="Optional (URL or path)"
                    value={form.image}
                    onChange={handleChange}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success fw-bold" disabled={saving}>
                    {saving ? 'Saving...' : 'Create listing'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary fw-bold"
                    disabled={saving}
                    onClick={() =>
                      setForm({
                        title: '',
                        description: '',
                        quantity: '',
                        price: '',
                        image: '',
                        category_id: '',
                      })
                    }
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <h2 className="h5 mb-0">Existing listings</h2>
                <span className="text-secondary small">{listings.length} total</span>
              </div>

              {listings.length === 0 ? (
                <div className="text-secondary mt-3">You have no listings yet.</div>
              ) : (
                <div className="row g-3 mt-1">
                  {listings.map((item) => (
                    <div key={item.id} className="col-12 col-md-6">
                      <div className="card h-100 border-0 shadow-sm">
                        <div style={{ height: 140, overflow: 'hidden' }}>
                          <img
                            src={resolveAssetUrl(item.image)}
                            alt={item.title}
                            loading="lazy"
                            onError={(e) => {
                              if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <div className="fw-bold">{item.title}</div>
                            <span className={`badge ${statusBadgeClass(item.status)}`}>{item.status || '—'}</span>
                          </div>

                          <div className="d-flex gap-2 flex-wrap mt-2">
                            {item.category && <span className="badge text-bg-light border">{item.category}</span>}
                            <span className="badge text-bg-light border">Qty: {item.quantity ?? '—'}</span>
                            {item.price != null && (
                              <span className="badge text-bg-light border">
                                ${Number(item.price).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <p className="text-secondary small mt-2 mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description || 'No description.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerListings;

