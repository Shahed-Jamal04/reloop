import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { DarkModeSwitch } from 'react-toggle-dark-mode';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AppShell.css';

function getMenuForRole(role, t) {
  if (role === 'guest') {
    return {
      section: t('explore'),
      items: [
        { to: '/', label: t('home'), icon: 'bi-house' },
        { to: '/marketplace', label: t('marketplace'), icon: 'bi-bag' },
        { to: '/game', label: t('games'), icon: 'bi-controller' },
        { to: '/leaderboard', label: t('leaderboard'), icon: 'bi-trophy' },
        { to: '/about', label: t('aboutUs'), icon: 'bi-people' },
        { to: '/login', label: t('login'), icon: 'bi-box-arrow-in-right' },
        { to: '/register', label: t('register'), icon: 'bi-person-plus' },
      ],
    };
  }

  if (role === 'admin') {
    return {
      section: t('admin'),
      items: [
        { to: '/', label: t('home'), icon: 'bi-house' },
        { to: '/admin', label: t('dashboard'), icon: 'bi-speedometer2' },
        { to: '/admin/materials', label: t('approvals'), icon: 'bi-check2-circle' },
        { to: '/admin/testimonials', label: t('testimonials'), icon: 'bi-chat-quote' },
        { to: '/admin/users', label: t('users'), icon: 'bi-people' },
        { to: '/game', label: t('games'), icon: 'bi-controller' },
        { to: '/leaderboard', label: t('leaderboard'), icon: 'bi-trophy' },
        { to: '/about', label: t('aboutUs'), icon: 'bi-people' },
      ],
    };
  }

  if (role === 'seller') {
    return {
      section: t('seller'),
      items: [
        { to: '/', label: t('home'), icon: 'bi-house' },
        { to: '/dashboard/seller', label: t('dashboard'), icon: 'bi-speedometer2' },
        { to: '/seller/listings', label: t('listings'), icon: 'bi-card-list' },
        { to: '/seller/requests', label: t('requests'), icon: 'bi-inbox' },
        { to: '/orders', label: t('orders'), icon: 'bi-receipt' },
        { to: '/marketplace', label: t('marketplace'), icon: 'bi-bag' },
        { to: '/game', label: t('games'), icon: 'bi-controller' },
        { to: '/leaderboard', label: t('leaderboard'), icon: 'bi-trophy' },
        { to: '/about', label: t('aboutUs'), icon: 'bi-people' },
      ],
    };
  }

  return {
    section: t('buyer'),
    items: [
      { to: '/', label: t('home'), icon: 'bi-house' },
      { to: '/dashboard/buyer', label: t('dashboard'), icon: 'bi-speedometer2' },
      { to: '/marketplace', label: t('marketplace'), icon: 'bi-bag' },
      { to: '/requests', label: t('requests'), icon: 'bi-chat-left-text' },
      { to: '/orders', label: t('orders'), icon: 'bi-receipt' },
      { to: '/game', label: t('games'), icon: 'bi-controller' },
      { to: '/leaderboard', label: t('leaderboard'), icon: 'bi-trophy' },
      { to: '/about', label: t('aboutUs'), icon: 'bi-people' },
    ],
  };
}

export function AppShell({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage, t } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const role = isAuthenticated ? (user?.role || 'buyer') : 'guest';
  const menu = useMemo(() => getMenuForRole(role, t), [role, t]);

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
    if (location.pathname === '/') return t('home');
    if (location.pathname.startsWith('/about')) return t('aboutUs');
    if (location.pathname.startsWith('/dashboard')) return t('dashboard');
    if (location.pathname.startsWith('/seller/listings')) return t('listings');
    if (location.pathname.startsWith('/marketplace')) return t('marketplace');
    if (location.pathname.startsWith('/materials/')) return t('material');
    if (location.pathname.startsWith('/orders')) return t('orders');
    if (location.pathname.startsWith('/admin')) return t('dashboard');
    if (location.pathname.startsWith('/game')) return t('games');
    if (location.pathname.startsWith('/leaderboard')) return t('leaderboard');
    if (location.pathname.startsWith('/requests')) return t('requests');
    return 'RecycleX';
  })();

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="app-sidebar d-flex flex-column">
        <div className="sidebar-brand">
          <Link to="/" className="brand-left sidebar-brand-link" title={t('home')}>
            <div className="brand-mark" aria-hidden="true">
              <img
                src={`${process.env.PUBLIC_URL}/recyclex-logo.png`}
                alt="RecycleX logo"
                className="brand-logo"
              />
            </div>
            <div className="brand-text">
              <div className="brand-title">RecycleX</div>
              <span className="brand-subtitle">{t('circularMarketplace')}</span>
            </div>
          </Link>
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
              <span className="nav-label">{t('login')}</span>
            </button>
          </div>
        )}
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-right" ref={menuRef}>
            <div className="theme-actions">
              <button type="button" className="theme-toggle-btn" onClick={toggleLanguage}>
                {language === 'en' ? 'العربية' : 'English'}
              </button>
              <DarkModeSwitch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                size={24}
                sunColor="#111827"
                moonColor="#f5f5f5"
              />
            </div>
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="avatar-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label={t('profile')}
                  title={user?.name || 'User'}
                >
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </button>
                {userMenuOpen && (
                  <div className="avatar-menu">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                      <i className="bi bi-person-circle" /> {t('profile')}
                    </Link>
                    <div className="divider" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right" /> {t('logout')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="topbar-hint">{t('welcome')}</div>
            )}
          </div>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

