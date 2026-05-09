import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import './HomePage.css';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import { categoryIconClass } from '../utils/categoryIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/** Shown when no approved testimonials exist yet (same layout as real cards). */
const PLACEHOLDER_TESTIMONIALS = [
  {
    id: 'ph-1',
    _placeholder: true,
    quote:
      'RecycleX made it easy to find quality surplus materials for our production. The process is transparent and reliable.',
    author_name: 'Sarah Chen',
    author_role: 'Operations Manager',
    rating: 5,
  },
  {
    id: 'ph-2',
    _placeholder: true,
    quote:
      'We cleared warehouse space and recovered value on materials we could not use anymore. Highly recommended for factories.',
    author_name: 'Marcus Webb',
    author_role: 'Plant Director',
    rating: 5,
  },
  {
    id: 'ph-3',
    _placeholder: true,
    quote:
      'Great way to connect with buyers who actually need what we list. Support for requests keeps everything organized.',
    author_name: 'Elena Ruiz',
    author_role: 'Sustainability Lead',
    rating: 4,
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTheme();
  const role = user?.role || 'buyer';
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const reduceMotion = useReducedMotion();

  const m = useMemo(() => {
    const hero = reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6 },
        };
    const fadeUp = (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6, delay },
          };
    const slideX = (fromX, delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, x: fromX },
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6, delay },
          };
    const staggerY = (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.15 },
            transition: { duration: 0.4, delay },
          };
    const scaleIn = (delay = 0) =>
      reduceMotion
        ? {}
        : {
            initial: { opacity: 0, scale: 0.9 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true, amount: 0.12 },
            transition: { duration: 0.4, delay },
          };
    return { hero, fadeUp, slideX, staggerY, scaleIn };
  }, [reduceMotion]);

  const runSearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`);
  };

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

  const goListMaterials = () => {
    if (!isAuthenticated) {
      navigate('/register?role=seller');
      return;
    }
    if (role === 'seller') {
      navigate('/seller/listings');
      return;
    }
    navigate('/register?role=seller');
  };

  if (loading) {
    return (
      <div className="home-container">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p>{t('loading')}</p>
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
            poster="https://via.placeholder.com/1920x900?text=RecycleX"
          >
            <source src="https://www.31-agency.com/31New/Requirements/Videos/Banner.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-dim" />
        </div>
        <div className="container py-5">
          <div className="hero-inner">
            <motion.div className="hero-copy" {...m.hero}>
              <h1 className="hero-title">{t('turnSurplusIntoSuccess')}</h1>
              <p className="hero-desc">
                {t('joinCircularEconomy')}
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 mt-3">
                <button className="btn btn-light text-success fw-bold px-4 py-2" onClick={() => navigate('/register')}>
                  {t('getStarted')}
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </button>
                <button
                  className="btn btn-outline-light fw-bold px-4 py-2"
                  onClick={() => navigate('/marketplace')}
                >
                  {t('browseMaterials')}
                </button>
              </div>
            </motion.div>
            {/* <div className="hero-art" aria-hidden="true" /> */}
          </div>
        </div>
      </section>

      {/* GET STARTED — matches design: pastel icon circles, slide-in, shadow hover */}
      <section className="section section-gray py-5">
        <div className="container">
          <motion.div className="text-center mb-4 mb-md-5" {...m.fadeUp(0)}>
            <h2 className="section-title">{t('getStartedToday')}</h2>
            <p className="section-subtitle">
              {t('getStartedSubtitle')}
            </p>
          </motion.div>

          <div className="row g-4 justify-content-center align-items-stretch start-cards-row max-w-start mx-auto">
            <div className="col-12 col-md-10 col-lg-6 d-flex">
              <motion.div className="start-card start-card--buyer w-100" {...m.slideX(-20, 0.1)}>
                <div className="start-icon-wrap start-icon-wrap--buyer" aria-hidden="true">
                  <i className="bi bi-cart3" />
                </div>
                <div className="start-body">
                  <h3 className="start-title">{t('imABuyer')}</h3>
                  <p className="start-text">
                    {t('buyerDesc')}
                  </p>
                  <div className="start-actions">
                    <button
                      type="button"
                      className="btn btn-success start-cta fw-bold w-100"
                      onClick={() => navigate('/marketplace')}
                    >
                      Browse Materials
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="col-12 col-md-10 col-lg-6 d-flex">
              <motion.div className="start-card start-card--seller w-100" {...m.slideX(20, 0.2)}>
                <div className="start-icon-wrap start-icon-wrap--seller" aria-hidden="true">
                  <i className="bi bi-shop" />
                </div>
                <div className="start-body">
                  <h3 className="start-title">{t('imASeller')}</h3>
                  <p className="start-text">
                    {t('sellerDesc')}
                  </p>
                  <div className="start-actions">
                    <button type="button" className="btn btn-success start-cta fw-bold w-100" onClick={goListMaterials}>
                      {t('listYourMaterials')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FIND WHAT YOU NEED */}
      <section className="section section-white py-5">
        <div className="container">
          <motion.div className="find-panel mx-auto" {...m.fadeUp(0)}>
            <h2 className="section-title text-center mb-4">{t('findWhatYouNeed')}</h2>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <div className="find-input-wrap">
                  <i className="bi bi-search find-input-icon" aria-hidden="true" />
                  <input
                    className="find-input-control"
                    placeholder={t('searchMaterials')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select find-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Category filter"
                >
                  <option value="">{t('allCategories')}</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <button type="button" className="btn btn-success btn-lg fw-bold w-100 find-search-btn" onClick={runSearch}>
                  {t('searchMaterialsBtn')}
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BROWSE BY CATEGORY */}
      <section className="section section-gray py-5">
        <div className="container">
          <motion.div className="text-center mb-4 mb-md-5" {...m.fadeUp(0)}>
            <h2 className="section-title">{t('browseByCategory')}</h2>
          </motion.div>

          <div className="home-cat-grid">
            {(categories || []).slice(0, 8).map((c, index) => (
              <motion.div key={c.id} {...m.scaleIn(index * 0.05)}>
                <button
                  type="button"
                  className="cat-tile"
                  onClick={() => navigate(`/marketplace?category=${encodeURIComponent(c.name)}`)}
                >
                  <span className="cat-tile-ico" aria-hidden="true">
                    <i className={categoryIconClass(c.icon)} />
                  </span>
                  <span className="cat-tile-name">{c.name}</span>
                  <span className="cat-tile-count">{c.item_count != null ? `${c.item_count} ${t('items')}` : ''}</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED MATERIALS */}
      <section className="section section-white py-5">
        <div className="container">
          <motion.div className="d-flex align-items-end justify-content-between gap-3 flex-wrap mb-4" {...m.fadeUp(0)}>
            <div>
              <h2 className="section-title mb-1">{t('featuredMaterials')}</h2>
              <p className="section-subtitle section-subtitle--lead mb-0">{t('latestAdditions')}</p>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary fw-bold feat-view-all"
              onClick={() => navigate('/marketplace')}
            >
              {t('viewAll')}
              <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
            </button>
          </motion.div>

          <div className="row g-3 g-md-4">
            {featured.length === 0 ? (
              <div className="col-12">
                <div className="surface p-4 text-center text-secondary">{t('noFeaturedMaterials')}</div>
              </div>
            ) : (
              featured.map((material, index) => (
                <motion.div key={material.id} className="col-12 col-md-6 col-lg-4" {...m.staggerY(index * 0.1)}>
                  <button type="button" className="feat-card" onClick={() => navigate(`/materials/${material.id}`)}>
                    <div className="feat-img">
                      <img
                        src={resolveAssetUrl(material.image)}
                        alt={material.title}
                        onError={(e) => {
                          if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                    <div className="feat-body">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="feat-title">{material.title}</div>
                        {material.category && <span className="pill-badge">{material.category}</span>}
                      </div>
                      <div className="feat-meta">
                        <span className="feat-price">
                          {material.price != null ? `$${Number(material.price).toLocaleString()}` : '—'}
                        </span>
                        <span className="text-secondary small">{t('qty')} {material.quantity ?? '—'}</span>
                      </div>
                      <div className="feat-actions">
                        <span className="btn btn-dark btn-sm fw-bold">{t('viewDetails')}</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-how py-5">
        <div className="container">
          <motion.div className="text-center mb-4 mb-md-5" {...m.fadeUp(0)}>
            <h2 className="section-title">{t('howItWorks')}</h2>
            <p className="section-subtitle">
              {t('howItWorksSubtitle')}
            </p>
          </motion.div>

          <div className="row g-4 justify-content-center how-steps-row">
            <div className="col-12 col-md-4">
              <motion.div className="how-step text-center" {...m.fadeUp(0.1)}>
                <div className="how-step-ring">
                  <i className="bi bi-cloud-upload how-step-icon how-step-icon--green" aria-hidden="true" />
                </div>
                <div className="how-step-badge how-step-badge--green">1</div>
                <div className="how-title">{t('addMaterials')}</div>
                <div className="how-text">
                  {t('addMaterialsDesc')}
                </div>
              </motion.div>
            </div>
            <div className="col-12 col-md-4">
              <motion.div className="how-step text-center" {...m.fadeUp(0.2)}>
                <div className="how-step-ring">
                  <i className="bi bi-chat-dots how-step-icon how-step-icon--blue" aria-hidden="true" />
                </div>
                <div className="how-step-badge how-step-badge--blue">2</div>
                <div className="how-title">{t('sendRequests')}</div>
                <div className="how-text">
                  {t('sendRequestsDesc')}
                </div>
              </motion.div>
            </div>
            <div className="col-12 col-md-4">
              <motion.div className="how-step text-center" {...m.fadeUp(0.3)}>
                <div className="how-step-ring">
                  <i className="bi bi-check-circle how-step-icon how-step-icon--purple" aria-hidden="true" />
                </div>
                <div className="how-step-badge how-step-badge--purple">3</div>
                <div className="how-title">{t('completeOrders')}</div>
                <div className="how-text">
                  {t('completeOrdersDesc')}
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div className="text-center mt-4 mt-md-5" {...m.fadeUp(0.15)}>
            <button type="button" className="btn btn-success btn-lg fw-bold px-5" onClick={() => navigate('/register')}>
              {t('startYourJourney')}
              <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS (approved only from API; placeholders when empty) */}
      <section className="section section-white py-5">
        <div className="container">
          <motion.div className="text-center mb-4" {...m.fadeUp(0)}>
            <h2 className="section-title">{t('whatOurUsersSay')}</h2>
            <p className="section-subtitle">
              {t('usersSaySubtitle')}
            </p>
          </motion.div>

          <div className="row g-3">
            {(testimonials.length > 0 ? testimonials : PLACEHOLDER_TESTIMONIALS).map((t, idx) => (
              <motion.div
                key={t.id != null ? String(t.id) : `ph-${idx}`}
                className="col-12 col-md-6 col-lg-4"
                {...m.staggerY(idx * 0.08)}
              >
                <div className={`testimonial-card-home${t._placeholder ? ' testimonial-card-home--placeholder' : ''}`}>
                  {t.rating != null && Number(t.rating) > 0 && (
                    <div className="testimonial-stars mb-2" aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < Math.round(Number(t.rating)) ? 'bi-star-fill' : 'bi-star'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  )}
                  <p className="testimonial-quote">“{t.quote}”</p>
                  <div className="testimonial-author-line">
                    <span className="testimonial-name">{t.author_name}</span>
                    {t.author_role ? <span className="testimonial-role">, {t.author_role}</span> : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {testimonials.length === 0 && (
            <p className="text-center text-secondary small mt-3 mb-0">
              {t('testimonialsNote')}
            </p>
          )}
        </div>
      </section>

      {/* SUBMIT TESTIMONIAL */}
      <section className="section section-gray py-5">
        <div className="container">
          <motion.div className="text-center mb-4" {...m.fadeUp(0)}>
            <h2 className="section-title">{t('shareYourExperience')}</h2>
            <p className="section-subtitle">{t('testimonialReviewNote')}</p>
          </motion.div>

          <motion.div className="row justify-content-center" {...m.fadeUp(0.08)}>
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
                        try {
                          const refreshed = await axios.get(`${API_BASE_URL}/stats/testimonials`);
                          setTestimonials(refreshed.data || []);
                        } catch {
                          // ignore refresh errors
                        }
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
                        <label className="form-label fw-semibold">{t('name')}</label>
                        <input
                          className="form-control"
                          value={tForm.author_name}
                          onChange={(e) => setTForm((p) => ({ ...p, author_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">{t('roleOptional')}</label>
                        <input
                          className="form-control"
                          value={tForm.author_role}
                          onChange={(e) => setTForm((p) => ({ ...p, author_role: e.target.value }))}
                          placeholder={t('rolePlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label fw-semibold">{t('testimonial')}</label>
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
                        <label className="form-label fw-semibold">{t('ratingOptional')}</label>
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
                            {tForm.rating === '' ? t('noRating') : `${tForm.rating}/5`}
                          </span>
                          {tForm.rating !== '' && (
                            <button
                              type="button"
                              className="btn btn-link p-0 ms-2 small"
                              onClick={() => setTForm((p) => ({ ...p, rating: '' }))}
                              disabled={tSubmitting}
                            >
                              {t('clear')}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-12 col-md-8">
                        <button type="submit" className="btn btn-success fw-bold w-100" disabled={tSubmitting}>
                          {tSubmitting ? t('submitting') : t('submitTestimonial')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-green">
        <div className="container">
          <motion.div className="cta-block text-center" {...m.fadeUp(0)}>
            <h2 className="cta-title">{t('readyToMakeDifference')}</h2>
            <p className="cta-text mx-auto">
              {t('ctaText')}
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mt-4">
              <button
                type="button"
                className="btn btn-light text-success fw-bold px-4 py-2"
                onClick={() => navigate('/register')}
              >
                {t('createFreeAccount')}
              </button>
              <button
                type="button"
                className="btn btn-outline-light fw-bold px-4 py-2"
                onClick={() => navigate('/marketplace')}
              >
                {t('explorePlatform')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
