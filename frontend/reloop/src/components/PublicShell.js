import React, { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from './SiteFooter';
import './PublicShell.css';

export function PublicShell({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo(
    () => [
      { to: '/', label: 'Home' },
      { to: '/marketplace', label: 'Browse Materials' },
    ],
    []
  );

  const showAuthButtons = !isAuthenticated;

  return (
    <div className="public-shell">
      <header className="public-header border-bottom bg-white">
        <div className="container py-3">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
              <span className="brand-pill">
                <i className="bi bi-recycle" />
              </span>
              <span className="fw-bold fs-5">Reloop</span>
            </Link>

            <nav className="d-none d-md-flex align-items-center gap-4">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `text-decoration-none fw-semibold ${isActive ? 'text-success' : 'text-secondary'}`
                  }
                  end={l.to === '/'}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="d-none d-md-flex align-items-center gap-2">
              {isAuthenticated ? (
                <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-outline-secondary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary fw-bold">
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary d-md-none"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          </div>

          {mobileOpen && (
            <div className="d-md-none mt-3 pt-3 border-top">
              <div className="d-flex flex-column gap-2">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`public-mobile-link ${location.pathname === l.to ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}

                <div className="d-flex gap-2 mt-2">
                  {showAuthButtons ? (
                    <>
                      <Link to="/login" className="btn btn-outline-secondary w-100" onClick={() => setMobileOpen(false)}>
                        Login
                      </Link>
                      <Link to="/register" className="btn btn-primary fw-bold w-100" onClick={() => setMobileOpen(false)}>
                        Register
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="public-main">{children}</main>

      <SiteFooter />
    </div>
  );
}

export default PublicShell;

