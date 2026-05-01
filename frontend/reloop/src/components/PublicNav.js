import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicNav.css';

export function PublicNav() {
  const { isAuthenticated, user } = useAuth();

  const dashboardLink =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'seller'
        ? '/dashboard/seller'
        : '/dashboard/buyer';

  return (
    <div className="public-nav">
      <div className="container public-nav-inner">
        <Link to="/" className="public-brand">
          RecycleX <span>marketplace</span>
        </Link>

        <div className="public-links">
          <NavLink to="/" className={({ isActive }) => `public-link${isActive ? ' active' : ''}`} end>
            Home
          </NavLink>
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `public-link${isActive ? ' active' : ''}`}
          >
            Marketplace
          </NavLink>
          <NavLink
            to="/game"
            className={({ isActive }) => `public-link${isActive ? ' active' : ''}`}
          >
            🎮 Play Game
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) => `public-link${isActive ? ' active' : ''}`}
          >
            🏆 Leaderboard
          </NavLink>

          {isAuthenticated ? (
            <Link to={dashboardLink} className="public-cta">
              Dashboard
            </Link>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `public-link${isActive ? ' active' : ''}`}>
                Login
              </NavLink>
              <Link to="/register" className="public-cta">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicNav;

