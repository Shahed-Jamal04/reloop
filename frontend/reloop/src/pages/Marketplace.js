import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import './Marketplace.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function priceInRange(price, range) {
  if (range === 'all') return true;
  const p = price == null ? NaN : Number(price);
  if (Number.isNaN(p)) return false;
  switch (range) {
    case '0-20':
      return p >= 0 && p <= 20;
    case '20-50':
      return p > 20 && p <= 50;
    case '50-100':
      return p > 50 && p <= 100;
    case '100+':
      return p > 100;
    default:
      return true;
  }
}

export function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('latest');
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [matRes, catRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/materials`),
          axios.get(`${API_BASE_URL}/stats/categories`).catch(() => ({ data: [] })),
        ]);
        setMaterials(matRes.data || []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
        setError('Failed to load marketplace items. Please try again later.');
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (materials || []).filter((m) => {
      if (selectedCategory && (m.category || '') !== selectedCategory) return false;
      if (!priceInRange(m.price, priceRange)) return false;
      if (!q) return true;
      const hay = [m.title, m.description, m.category, m.seller_name, m.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    list = [...list];
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-high':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'latest':
      default:
        list.sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }));
        break;
    }
    return list;
  }, [materials, query, selectedCategory, sortBy, priceRange]);

  const hasActiveFilters =
    query.trim() !== '' || selectedCategory !== '' || priceRange !== 'all' || sortBy !== 'latest';

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setPriceRange('all');
    setSortBy('latest');
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="browse-page">
        <div className="container py-5">
          <p className="text-secondary mb-0">Loading materials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-top border-bottom bg-white">
        <div className="container py-4 py-md-5">
          <h1 className="browse-top-title">Browse Materials</h1>
          <p className="browse-top-desc mb-0">
            Discover sustainable surplus materials from businesses and individuals.
          </p>
        </div>
      </div>

      <div className="container py-4 py-md-5">
        <div className="browse-filters">
          <div className="browse-filters-head">
            <i className="bi bi-sliders" aria-hidden="true" />
            <span>Filters &amp; Search</span>
          </div>

          <div className="row g-3">
            <div className="col-md-6 col-xl-3">
              <div className="browse-input-wrap">
                <i className="bi bi-search browse-input-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="form-control browse-input"
                  placeholder="Search materials..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search materials"
                />
              </div>
            </div>
            <div className="col-md-6 col-xl-3">
              <select
                className="form-select browse-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 col-xl-3">
              <select
                className="form-select browse-select"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                aria-label="Price range"
              >
                <option value="all">All Prices</option>
                <option value="0-20">$0 – $20</option>
                <option value="20-50">$20 – $50</option>
                <option value="50-100">$50 – $100</option>
                <option value="100+">$100+</option>
              </select>
            </div>
            <div className="col-md-6 col-xl-3">
              <select
                className="form-select browse-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort by"
              >
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn-outline-secondary btn-sm mt-3" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        <p className="browse-results-count text-secondary mb-4">
          Showing <span className="fw-semibold text-dark">{filtered.length}</span> materials
        </p>

        {filtered.length > 0 ? (
          <div className="browse-grid">
            {filtered.map((item) => (
              <Link key={item.id} to={`/materials/${item.id}`} className="market-card">
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
                    <h2 className="card-title">{item.title}</h2>
                    {item.category && <span className="pill-badge">{item.category}</span>}
                  </div>
                  <p className="card-desc">{item.description || 'No description provided.'}</p>
                  <div className="card-row">
                    <span className="meta">
                      <i className="bi bi-box-seam me-1" aria-hidden="true" />
                      Qty {item.quantity ?? '—'}
                    </span>
                    {item.price != null && <span className="price">${Number(item.price).toLocaleString()}</span>}
                  </div>
                  {item.seller_name && (
                    <p className="seller mb-0">
                      <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                      {item.seller_name}
                    </p>
                  )}
                  <div className="card-cta">
                    <span className="btn btn-success btn-sm fw-semibold">View details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="browse-empty text-center py-5">
            <div className="browse-empty-icon mx-auto mb-4">
              <i className="bi bi-search" aria-hidden="true" />
            </div>
            <h2 className="h4 fw-semibold mb-2">No materials found</h2>
            <p className="text-secondary mb-4">Try adjusting your filters or search query.</p>
            <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
