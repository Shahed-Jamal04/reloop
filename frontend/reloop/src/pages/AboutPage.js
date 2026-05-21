import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { DEVELOPERS } from '../data/developers';
import { FALLBACK_IMAGE } from '../utils/assets';
import './AboutPage.css';

function teamImageSrc(path) {
  const base = process.env.PUBLIC_URL || '';
  if (!path) return FALLBACK_IMAGE;
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function AboutPage() {
  const { t } = useTheme();

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container py-5">
          <div className="about-hero-inner mx-auto text-center">
            <span className="about-eyebrow">{t('aboutUs')}</span>
            <h1 className="about-title">{t('aboutTitle')}</h1>
            <p className="about-lead">{t('aboutLead')}</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container py-5">
          <div className="text-center mb-4 mb-md-5">
            <h2 className="about-section-title">{t('meetTheTeam')}</h2>
            <p className="about-section-subtitle">{t('meetTheTeamSubtitle')}</p>
          </div>

          <div className="row g-4 justify-content-center">
            {DEVELOPERS.map((dev) => (
              <div key={dev.id} className="col-12 col-sm-6 col-lg-3">
                <article className="dev-card h-100">
                  <div className="dev-card-photo">
                    <img
                      src={teamImageSrc(dev.image)}
                      alt={dev.name}
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="dev-card-body">
                    <h3 className="dev-card-name">{dev.name}</h3>
                    <p className="dev-card-role">{t(dev.roleKey)}</p>
                    <p className="dev-card-bio">{t(dev.bioKey)}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-mission">
        <div className="container py-5">
          <div className="about-mission-panel mx-auto">
            <h2 className="about-section-title text-center mb-3">{t('ourMission')}</h2>
            <p className="about-mission-text text-center mb-4">{t('ourMissionText')}</p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <Link to="/marketplace" className="btn btn-success btn-lg fw-bold px-4">
                {t('browseMaterials')}
              </Link>
              <Link to="/register" className="btn btn-outline-secondary btn-lg fw-bold px-4">
                {t('getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
