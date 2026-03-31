import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ROLE_OPTIONS = ['buyer', 'seller', 'admin'];

export function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Failed to load users.');
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
    if (!q) return items;
    return items.filter((u) => {
      const hay = `${u.name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

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
      setError(err.response?.data?.error || 'Failed to update role.');
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
      setError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div>
          <h1 className="h3 mb-1">Users</h1>
          <p className="text-secondary mb-0">Manage roles and enable/disable accounts.</p>
        </div>
        <span className="text-secondary small">{items.length} total</span>
      </div>

      <div className="row g-2 align-items-center mt-3">
        <div className="col-12 col-md-6">
          <input
            className="form-control"
            placeholder="Search by name, email, role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-6 d-flex justify-content-md-end">
          <button type="button" className="btn btn-outline-secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="d-flex align-items-center gap-2 mt-3">
          <div className="spinner-border" role="status" aria-label="Loading" />
          <span className="fw-semibold">Loading...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="alert alert-info mt-3" role="alert">
          No users found.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-responsive mt-3">
          <table className="table align-middle">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 140 }}>Role</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ width: 180 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = String(me?.id) === String(u.id);
                const disabled = savingId === u.id;
                return (
                  <tr key={u.id}>
                    <td className="text-secondary">{u.id}</td>
                    <td className="fw-semibold">{u.name || '-'}</td>
                    <td className="text-secondary">{u.email || '-'}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role || 'buyer'}
                        disabled={disabled || isMe}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        title={isMe ? 'You cannot change your own role' : undefined}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {u.is_deleted ? (
                        <span className="badge bg-secondary">Disabled</span>
                      ) : (
                        <span className="badge bg-success">Active</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className={`btn ${u.is_deleted ? 'btn-success' : 'btn-outline-danger'}`}
                        disabled={disabled || isMe}
                        onClick={() => toggleEnabled(u)}
                        title={isMe ? 'You cannot disable your own account' : undefined}
                      >
                        {u.is_deleted ? 'Enable' : 'Disable'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;

