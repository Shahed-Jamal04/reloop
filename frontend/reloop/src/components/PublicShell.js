import React, { useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from './SiteFooter';
import './PublicShell.css';

function dashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'seller') return '/dashboard/seller';
  return '/dashboard/buyer';
}

function requestsPath(role) {
  if (role === 'seller') return '/seller/requests';
  if (role === 'admin') return '/admin/materials';
  return '/requests';
}

function addMaterialPath(role, isAuthenticated) {
  if (isAuthenticated && role === 'seller') return '/seller/listings';
  return '/register?role=seller';
}

export function PublicShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'buyer';

  const centerNav = useMemo(
    () => [
      { to: '/', label: 'Home', end: true },
      { to: '/marketplace', label: 'Browse Materials', end: false },
      { to: addMaterialPath(role, isAuthenticated), label: 'Add Material', end: false },
    ],
    [role, isAuthenticated]
  );

  return (
    <div className="public-shell">
      <header className="public-header border-bottom bg-white">
        <div className="container py-3">
          <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none text-dark flex-shrink-0">
              <span className="brand-pill">
                <i className="bi bi-recycle" />
              </span>
              <span className="fw-bold fs-5 public-brand-text">Reloop</span>
            </Link>

            <nav className="d-none d-lg-flex align-items-center justify-content-center gap-4 flex-grow-1 public-nav-center">
              {centerNav.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={({ isActive }) =>
                    `public-nav-link text-decoration-none ${isActive ? 'active' : ''}`
                  }
                  end={l.end}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="d-none d-lg-flex align-items-center gap-1 flex-shrink-0 public-nav-actions">
              {isAuthenticated ? (
                <>
                  <Link to={requestsPath(role)} className="btn btn-link public-ghost-link text-decoration-none">
                    {role === 'admin' ? 'Approvals' : 'Requests'}
                  </Link>
                  <Link to={dashboardPath(role)} className="btn btn-link public-ghost-link text-decoration-none">
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-dark public-nav-login"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/requests" className="btn btn-link public-ghost-link text-decoration-none">
                    Requests
                  </Link>
                  <Link to="/dashboard" className="btn btn-link public-ghost-link text-decoration-none">
                    Dashboard
                  </Link>
                  <Link to="/login" className="btn btn-outline-dark public-nav-login">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-success fw-semibold public-nav-register">
                    Register
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary d-lg-none"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          </div>

          {mobileOpen && (
            <div className="d-lg-none mt-3 pt-3 border-top">
              <div className="d-flex flex-column gap-2">
                {centerNav.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className={`public-mobile-link ${location.pathname === l.to ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      to={requestsPath(role)}
                      className="public-mobile-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {role === 'admin' ? 'Approvals' : 'Requests'}
                    </Link>
                    <Link
                      to={dashboardPath(role)}
                      className="public-mobile-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-dark w-100"
                      onClick={() => {
                        setMobileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/requests" className="public-mobile-link" onClick={() => setMobileOpen(false)}>
                      Requests
                    </Link>
                    <Link to="/dashboard" className="public-mobile-link" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <div className="d-flex gap-2 mt-2">
                      <Link to="/login" className="btn btn-outline-dark w-100" onClick={() => setMobileOpen(false)}>
                        Login
                      </Link>
                      <Link to="/register" className="btn btn-success w-100 fw-semibold" onClick={() => setMobileOpen(false)}>
                        Register
                      </Link>
                    </div>
                  </>
                )}
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
