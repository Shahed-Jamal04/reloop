import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import RequestThreadModal from '../components/RequestThreadModal';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function BuyerRequestsPage() {
  const { token } = useAuth();
  const { t } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chat, setChat] = useState(null); // { id, title, counterpart }

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const res = await axios.get(`${API_BASE_URL}/requests/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (err) {
        console.error('Failed to load buyer requests:', err);
        setError(t('failedLoadRequests'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">{t('myRequests')}</h1>
        <p className="role-page-lead">{t('myRequestsLead')}</p>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label={t('loading')} />
          <span>{t('loadingRequests')}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-chat-left-dots" />
          </div>
          <p className="fw-semibold text-secondary mb-1">{t('noRequestsYet')}</p>
          <p className="text-secondary small mb-3">{t('browseMarketplaceMessage')}</p>
          <Link to="/marketplace" className="btn btn-success fw-bold px-4">
            {t('browseMarketplace')}
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="d-grid gap-3">
          {items.map((r) => (
            <article key={r.id} className="ds-surface ds-surface--pad">
              <div className="d-flex justify-content-between gap-2 flex-wrap align-items-start mb-2">
                <strong className="fs-6">{r.material_title}</strong>
                <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-2 py-1">
                  {r.status}
                </span>
              </div>
              <div className="request-card-img mb-2">
                <img
                  src={resolveAssetUrl(r.material_image)}
                  alt=""
                  onError={(e) => {
                    if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="text-secondary small">{t('seller')}: {r.seller_name}</div>
              {r.message && <p className="mt-2 mb-0 small">{r.message}</p>}
              <div className="d-flex gap-2 flex-wrap mt-2">
                <Link to={`/materials/${r.material_id}`} className="btn btn-outline-success btn-sm fw-semibold">
                  <i className="bi bi-box-seam me-1" aria-hidden="true" />
                  {t('viewMaterial')}
                </Link>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-semibold"
                  onClick={() => setChat({ id: r.id, title: r.material_title, counterpart: r.seller_name })}
                >
                  <i className="bi bi-chat-dots me-1" aria-hidden="true" />
                  {t('messageSeller')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <RequestThreadModal
        open={!!chat}
        onClose={() => setChat(null)}
        requestId={chat?.id}
        title={chat?.title}
        counterpartName={chat?.counterpart}
      />
    </div>
  );
}

export default BuyerRequestsPage;
