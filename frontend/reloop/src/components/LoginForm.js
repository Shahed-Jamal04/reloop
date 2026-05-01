import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from './FormInput';
import ErrorMessage from './ErrorMessage';
import Button from './Button';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      const role = data?.user?.role;

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'seller') {
        navigate('/dashboard/seller');
      } else {
        navigate('/dashboard/buyer');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue.</p>
      </header>

      <div className="auth-card-panel pt-0">
        <div className="auth-card-panel-head">
          <h2 className="auth-card-panel-title">Login</h2>
          <p className="auth-card-panel-desc">Enter your credentials to access your account.</p>
        </div>

        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="auth-form">
        <FormInput
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
        />

        <FormInput
          label="Password"
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={loading}
        />

          <Button type="submit" disabled={loading} className="btn btn-success w-100 py-2 fw-bold auth-submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <footer className="auth-footer auth-card-panel border-top bg-light">
        <p className="auth-footer-line mb-0">
          Don&apos;t have an account? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-footer-line auth-footer-line--sub mb-0">
          <Link to="/forgot-password" className="auth-footer-link-secondary">
            Forgot password?
          </Link>
          <span className="auth-footer-sep" aria-hidden="true">
            {' '}
            ·{' '}
          </span>
          <Link to="/" className="auth-footer-link-secondary">
            Back to home
          </Link>
        </p>
      </footer>
    </div>
  );
}

export default LoginForm;
