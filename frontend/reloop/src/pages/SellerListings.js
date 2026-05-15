import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Marketplace.css';
import './rolePages.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function SellerListings() {
  const { token } = useAuth();
  const { t } = useTheme();
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
      setError(t('failedLoadListings'));
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
      const msg = err.response?.data?.error || t('failedAddListing');
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
      <div className="role-page py-4 px-3">
        <div className="d-flex align-items-center gap-2 py-5 justify-content-center text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label={t('loading')} />
          <span className="fw-semibold">{t('loadingListings')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">{t('myListings')}</h1>
        <p className="role-page-lead mb-0">{t('manageListingsDesc')}</p>
      </header>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="ds-surface ds-surface--pad h-100">
            <h2 className="h5 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle text-success" aria-hidden="true" />
              {t('createNewListing')}
            </h2>

            <form onSubmit={handleSubmit} className="vstack gap-3">
              <div>
                <label className="form-label fw-semibold">{t('title')}</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  placeholder={t('egSurplusCotton')}
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label fw-semibold">{t('description')}</label>
                <textarea
                  name="description"
                  className="form-control"
                  placeholder={t('describeCondition')}
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="row g-2">
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">{t('quantity')}</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    placeholder={t('optional')}
                    value={form.quantity}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold">{t('price')}</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    className="form-control"
                    placeholder={t('optional')}
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="form-label fw-semibold">{t('category')}</label>
                <select
                  name="category_id"
                  className="form-select"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    {t('selectCategory')}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="form-text">{t('listingPendingHelp')}</div>
              </div>

              <div>
                <label className="form-label fw-semibold">{t('image')}</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <div className="form-text">{t('orProvideUrl')}</div>
                <input
                  type="text"
                  name="image"
                  className="form-control mt-2"
                  placeholder={t('optionalUrl')}
                  value={form.image}
                  onChange={handleChange}
                />
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button type="submit" className="btn btn-success fw-bold" disabled={saving}>
                  {saving ? t('saving') : t('createNewListing')}
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
                  {t('clear')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="ds-surface ds-surface--pad h-100">
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
              <h2 className="h5 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-grid-3x3-gap text-success" aria-hidden="true" />
                {t('existingListings')}
              </h2>
              <span className="text-secondary small">{listings.length} {t('total')}</span>
            </div>

            {listings.length === 0 ? (
              <div className="empty-state py-4">
                <div className="empty-state-icon" aria-hidden="true">
                  <i className="bi bi-box-seam" />
                </div>
                <p className="fw-semibold text-secondary mb-1">{t('noListings')}</p>
                <p className="text-secondary small mb-0">{t('emptyListingsMessage')}</p>
              </div>
            ) : (
              <div className="row g-3">
                {listings.map((item) => (
                  <div key={item.id} className="col-12 col-md-6">
                    <div className="card h-100 border-0 shadow-sm overflow-hidden">
                      <div className="listing-thumb">
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
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="fw-bold line-clamp-2">{item.title}</div>
                          <span className={`badge flex-shrink-0 ${statusBadgeClass(item.status)}`}>{item.status || '—'}</span>
                        </div>

                        <div className="d-flex gap-2 flex-wrap mt-2">
                          {item.category && <span className="badge text-bg-light border">{item.category}</span>}
                          <span className="badge text-bg-light border">{t('qty')}: {item.quantity ?? '—'}</span>
                          {item.price != null && (
                            <span className="badge text-bg-light border">
                              ${Number(item.price).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-secondary small mt-2 mb-0 line-clamp-2">
                          {item.description || t('noDescription')}
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
  );
}

export default SellerListings;
