import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ROLE_OPTIONS = ['buyer', 'seller', 'admin'];

function roleBadge(role) {
  switch (role) {
    case 'admin':
      return 'primary';
    case 'seller':
      return 'info';
    case 'buyer':
      return 'success';
    default:
      return 'secondary';
  }
}

function roleLabel(role, t) {
  switch (role) {
    case 'admin':
      return t('admin');
    case 'seller':
      return t('seller');
    case 'buyer':
      return t('buyer');
    default:
      return role;
  }
}

export function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const { t } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || t('failedLoadUsers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && u.is_deleted) return false;
      if (statusFilter === 'disabled' && !u.is_deleted) return false;
      if (!q) return true;
      const hay = `${u.name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = items.length;
    const active = items.filter((u) => !u.is_deleted).length;
    const disabled = total - active;
    return { total, active, disabled };
  }, [items]);

  const updateRole = async (id, role) => {
    try {
      setSavingId(id);
      await axios.patch(
        `${API_BASE_URL}/admin/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || t('failedUpdateRole'));
    } finally {
      setSavingId(null);
    }
  };

  const toggleEnabled = async (u) => {
    try {
      setSavingId(u.id);
      const action = u.is_deleted ? 'enable' : 'disable';
      await axios.patch(
        `${API_BASE_URL}/admin/users/${u.id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || t('failedUpdateUser'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
          <div>
            <h1 className="role-page-title">{t('usersPageTitle')}</h1>
            <p className="role-page-lead mb-0">{t('usersPageLead')}</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <span className="badge bg-light text-dark fw-semibold">
              {t('usersTotalCount')}: {counts.total}
            </span>
            <span className="badge bg-success fw-semibold">
              {t('usersActiveCount')}: {counts.active}
            </span>
            <span className="badge bg-secondary fw-semibold">
              {t('usersDisabledCount')}: {counts.disabled}
            </span>
          </div>
        </div>
      </header>

      <div className="ds-surface ds-surface--pad mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                className="form-control"
                placeholder={t('searchUsersPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">{t('allRoles')}</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r, t)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('allStatus')}</option>
              <option value="active">{t('activeStatus')}</option>
              <option value="disabled">{t('disabledStatus')}</option>
            </select>
          </div>
          <div className="col-12 col-md-2 d-flex justify-content-md-end">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={load} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
              {t('refresh')}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label={t('loading')} />
          <span>{t('loadingUsers')}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-people" />
          </div>
          <p className="fw-semibold text-secondary mb-1">{t('noUsersFound')}</p>
          <p className="text-secondary small mb-0">{t('noUsersFoundHelp')}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="ds-surface">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="small text-secondary">
                <tr>
                  <th style={{ width: 70 }}>{t('idLabel')}</th>
                  <th>{t('name')}</th>
                  <th>{t('email')}</th>
                  <th style={{ width: 160 }}>{t('role')}</th>
                  <th style={{ width: 120 }}>{t('status')}</th>
                  <th style={{ width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isMe = String(me?.id) === String(u.id);
                  const disabled = savingId === u.id;
                  return (
                    <tr key={u.id}>
                      <td className="text-secondary">{u.id}</td>
                      <td>
                        <div className="fw-semibold">
                          {u.name || '-'}
                          {isMe && (
                            <span className="badge text-bg-light border ms-2 fw-normal">{t('youBadge')}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-secondary">{u.email || '-'}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge text-bg-${roleBadge(u.role)}`}>{roleLabel(u.role, t)}</span>
                          <select
                            className="form-select form-select-sm"
                            value={u.role || 'buyer'}
                            disabled={disabled || isMe}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                            title={isMe ? t('cannotChangeOwnRole') : t('changeRoleTitle')}
                            style={{ maxWidth: 110 }}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {roleLabel(r, t)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        {u.is_deleted ? (
                          <span className="badge bg-secondary">{t('disabledStatus')}</span>
                        ) : (
                          <span className="badge bg-success">{t('activeStatus')}</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className={`btn btn-sm ${u.is_deleted ? 'btn-success' : 'btn-outline-danger'}`}
                          disabled={disabled || isMe}
                          onClick={() => toggleEnabled(u)}
                          title={isMe ? t('cannotDisableOwnAccount') : undefined}
                        >
                          {u.is_deleted ? (
                            <>
                              <i className="bi bi-check-lg me-1" aria-hidden="true" />
                              {t('enableUser')}
                            </>
                          ) : (
                            <>
                              <i className="bi bi-slash-circle me-1" aria-hidden="true" />
                              {t('disableUser')}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
