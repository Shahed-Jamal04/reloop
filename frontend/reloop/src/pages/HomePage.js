import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tForm, setTForm] = useState({
    author_name: '',
    author_role: '',
    quote: '',
    rating: '',
  });
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tSuccess, setTSuccess] = useState('');
  const [tError, setTError] = useState('');
  const [ratingHover, setRatingHover] = useState(null);
  const [ratingPopAt, setRatingPopAt] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE_URL}/stats/categories`);
        setCategories(categoriesRes.data);

        // Fetch testimonials
        const testimonialsRes = await axios.get(`${API_BASE_URL}/stats/testimonials`);
        setTestimonials(testimonialsRes.data);

        // Featured materials (use marketplace list, show first 6)
        const materialsRes = await axios.get(`${API_BASE_URL}/materials`);
        setFeatured((materialsRes.data || []).slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setCategories([]);
        setTestimonials([]);
        setFeatured([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* HERO (green) */}
      <section className="hero">
        <div className="hero-video-wrap" aria-hidden="true">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="https://via.placeholder.com/1920x900?text=Reloop"
          >
            <source src="https://www.31-agency.com/31New/Requirements/Videos/Banner.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-dim" />
        </div>
        <div className="container py-5">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1 className="hero-title">Turn Surplus into Success</h1>
              <p className="hero-desc">
                Join the circular economy revolution. Exchange surplus materials, reduce waste, and create value from
                what others no longer need.
              </p>
              <div className="d-flex gap-2 flex-wrap mt-3">
                <button className="btn btn-light text-success fw-bold px-4" onClick={() => navigate('/register')}>
                  Get Started
                </button>
                <button className="btn btn-outline-light fw-bold px-4" onClick={() => navigate('/marketplace')}>
                  Browse Materials
                </button>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="section py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Get Started Today</h2>
            <p className="section-subtitle">
              Whether you're looking to buy sustainable materials or sell your surplus, we've got you covered.
            </p>
          </div>

          <div className="row g-3 justify-content-center">
            <div className="col-12 col-lg-5">
              <div className="start-card">
                <div className="start-icon">
                  <i className="bi bi-bag-check" />
                </div>
                <div className="start-body">
                  <div className="start-title">I'm a Buyer</div>
                  <div className="start-text">
                    Find high-quality surplus materials at competitive prices. Save money while supporting sustainability.
                  </div>
                  <button className="btn btn-dark fw-bold w-100 mt-3" onClick={() => navigate('/marketplace')}>
                    Browse Materials
                  </button>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="start-card">
                <div className="start-icon soft">
                  <i className="bi bi-plus-square" />
                </div>
                <div className="start-body">
                  <div className="start-title">I'm a Seller</div>
                  <div className="start-text">
                    Turn your surplus materials into revenue. Reduce waste and connect with buyers who need what you have.
                  </div>
                  <button className="btn btn-dark fw-bold w-100 mt-3" onClick={() => navigate('/seller/listings')}>
                    List Materials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIND WHAT YOU NEED */}
      <section className="section section-muted py-5">
        <div className="container">
          <div className="text-center mb-3">
            <h2 className="section-title">Find What You Need</h2>
            <p className="section-subtitle">Search materials and filter by category.</p>
          </div>

          <div className="find-bar mx-auto">
            <i className="bi bi-search" aria-hidden="true" />
            <input
              className="find-input"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-dark fw-bold px-4"
              onClick={() =>
                navigate(search.trim() ? `/marketplace?search=${encodeURIComponent(search.trim())}` : '/marketplace')
              }
            >
              Search Materials
            </button>
          </div>
        </div>
      </section>

      {/* BROWSE BY CATEGORY */}
      <section className="section py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Browse by Category</h2>
          </div>

          <div className="cat-row">
            {(categories || []).slice(0, 8).map((c) => (
              <button key={c.id} type="button" className="cat-pill" onClick={() => navigate('/marketplace')}>
                <span className="cat-ico" aria-hidden="true">
                  <i className="bi bi-grid-3x3-gap" />
                </span>
                <span className="cat-name">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED MATERIALS */}
      <section className="section py-5">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between gap-3 flex-wrap mb-3">
            <div>
              <h2 className="section-title mb-1">Featured Materials</h2>
              <p className="section-subtitle mb-0">Latest additions to our marketplace</p>
            </div>
            <button className="btn btn-outline-secondary fw-bold" onClick={() => navigate('/marketplace')}>
              View all
            </button>
          </div>

          <div className="row g-3">
            {featured.length === 0 ? (
              <div className="col-12">
                <div className="surface p-4 text-center text-secondary">No featured materials yet.</div>
              </div>
            ) : (
              featured.map((m) => (
                <div key={m.id} className="col-12 col-md-6 col-lg-4">
                  <button type="button" className="feat-card" onClick={() => navigate(`/materials/${m.id}`)}>
                    <div className="feat-img">
                      <img
                        src={resolveAssetUrl(m.image)}
                        alt={m.title}
                        onError={(e) => {
                          if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                    <div className="feat-body">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="feat-title">{m.title}</div>
                        {m.category && <span className="pill-badge">{m.category}</span>}
                      </div>
                      <div className="feat-meta">
                        <span className="feat-price">
                          {m.price != null ? `$${Number(m.price).toLocaleString()}` : '—'}
                        </span>
                        <span className="text-secondary small">Qty {m.quantity ?? '—'}</span>
                      </div>
                      <div className="feat-actions">
                        <span className="btn btn-dark btn-sm fw-bold">View Details</span>
                      </div>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-muted py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Getting started with Reloop is simple. Follow these three easy steps to start exchanging materials.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="how-card">
                <div className="how-ico">
                  <i className="bi bi-box-seam" />
                </div>
                <div className="how-title">Add Materials</div>
                <div className="how-text">
                  List your surplus materials with photos, descriptions, and pricing. It's quick and easy!
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="how-card">
                <div className="how-ico">
                  <i className="bi bi-search" />
                </div>
                <div className="how-title">Send Requests</div>
                <div className="how-text">
                  Browse materials and send requests to sellers. Communicate directly to discuss details.
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="how-card">
                <div className="how-ico">
                  <i className="bi bi-check2-circle" />
                </div>
                <div className="how-title">Complete Orders</div>
                <div className="how-text">
                  Finalize the transaction and arrange delivery. Build sustainable business relationships!
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary fw-bold px-4" onClick={() => navigate('/register')}>
              Start Your Journey
            </button>
          </div>
        </div>
      </section>

      {/* SUBMIT TESTIMONIAL */}
      <section className="section section-muted py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title">Share your experience</h2>
            <p className="section-subtitle">Your testimonial will be reviewed by an admin before it appears publicly.</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="surface p-0 shadow-soft">
                <div className="card-body">
                  {tError && (
                    <div className="alert alert-danger" role="alert">
                      {tError}
                    </div>
                  )}
                  {tSuccess && (
                    <div className="alert alert-success" role="alert">
                      {tSuccess}
                    </div>
                  )}

                  <form
                    className="vstack gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setTSubmitting(true);
                      setTError('');
                      setTSuccess('');
                      try {
                        await axios.post(`${API_BASE_URL}/testimonials`, {
                          author_name: tForm.author_name,
                          author_role: tForm.author_role,
                          quote: tForm.quote,
                          rating: tForm.rating === '' ? null : Number(tForm.rating),
                        });
                        setTForm({ author_name: '', author_role: '', quote: '', rating: '' });
                        setTSuccess('Thanks! Your testimonial was submitted and is pending approval.');
                      } catch (err) {
                        const msg = err.response?.data?.error || 'Failed to submit testimonial.';
                        setTError(msg);
                      } finally {
                        setTSubmitting(false);
                      }
                    }}
                  >
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Name</label>
                        <input
                          className="form-control"
                          value={tForm.author_name}
                          onChange={(e) => setTForm((p) => ({ ...p, author_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Role (optional)</label>
                        <input
                          className="form-control"
                          value={tForm.author_role}
                          onChange={(e) => setTForm((p) => ({ ...p, author_role: e.target.value }))}
                          placeholder="Buyer / Factory Owner / Manager..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label fw-semibold">Testimonial</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={tForm.quote}
                        onChange={(e) => setTForm((p) => ({ ...p, quote: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="row g-2 align-items-end">
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Rating (optional)</label>
                        <div
                          className="stars"
                          onMouseLeave={() => setRatingHover(null)}
                          aria-label="Star rating"
                        >
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const v = idx + 1;
                            const current = tForm.rating === '' ? null : Number(tForm.rating);
                            const display = ratingHover != null ? ratingHover : current;
                            const filled = display != null && display >= v;
                            return (
                              <button
                                key={v}
                                type="button"
                                className={`star-btn${filled ? ' filled' : ''}${ratingPopAt === v ? ' pop' : ''}`}
                                onMouseEnter={() => setRatingHover(v)}
                                onClick={() => {
                                  setTForm((p) => ({ ...p, rating: String(v) }));
                                  setRatingPopAt(v);
                                  window.setTimeout(() => setRatingPopAt(null), 240);
                                }}
                                aria-label={`${v} star`}
                                disabled={tSubmitting}
                              >
                                <i className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`} />
                              </button>
                            );
                          })}
                          <span className="rating-hint">
                            {tForm.rating === '' ? 'No rating' : `${tForm.rating}/5`}
                          </span>
                          {tForm.rating !== '' && (
                            <button
                              type="button"
                              className="btn btn-link p-0 ms-2 small"
                              onClick={() => setTForm((p) => ({ ...p, rating: '' }))}
                              disabled={tSubmitting}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-12 col-md-8">
                        <button type="submit" className="btn btn-success fw-bold w-100" disabled={tSubmitting}>
                          {tSubmitting ? 'Submitting...' : 'Submit testimonial'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-green">
        <div className="container">
          <div className="cta-inner">
            <div>
              <div className="cta-title">Ready to Make a Difference?</div>
              <div className="cta-text">
                Join thousands of businesses and individuals reducing waste and creating value through the circular economy.
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-light text-success fw-bold px-4" onClick={() => navigate('/register')}>
                Create Free Account
              </button>
              <button className="btn btn-outline-light fw-bold px-4" onClick={() => navigate('/marketplace')}>
                Explore Platform
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
