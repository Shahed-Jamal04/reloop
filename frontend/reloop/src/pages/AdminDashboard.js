import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function formatDate(v) {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatCurrency(v) {
  const n = Number(v || 0);
  return `$${n.toLocaleString()}`;
}

export function AdminDashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const kpis = data?.kpis || {};
  const usersByRole = data?.users_by_role || {};
  const listingsByStatus = data?.listings_by_status || {};
  const ordersByStatus = data?.orders_by_status || {};
  const recentMaterials = data?.recent?.materials || [];
  const recentTestimonials = data?.recent?.testimonials || [];
  const recentUsers = data?.recent?.users || [];

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">Welcome back, {user?.name || 'Admin'}</h1>
        <p className="role-page-lead mb-0">
          Monitor platform activity, approve new listings, moderate testimonials, and manage users.
        </p>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading overview…</span>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}

      {!loading && !error && (
        <>
          <section className="row g-3 mb-4">
            <KpiCard
              label="Pending listings"
              value={kpis.pending_materials ?? 0}
              icon="bi-clipboard-check"
              color="warning"
              to="/admin/materials"
              cta="Review now"
              highlight={(kpis.pending_materials ?? 0) > 0}
            />
            <KpiCard
              label="Pending testimonials"
              value={kpis.pending_testimonials ?? 0}
              icon="bi-chat-quote"
              color="info"
              to="/admin/testimonials"
              cta="Moderate"
              highlight={(kpis.pending_testimonials ?? 0) > 0}
            />
            <KpiCard
              label="Total users"
              value={kpis.total_users ?? 0}
              icon="bi-people"
              color="primary"
              to="/admin/users"
              cta="Manage"
            />
            <KpiCard
              label="Total revenue"
              value={formatCurrency(kpis.revenue)}
              icon="bi-currency-dollar"
              color="success"
            />
          </section>

          <section className="row g-3 mb-4">
            <div className="col-12 col-lg-4">
              <div className="ds-surface ds-surface--pad h-100">
                <h3 className="h6 fw-bold mb-3">
                  <i className="bi bi-people text-success me-2" aria-hidden="true" />
                  Users by role
                </h3>
                <BreakdownList items={usersByRole} />
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="ds-surface ds-surface--pad h-100">
                <h3 className="h6 fw-bold mb-3">
                  <i className="bi bi-box-seam text-success me-2" aria-hidden="true" />
                  Listings by status
                </h3>
                <BreakdownList items={listingsByStatus} total={kpis.total_listings} />
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="ds-surface ds-surface--pad h-100">
                <h3 className="h6 fw-bold mb-3">
                  <i className="bi bi-receipt text-success me-2" aria-hidden="true" />
                  Orders by status
                </h3>
                <BreakdownList items={ordersByStatus} total={kpis.total_orders} />
              </div>
            </div>
          </section>

          <section className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="ds-surface ds-surface--pad h-100">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <h3 className="h6 fw-bold mb-0">
                    <i className="bi bi-clipboard-check text-warning me-2" aria-hidden="true" />
                    Pending listings
                  </h3>
                  <Link to="/admin/materials" className="small text-success fw-semibold text-decoration-none">
                    View all →
                  </Link>
                </div>
                {recentMaterials.length === 0 ? (
                  <p className="text-secondary small mb-0">No pending listings 🎉</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-grid gap-2">
                    {recentMaterials.map((m) => (
                      <li key={m.id} className="d-flex justify-content-between gap-2 border-bottom pb-2">
                        <div className="text-truncate">
                          <div className="fw-semibold text-truncate">{m.title}</div>
                          <div className="text-secondary small">by {m.seller_name}</div>
                        </div>
                        <span className="text-secondary small flex-shrink-0">{formatDate(m.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div className="ds-surface ds-surface--pad h-100">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <h3 className="h6 fw-bold mb-0">
                    <i className="bi bi-chat-quote text-info me-2" aria-hidden="true" />
                    Pending testimonials
                  </h3>
                  <Link to="/admin/testimonials" className="small text-success fw-semibold text-decoration-none">
                    View all →
                  </Link>
                </div>
                {recentTestimonials.length === 0 ? (
                  <p className="text-secondary small mb-0">No pending testimonials.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-grid gap-2">
                    {recentTestimonials.map((t) => (
                      <li key={t.id} className="border-bottom pb-2">
                        <div className="fw-semibold">{t.author_name}</div>
                        <div className="text-secondary small line-clamp-2">“{t.quote}”</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="col-12">
              <div className="ds-surface ds-surface--pad">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <h3 className="h6 fw-bold mb-0">
                    <i className="bi bi-person-plus text-success me-2" aria-hidden="true" />
                    Recent users
                  </h3>
                  <Link to="/admin/users" className="small text-success fw-semibold text-decoration-none">
                    Manage users →
                  </Link>
                </div>
                {recentUsers.length === 0 ? (
                  <p className="text-secondary small mb-0">No users yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="text-secondary small">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((u) => (
                          <tr key={u.id}>
                            <td className="fw-semibold">{u.name || '-'}</td>
                            <td className="text-secondary">{u.email || '-'}</td>
                            <td>
                              <span className={`badge text-bg-${roleBadge(u.role)}`}>{u.role}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, color = 'success', to, cta, highlight = false }) {
  const content = (
    <div className={`ds-surface ds-surface--pad h-100 ${highlight ? 'border-warning' : ''}`} style={highlight ? { borderWidth: 2, borderStyle: 'solid' } : undefined}>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <div className="text-secondary small fw-semibold text-uppercase" style={{ letterSpacing: '.04em' }}>{label}</div>
          <div className="fs-3 fw-bold mt-1" style={{ lineHeight: 1.1 }}>{value}</div>
        </div>
        <div
          className={`d-inline-flex align-items-center justify-content-center rounded-circle text-bg-${color}`}
          style={{ width: 42, height: 42, fontSize: '1.2rem' }}
          aria-hidden="true"
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
      {to && cta && (
        <div className="mt-3">
          <span className="small text-success fw-semibold">{cta} →</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="col-6 col-lg-3">
      {to ? (
        <Link to={to} className="text-decoration-none text-reset d-block h-100">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function BreakdownList({ items, total }) {
  const entries = Object.entries(items || {});
  if (entries.length === 0) {
    return <p className="text-secondary small mb-0">No data yet.</p>;
  }
  const sum = total ?? entries.reduce((a, [, v]) => a + v, 0) ?? 0;

  return (
    <ul className="list-unstyled mb-0 d-grid gap-2">
      {entries.map(([key, value]) => {
        const pct = sum > 0 ? Math.round((value / sum) * 100) : 0;
        return (
          <li key={key}>
            <div className="d-flex justify-content-between small">
              <span className="text-capitalize fw-semibold">{key}</span>
              <span className="text-secondary">{value}{sum > 0 ? ` · ${pct}%` : ''}</span>
            </div>
            <div className="progress mt-1" style={{ height: 6 }}>
              <div
                className={`progress-bar text-bg-${statusColor(key)}`}
                role="progressbar"
                aria-label={key}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function statusColor(status) {
  switch (status) {
    case 'pending': return 'warning';
    case 'available':
    case 'paid':
    case 'confirmed':
    case 'completed':
    case 'accepted':
      return 'success';
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'removed':
    case 'sold':
      return 'secondary';
    case 'admin': return 'primary';
    case 'seller': return 'info';
    case 'buyer': return 'success';
    default: return 'secondary';
  }
}

function roleBadge(role) {
  switch (role) {
    case 'admin': return 'primary';
    case 'seller': return 'info';
    case 'buyer': return 'success';
    default: return 'secondary';
  }
}

export default AdminDashboard;
