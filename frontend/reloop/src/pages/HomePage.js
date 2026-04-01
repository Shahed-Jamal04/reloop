import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsRes = await axios.get(`${API_BASE_URL}/stats`);
        setStats(statsRes.data);

        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE_URL}/stats/categories`);
        setCategories(categoriesRes.data);

        // Fetch testimonials
        const testimonialsRes = await axios.get(`${API_BASE_URL}/stats/testimonials`);
        setTestimonials(testimonialsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        // Set default values if API fails
        setStats({
          materials_available: 0,
          active_sellers: 0,
          tons_saved: 0,
          categories: 0,
        });
        setCategories([]);
        setTestimonials([]);
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
    <div className="home-container">
      {/* Hero Banner with Video */}
      <section className="hero-banner">
        <div className="hero-video-wrapper">
          <video
            autoPlay
            muted
            loop
            className="hero-video"
            poster="https://via.placeholder.com/1920x1080?text=Reloop+Materials"
          >
            <source
              src="https://www.31-agency.com/31New/Requirements/Videos/Banner.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Transform Factory Waste</h1>
          <p className="hero-subtitle">Into Valuable Resources</p>
          <p className="hero-description">
            Reloop the Future • Circular Economy Made Simple
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/marketplace')}
            >
              Browse Materials
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/register?role=seller')}
            >
              Sell Your Waste
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <h3 className="stat-number">{stats?.materials_available.toLocaleString()}+</h3>
            <p className="stat-label">Materials Available</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{stats?.active_sellers.toLocaleString()}+</h3>
            <p className="stat-label">Active Sellers</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{stats?.tons_saved.toLocaleString()}+</h3>
            <p className="stat-label">Tons Saved</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">{stats?.categories}+</h3>
            <p className="stat-label">Categories</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How Reloop Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>List Your Materials</h3>
              <p>Sellers list factory waste materials with photos and details</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Browse & Request</h3>
              <p>Buyers search and request materials that interest them</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Complete Transaction</h3>
              <p>Negotiate and complete the sale with secure payment</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Track Impact</h3>
              <p>See your environmental impact and reduce landfill waste</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="featured-categories">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="categories-grid">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="category-card">
                  <div className="category-icon">📦</div>
                  <h3>{cat.name}</h3>
                  <p>{cat.item_count}+ items</p>
                </div>
              ))
            ) : (
              <p>No categories available</p>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2>What Our Users Say</h2>
          <div className="testimonials-grid">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                  {testimonial.rating != null && (
                    <div className="mb-2">
                      <div className="stars readonly" aria-label={`Rating ${testimonial.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const v = idx + 1;
                          const filled = Number(testimonial.rating) >= v;
                          return (
                            <button
                              key={v}
                              type="button"
                              className={`star-btn${filled ? ' filled' : ''}`}
                              disabled
                              aria-hidden="true"
                              tabIndex={-1}
                            >
                              <i className={`bi ${filled ? 'bi-star-fill' : 'bi-star'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="testimonial-text">"{testimonial.quote}"</p>
                  <p className="testimonial-author">
                    - {testimonial.author_name}, {testimonial.author_role}
                  </p>
                </div>
              ))
            ) : (
              <div className="testimonial-card">
                <p className="testimonial-text">
                  "Reloop made it easy to find quality waste materials for our production. 
                  The process is transparent and reliable."
                </p>
                <p className="testimonial-author">- No testimonials yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Submit Testimonial */}
      <section className="how-it-works" style={{ paddingTop: 40 }}>
        <div className="container">
          <h2 style={{ marginBottom: 20 }}>Share your experience</h2>
          <p style={{ textAlign: 'center', color: '#7f8c8d', marginTop: 0, marginBottom: 30 }}>
            Your testimonial will be reviewed by an admin before it appears publicly.
          </p>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm">
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
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Join the Circular Economy?</h2>
          <p>Start transforming factory waste into valuable resources today</p>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-lg">Get Started</button>
            <button className="btn btn-secondary btn-lg">Learn More</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
