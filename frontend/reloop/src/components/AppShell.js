import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppShell.css';

function getMenuForRole(role) {
  if (role === 'guest') {
    return {
      section: 'Explore',
      items: [
        { to: '/', label: 'Home', icon: 'bi-house' },
        { to: '/marketplace', label: 'Marketplace', icon: 'bi-bag' },
        { to: '/game', label: 'Play Game', icon: 'bi-controller' },
        { to: '/leaderboard', label: 'Leaderboard', icon: 'bi-trophy' },
        { to: '/login', label: 'Login', icon: 'bi-box-arrow-in-right' },
        { to: '/register', label: 'Register', icon: 'bi-person-plus' },
      ],
    };
  }

  if (role === 'admin') {
    return {
      section: 'Admin',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2' },
        { to: '/admin/materials', label: 'Approvals', icon: 'bi-check2-circle' },
        { to: '/admin/testimonials', label: 'Testimonials', icon: 'bi-chat-quote' },
        { to: '/admin/users', label: 'Users', icon: 'bi-people' },
        { to: '/game', label: 'Play Game', icon: 'bi-controller' },
        { to: '/leaderboard', label: 'Leaderboard', icon: 'bi-trophy' },
      ],
    };
  }

  if (role === 'seller') {
    return {
      section: 'Seller',
      items: [
        { to: '/dashboard/seller', label: 'Dashboard', icon: 'bi-speedometer2' },
        { to: '/seller/listings', label: 'My Listings', icon: 'bi-card-list' },
        { to: '/seller/requests', label: 'Requests', icon: 'bi-inbox' },
        { to: '/orders', label: 'Orders', icon: 'bi-receipt' },
        { to: '/marketplace', label: 'Marketplace', icon: 'bi-bag' },
        { to: '/game', label: 'Play Game', icon: 'bi-controller' },
        { to: '/leaderboard', label: 'Leaderboard', icon: 'bi-trophy' },
      ],
    };
  }

  return {
    section: 'Buyer',
    items: [
      { to: '/dashboard/buyer', label: 'Dashboard', icon: 'bi-speedometer2' },
      { to: '/marketplace', label: 'Marketplace', icon: 'bi-bag' },
      { to: '/requests', label: 'My Requests', icon: 'bi-chat-left-text' },
      { to: '/orders', label: 'Orders', icon: 'bi-receipt' },
      { to: '/game', label: 'Play Game', icon: 'bi-controller' },
      { to: '/leaderboard', label: 'Leaderboard', icon: 'bi-trophy' },
    ],
  };
}

export function AppShell({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const role = isAuthenticated ? (user?.role || 'buyer') : 'guest';
  const menu = useMemo(() => getMenuForRole(role), [role]);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('recyclexapp_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('recyclexapp_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuOpen) return;
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  const pageTitle = (() => {
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard';
    if (location.pathname.startsWith('/seller/listings')) return 'My Listings';
    if (location.pathname.startsWith('/marketplace')) return 'Marketplace';
    if (location.pathname.startsWith('/materials/')) return 'Material';
    if (location.pathname.startsWith('/orders')) return 'Orders';
    if (location.pathname.startsWith('/admin')) return 'Admin';
    return 'RecycleX';
  })();

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="app-sidebar d-flex flex-column">
        <div className="sidebar-brand">
          <div className="brand-left">
            <div className="brand-mark" aria-hidden="true" title="RecycleX">
              <img
                src={`${process.env.PUBLIC_URL}/recyclex-logo.png`}
                alt="RecycleX logo"
                className="brand-logo"
              />
            </div>
            <div className="brand-text">
              <div className="brand-title">RecycleX</div>
              <span className="brand-subtitle">Circular marketplace</span>
            </div>
          </div>
          <button
            type="button"
            className="collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`} />
          </button>
        </div>

        <div className="nav-section-title">{menu.section}</div>
        <nav className="nav-list nav nav-pills flex-column">
          {menu.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => `nav-item nav-link${isActive ? ' active' : ''}`}
              end
              title={collapsed ? it.label : undefined}
            >
              <span className="nav-icon">
                <i className={`bi ${it.icon}`} />
              </span>
              <span className="nav-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-spacer" />
        {!isAuthenticated && (
          <div className="sidebar-footer">
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon" aria-hidden="true">
                <i className="bi bi-box-arrow-in-right" />
              </span>
              <span className="nav-label">Login</span>
            </button>
          </div>
        )}
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-right" ref={menuRef}>
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  title={user?.name || 'User'}
                >
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </button>
                {userMenuOpen && (
                  <div className="avatar-menu">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                      <i className="bi bi-person-circle" /> Profile
                    </Link>
                    <div className="divider" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right" /> Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="topbar-hint">Welcome</div>
            )}
          </div>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

