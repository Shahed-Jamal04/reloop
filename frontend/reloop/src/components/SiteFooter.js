import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './SiteFooter.css';

const CATEGORY_LINKS = [
  { label: 'Wood', q: 'Wood' },
  { label: 'Fabric', q: 'Fabric' },
  { label: 'Metal', q: 'Metal' },
  { label: 'Plastic', q: 'Plastic' },
  { label: 'Glass', q: 'Glass' },
];

export function SiteFooter() {
  const { t } = useTheme();

  return (
    <footer className="site-footer">
      <div className="container py-5">
        <div className="row g-4 g-lg-5">
          <div className="col-12 col-md-6 col-lg-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="footer-brand-pill" aria-hidden="true">
                <img
                  src={`${process.env.PUBLIC_URL}/recyclex-logo.png`}
                  alt="RecycleX logo"
                  className="footer-brand-logo"
                />
              </span>
              <span className="footer-brand-title">RecycleX</span>
            </div>
            <p className="footer-about">
              Connecting businesses and individuals to exchange surplus materials, reduce waste, and promote a
              sustainable circular economy.
            </p>
            <div className="d-flex gap-3">
              <a className="footer-icon-link" href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook" />
              </a>
              <a className="footer-icon-link" href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="bi bi-twitter-x" />
              </a>
              <a className="footer-icon-link" href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram" />
              </a>
              <a className="footer-icon-link" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="bi bi-linkedin" />
              </a>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <h3 className="footer-col-title">Quick Links</h3>
            <ul className="list-unstyled footer-link-list mb-0">
              <li>
                <Link className="footer-link" to="/">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  {t('browseMaterials')}
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/about">
                  {t('aboutUs')}
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/register?role=seller">
                  Add Material
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/dashboard">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <h3 className="footer-col-title">Categories</h3>
            <ul className="list-unstyled footer-link-list mb-0">
              {CATEGORY_LINKS.map((c) => (
                <li key={c.q}>
                  <Link className="footer-link" to={`/marketplace?category=${encodeURIComponent(c.q)}`}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <h3 className="footer-col-title">Contact Us</h3>
            <ul className="list-unstyled footer-contact-list mb-0">
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-envelope footer-contact-ico" aria-hidden="true" />
                <span>info@recyclex.com</span>
              </li>
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-telephone footer-contact-ico" aria-hidden="true" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-geo-alt footer-contact-ico" aria-hidden="true" />
                <span>123 Eco Street, Green City, GC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />
        <div className="footer-copy text-center">
          &copy; {new Date().getFullYear()} RecycleX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
