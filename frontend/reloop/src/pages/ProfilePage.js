import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './rolePages.css';
import './ProfilePage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function initialsFromName(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || 'U';
}

function formatJoined(dt) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function roleBadgeClass(role) {
  switch (role) {
    case 'admin': return 'text-bg-primary';
    case 'seller': return 'text-bg-info';
    case 'buyer': return 'text-bg-success';
    default: return 'text-bg-secondary';
  }
}

function roleIcon(role) {
  switch (role) {
    case 'admin': return 'bi-shield-lock';
    case 'seller': return 'bi-shop';
    case 'buyer': return 'bi-bag-check';
    default: return 'bi-person';
  }
}

export function ProfilePage() {
  const { token, updateUser } = useAuth();
  const { t } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile edit state
  const [form, setForm] = useState({ name: '', phone: '', location: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Password state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        location: res.data.location || '',
        bio: res.data.bio || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      (form.name || '') !== (profile.name || '') ||
      (form.phone || '') !== (profile.phone || '') ||
      (form.location || '') !== (profile.location || '') ||
      (form.bio || '') !== (profile.bio || '')
    );
  }, [form, profile]);

  const validateProfile = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t('nameRequired');
    if (form.name.trim().length > 100) errs.name = t('nameTooLong');
    if (form.phone && !/^[+0-9\s\-()]{6,20}$/.test(form.phone.trim())) {
      errs.phone = t('phoneInvalid');
    }
    if (form.location && form.location.length > 255) errs.location = t('locationTooLong');
    if (form.bio && form.bio.length > 2000) errs.bio = t('bioMaxChars');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setError('');
    if (!validateProfile()) return;
    try {
      setSavingProfile(true);
      const res = await axios.patch(
        `${API_BASE_URL}/users/me`,
        {
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          location: form.location.trim() || null,
          bio: form.bio.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data.user;
      setProfile((prev) => ({ ...prev, ...updated }));
      updateUser({ name: updated.name });
      setProfileMsg(t('profileSaved'));
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('failedToSaveProfile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfile = () => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
    });
    setFieldErrors({});
    setProfileMsg('');
  };

  const validatePw = () => {
    const errs = {};
    if (!pwForm.current) errs.current = t('required');
    if (!pwForm.next) errs.next = t('required');
    else if (pwForm.next.length < 6) errs.next = t('atLeast6Chars');
    if (pwForm.next && pwForm.next === pwForm.current) errs.next = t('mustDiffer');
    if (pwForm.confirm !== pwForm.next) errs.confirm = t('passwordsDontMatch');
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitPw = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (!validatePw()) return;
    try {
      setPwSaving(true);
      await axios.patch(
        `${API_BASE_URL}/users/me/password`,
        { current_password: pwForm.current, new_password: pwForm.next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwMsg(t('passwordUpdated'));
      setPwForm({ current: '', next: '', confirm: '' });
      setPwErrors({});
      setTimeout(() => {
        setPwMsg('');
        setPwOpen(false);
      }, 1500);
    } catch (err) {
      setPwErrors({ current: err.response?.data?.error || t('failedToChangePassword') });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="role-page py-4 px-3">
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>{t('loadingProfile')}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="role-page py-4 px-3">
        <div className="alert alert-danger" role="alert">
          {error || t('unableToLoadProfile')}
        </div>
      </div>
    );
  }

  const activity = profile.activity || {};

  return (
    <div className="role-page py-4 px-3">
      {/* Profile hero */}
      <header className="profile-hero mb-4">
        <div className="profile-hero-bg" aria-hidden="true" />
        <div className="profile-hero-content">
          <div className="profile-avatar" aria-hidden="true">
            {initialsFromName(profile.name)}
          </div>
          <div className="profile-hero-meta">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="profile-name mb-0">{profile.name}</h1>
              <span className={`badge ${roleBadgeClass(profile.role)} text-capitalize`}>
                <i className={`bi ${roleIcon(profile.role)} me-1`} aria-hidden="true" />
                {profile.role}
              </span>
            </div>
            <div className="profile-hero-sub mt-2">
              <span><i className="bi bi-envelope me-1" aria-hidden="true" />{profile.email}</span>
              {profile.phone && (
                <span><i className="bi bi-telephone me-1" aria-hidden="true" />{profile.phone}</span>
              )}
              {profile.location && (
                <span><i className="bi bi-geo-alt me-1" aria-hidden="true" />{profile.location}</span>
              )}
              {profile.created_at && (
                <span><i className="bi bi-calendar3 me-1" aria-hidden="true" />{t('joined')} {formatJoined(profile.created_at)}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      {/* Activity stats */}
      <section className="row g-3 mb-4">
        {profile.role === 'seller' && (
          <StatTile icon="bi-card-list" label={t('myListings')} value={activity.listings ?? 0} to="/seller/listings" />
        )}
        <StatTile
          icon={profile.role === 'seller' ? 'bi-inbox' : 'bi-chat-left-text'}
          label={profile.role === 'seller' ? t('incomingRequests') : t('myRequests')}
          value={activity.requests ?? 0}
          to={profile.role === 'seller' ? '/seller/requests' : '/requests'}
          hide={profile.role === 'admin'}
        />
        <StatTile
          icon="bi-receipt"
          label={t('orders')}
          value={activity.orders ?? 0}
          to="/orders"
          hide={profile.role === 'admin'}
        />
        <StatTile
          icon="bi-chat-dots"
          label={t('messages')}
          value={activity.messages ?? 0}
        />
        {profile.role !== 'admin' && (
          <StatTile
            icon="bi-star"
            label={t('rating')}
            value={Number(profile.rating ?? 0).toFixed(1)}
            suffix="/ 5"
          />
        )}
      </section>

      <div className="row g-3">
        {/* Profile info / edit */}
        <div className="col-12 col-lg-7">
          <form className="ds-surface ds-surface--pad h-100" onSubmit={submitProfile} noValidate>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <h2 className="h6 fw-bold mb-0">
                <i className="bi bi-person-gear text-success me-2" aria-hidden="true" />
                {t('accountInformation')}
              </h2>
              {profileMsg && (
                <span className="badge text-bg-success">
                  <i className="bi bi-check2 me-1" aria-hidden="true" />
                  {profileMsg}
                </span>
              )}
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">{t('fullName')}</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  maxLength={100}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">{t('email')}</label>
                <input type="email" className="form-control" value={profile.email} disabled readOnly />
                <div className="form-text small">{t('emailCannotBeChanged')}</div>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">{t('phone')}</label>
                <input
                  type="tel"
                  className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  maxLength={20}
                  placeholder={t('phonePlaceholder')}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary">{t('location')}</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.location ? 'is-invalid' : ''}`}
                  value={form.location}
                  maxLength={255}
                  placeholder={t('locationPlaceholder')}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
                {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
              </div>

              <div className="col-12">
                <label className="form-label small fw-semibold text-secondary">{t('bio')}</label>
                <textarea
                  className={`form-control ${fieldErrors.bio ? 'is-invalid' : ''}`}
                  rows={4}
                  maxLength={2000}
                  value={form.bio}
                  placeholder={
                    profile.role === 'seller'
                      ? t('sellerBioPlaceholder')
                      : t('buyerBioPlaceholder')
                  }
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                />
                <div className="d-flex justify-content-between small text-secondary">
                  {fieldErrors.bio ? (
                    <span className="text-danger">{fieldErrors.bio}</span>
                  ) : <span />}
                  <span>{(form.bio || '').length}/2000</span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-3 flex-wrap">
              <button
                type="submit"
                className="btn btn-success fw-bold px-4"
                disabled={savingProfile || !isDirty}
              >
                {savingProfile ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2 me-1" aria-hidden="true" />
                    {t('saveChanges')}
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-semibold"
                onClick={resetProfile}
                disabled={savingProfile || !isDirty}
              >
                {t('discard')}
              </button>
            </div>
          </form>
        </div>

        {/* Security + quick links */}
        <div className="col-12 col-lg-5">
          <div className="d-grid gap-3">
            <div className="ds-surface ds-surface--pad">
              <div className="d-flex align-items-center justify-content-between gap-2">
                <h2 className="h6 fw-bold mb-0">
                  <i className="bi bi-shield-lock text-success me-2" aria-hidden="true" />
                  {t('security')}
                </h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setPwOpen((v) => !v);
                    setPwMsg('');
                    setPwErrors({});
                  }}
                >
                  {pwOpen ? t('cancel') : t('changePassword')}
                </button>
              </div>

              {!pwOpen && (
                <p className="text-secondary small mb-0 mt-2">
                  {t('keepAccountSecure')}
                </p>
              )}

              {pwOpen && (
                <form className="mt-3 d-grid gap-2" onSubmit={submitPw} noValidate>
                  <PwField
                    label={t('currentPassword')}
                    value={pwForm.current}
                    show={pwShow.current}
                    onToggle={() => setPwShow((s) => ({ ...s, current: !s.current }))}
                    onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                    error={pwErrors.current}
                    autoComplete="current-password"
                    t={t}
                  />
                  <PwField
                    label={t('newPassword')}
                    value={pwForm.next}
                    show={pwShow.next}
                    onToggle={() => setPwShow((s) => ({ ...s, next: !s.next }))}
                    onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                    error={pwErrors.next}
                    autoComplete="new-password"
                    t={t}
                  />
                  <PwField
                    label={t('confirmNewPassword')}
                    value={pwForm.confirm}
                    show={pwShow.confirm}
                    onToggle={() => setPwShow((s) => ({ ...s, confirm: !s.confirm }))}
                    onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                    error={pwErrors.confirm}
                    autoComplete="new-password"
                    t={t}
                  />

                  {pwMsg && (
                    <div className="alert alert-success py-2 px-3 mb-0" role="alert">
                      <i className="bi bi-check2 me-1" aria-hidden="true" />
                      {pwMsg}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-success fw-bold" disabled={pwSaving}>
                      {pwSaving ? t('saving') : t('updatePassword')}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="ds-surface ds-surface--pad">
              <h2 className="h6 fw-bold mb-3">
                <i className="bi bi-arrow-up-right-square text-success me-2" aria-hidden="true" />
                {t('quickLinks')}
              </h2>
              <div className="d-grid gap-2">
                {profile.role === 'seller' && (
                  <>
                    <Link to="/seller/listings" className="btn btn-outline-success btn-sm fw-semibold text-start">
                      <i className="bi bi-card-list me-2" aria-hidden="true" />
                      {t('manageListings')}
                    </Link>
                    <Link to="/seller/requests" className="btn btn-outline-success btn-sm fw-semibold text-start">
                      <i className="bi bi-inbox me-2" aria-hidden="true" />
                      {t('incomingRequests')}
                    </Link>
                  </>
                )}
                {profile.role === 'buyer' && (
                  <>
                    <Link to="/marketplace" className="btn btn-outline-success btn-sm fw-semibold text-start">
                      <i className="bi bi-bag me-2" aria-hidden="true" />
                      {t('browseMarketplace')}
                    </Link>
                    <Link to="/requests" className="btn btn-outline-success btn-sm fw-semibold text-start">
                      <i className="bi bi-chat-left-text me-2" aria-hidden="true" />
                      {t('myRequests')}
                    </Link>
                  </>
                )}
                {profile.role !== 'admin' && (
                  <Link to="/orders" className="btn btn-outline-success btn-sm fw-semibold text-start">
                    <i className="bi bi-receipt me-2" aria-hidden="true" />
                    {t('myOrders')}
                  </Link>
                )}
                {profile.role === 'admin' && (
                  <Link to="/admin" className="btn btn-outline-success btn-sm fw-semibold text-start">
                    <i className="bi bi-speedometer2 me-2" aria-hidden="true" />
                    {t('adminDashboard')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, to, suffix, hide }) {
  if (hide) return null;
  const body = (
    <div className="ds-surface ds-surface--pad h-100">
      <div className="d-flex align-items-center gap-3">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle text-bg-success"
          style={{ width: 42, height: 42, fontSize: '1.1rem' }}
          aria-hidden="true"
        >
          <i className={`bi ${icon}`} />
        </div>
        <div>
          <div className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '.04em' }}>{label}</div>
          <div className="fs-4 fw-bold" style={{ lineHeight: 1.1 }}>
            {value}
            {suffix && <span className="text-secondary fs-6 ms-1">{suffix}</span>}
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="col-6 col-md-4 col-lg">
      {to ? (
        <Link to={to} className="text-decoration-none text-reset d-block h-100">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

function PwField({ label, value, show, onToggle, onChange, error, autoComplete, t }) {
  return (
    <div>
      <label className="form-label small fw-semibold text-secondary">{label}</label>
      <div className="input-group">
        <input
          type={show ? 'text' : 'password'}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? t('hidePassword') : t('showPassword')}
        >
          <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
        </button>
        {error && <div className="invalid-feedback d-block">{error}</div>}
      </div>
    </div>
  );
}

export default ProfilePage;
