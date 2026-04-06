import React from 'react';
import { Link } from 'react-router-dom';
import './SiteFooter.css';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="footer-brand-pill" aria-hidden="true">
                <i className="bi bi-recycle" />
              </span>
              <span className="fw-bold fs-5 text-white">Reloop</span>
            </div>
            <p className="text-white-50 small mb-3">
              Connecting businesses and individuals to exchange surplus materials, reduce waste, and promote a
              sustainable circular economy.
            </p>
            <div className="d-flex gap-3">
              <a className="footer-icon-link" href="#" aria-label="Facebook">
                <i className="bi bi-facebook" />
              </a>
              <a className="footer-icon-link" href="#" aria-label="Twitter">
                <i className="bi bi-twitter-x" />
              </a>
              <a className="footer-icon-link" href="#" aria-label="Instagram">
                <i className="bi bi-instagram" />
              </a>
              <a className="footer-icon-link" href="#" aria-label="LinkedIn">
                <i className="bi bi-linkedin" />
              </a>
            </div>
          </div>

          <div className="col-6 col-lg-2">
            <div className="text-white fw-semibold mb-3">Quick Links</div>
            <ul className="list-unstyled d-grid gap-2 small mb-0">
              <li>
                <Link className="footer-link" to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  Browse Materials
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/login">
                  Login
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/register">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-lg-3">
            <div className="text-white fw-semibold mb-3">Categories</div>
            <ul className="list-unstyled d-grid gap-2 small mb-0">
              <li>
                <Link className="footer-link" to="/marketplace">
                  Wood
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  Fabric
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  Metal
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  Plastic
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/marketplace">
                  Glass
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-12 col-lg-3">
            <div className="text-white fw-semibold mb-3">Contact Us</div>
            <ul className="list-unstyled d-grid gap-2 small mb-0">
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-envelope footer-muted mt-1" aria-hidden="true" />
                <span className="text-white-50">info@reloop.com</span>
              </li>
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-telephone footer-muted mt-1" aria-hidden="true" />
                <span className="text-white-50">+1 (555) 123-4567</span>
              </li>
              <li className="d-flex gap-2 align-items-start">
                <i className="bi bi-geo-alt footer-muted mt-1" aria-hidden="true" />
                <span className="text-white-50">123 Eco Street, Green City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />
        <div className="text-center text-white-50 small">
          &copy; {new Date().getFullYear()} Reloop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

