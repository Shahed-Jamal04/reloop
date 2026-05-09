import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FormInput from './FormInput';
import ErrorMessage from './ErrorMessage';
import Button from './Button';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'buyer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { t } = useTheme();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'seller' || role === 'buyer') {
      setFormData((prev) => ({ ...prev, role }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.phone, formData.role);

      navigate('/login', {
        state: { message: 'Registration successful! Please login with your credentials.' },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card auth-card--wide">
      <header className="auth-header auth-card-panel">
        <div className="auth-brand">
          <span className="brand-pill" aria-hidden="true">
            <img
              src={`${process.env.PUBLIC_URL}/recyclex-logo.png`}
              alt="RecycleX logo"
              className="brand-logo"
            />
          </span>
          <span className="auth-brand-name">RecycleX</span>
        </div>
        <h1 className="auth-title">{t('createAccount')}</h1>
        <p className="auth-subtitle">{t('joinCircularEconomy')}</p>
      </header>

      <div className="auth-card-panel pt-0">
        <div className="auth-card-panel-head">
          <h2 className="auth-card-panel-title">{t('signUp')}</h2>
          <p className="auth-card-panel-desc">{t('fillDetails')}</p>
        </div>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-picker">
            <span className="form-label fw-bold d-block mb-2">I want to</span>
            <div className="row g-3">
              <div className="col-md-6">
                <button
                  type="button"
                  className={`role-picker-card${formData.role === 'buyer' ? ' is-active' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, role: 'buyer' }))}
                  disabled={loading}
                  aria-pressed={formData.role === 'buyer'}
                >
                  <i className="bi bi-cart3 role-picker-ico role-picker-ico--buyer" aria-hidden="true" />
                  <span className="role-picker-title">{t('buyer')}</span>
                  <span className="role-picker-hint">{t('findSustainableMaterials')}</span>
                </button>
              </div>
              <div className="col-md-6">
                <button
                  type="button"
                  className={`role-picker-card${formData.role === 'seller' ? ' is-active' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, role: 'seller' }))}
                  disabled={loading}
                  aria-pressed={formData.role === 'seller'}
                >
                  <i className="bi bi-shop role-picker-ico role-picker-ico--seller" aria-hidden="true" />
                  <span className="role-picker-title">{t('seller')}</span>
                  <span className="role-picker-hint">{t('listYourSurplus')}</span>
                </button>
              </div>
            </div>
          </div>

          <FormInput
            label={t('fullName')}
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            disabled={loading}
          />

          <FormInput
            label={t('email')}
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
            disabled={loading}
          />

          <FormInput
            label="Phone Number (optional)"
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            disabled={loading}
          />

          <div className="row g-2">
            <div className="col-md-6">
              <FormInput
                label={t('password')}
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <FormInput
                label={t('confirmPassword')}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="btn btn-success w-100 py-2 fw-bold auth-submit">
            {loading ? t('loading') : t('createAccount')}
          </Button>
        </form>
      </div>

      <footer className="auth-footer auth-card-panel border-top bg-light">
        <p className="auth-footer-line mb-0">
          {t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
        <p className="auth-footer-line mb-0">
          <Link to="/" className="auth-footer-link-secondary">
            {t('home')}
          </Link>
        </p>
      </footer>
    </div>
  );
}

export default RegisterForm;
