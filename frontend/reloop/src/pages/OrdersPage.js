import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function statusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'bg-warning text-dark';
  if (s === 'confirmed') return 'bg-info text-dark';
  if (s === 'completed') return 'bg-success';
  if (s === 'cancelled') return 'bg-secondary';
  return 'bg-secondary';
}

export function OrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    if (!token) return;
    try {
      setError('');
      const res = await axios.get(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.response?.data?.error || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isSeller = user?.role === 'seller';

  const payOrder = async (orderId) => {
    try {
      setActionId(orderId);
      setError('');
      await axios.post(
        `${API_BASE_URL}/orders/${orderId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed.');
    } finally {
      setActionId(null);
    }
  };

  const patchStatus = async (orderId, status) => {
    try {
      setActionId(orderId);
      setError('');
      await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">Orders</h1>
        <p className="role-page-lead mb-0">
          {isSeller
            ? 'Orders that include your materials. After the buyer pays (mock), you can mark the order complete when fulfilled.'
            : 'Pay with the mock checkout to confirm an order, then you or the seller can mark it complete.'}
        </p>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>Loading orders…</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <i className="bi bi-receipt" />
          </div>
          <p className="fw-semibold text-secondary mb-1">No orders yet</p>
          <p className="text-secondary small mb-3">
            {isSeller
              ? 'When you accept a request, an order is created automatically.'
              : 'When a seller accepts your request, your order will show up here.'}
          </p>
          {!isSeller && (
            <Link to="/marketplace" className="btn btn-success fw-bold px-4">
              Browse marketplace
            </Link>
          )}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="d-grid gap-3">
          {orders.map((o) => (
            <article key={o.id} className="ds-surface ds-surface--pad">
              <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start mb-2">
                <div>
                  <span className="text-secondary small d-block">Order #{o.id}</span>
                  {isSeller && o.buyer_name && (
                    <span className="small text-secondary">Buyer: {o.buyer_name}</span>
                  )}
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                  {o.payment_status && (
                    <span className="badge text-bg-light border text-secondary">
                      Payment: {o.payment_status}
                    </span>
                  )}
                  <span className="fw-semibold">
                    {o.total_price != null ? `$${Number(o.total_price).toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
              <div className="text-secondary small mb-2">
                {o.created_at ? new Date(o.created_at).toLocaleString() : ''}
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {!isSeller && (o.status || '').toLowerCase() === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success btn-sm fw-bold"
                      disabled={actionId === o.id}
                      onClick={() => payOrder(o.id)}
                    >
                      {actionId === o.id ? 'Working…' : 'Pay now (mock)'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm fw-semibold"
                      disabled={actionId === o.id}
                      onClick={() => patchStatus(o.id, 'cancelled')}
                    >
                      Cancel order
                    </button>
                  </>
                )}
                {isSeller && (o.status || '').toLowerCase() === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm fw-semibold"
                    disabled={actionId === o.id}
                    onClick={() => patchStatus(o.id, 'cancelled')}
                  >
                    Cancel order
                  </button>
                )}
                {(o.status || '').toLowerCase() === 'confirmed' && (
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm fw-semibold"
                    disabled={actionId === o.id}
                    onClick={() => patchStatus(o.id, 'completed')}
                  >
                    Mark complete
                  </button>
                )}
              </div>
              <ul className="list-unstyled mb-0 small">
                {(o.items || []).map((it) => (
                  <li key={`${o.id}-${it.material_id}`} className="d-flex gap-2 align-items-center py-1 border-top border-light-subtle">
                    <div
                      className="rounded overflow-hidden flex-shrink-0"
                      style={{ width: 48, height: 48, background: 'var(--reloop-gray-100, #f3f4f6)' }}
                    >
                      <img
                        src={resolveAssetUrl(it.material_image)}
                        alt=""
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          if (e.currentTarget.src.includes(FALLBACK_IMAGE)) return;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{it.material_title || 'Material'}</div>
                      <div className="text-secondary">
                        Qty {it.quantity ?? '—'}
                        {it.line_price != null && ` · $${Number(it.line_price).toLocaleString()} each`}
                      </div>
                    </div>
                    <Link to={`/materials/${it.material_id}`} className="btn btn-outline-success btn-sm flex-shrink-0">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
