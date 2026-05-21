import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../utils/assets';
import './rolePages.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

function luhnCheck(num) {
  const s = digitsOnly(num);
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = s.length - 1; i >= 0; i -= 1) {
    let d = Number(s[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function parseExpiry(mmYY) {
  const raw = String(mmYY || '').trim();
  const m = raw.match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const yy = Number(m[2]);
  if (!Number.isFinite(mm) || mm < 1 || mm > 12) return null;
  const fullYear = 2000 + yy;
  const expiresAt = new Date(fullYear, mm, 0, 23, 59, 59, 999);
  return { mm, yy, fullYear, expiresAt };
}

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
  const { t } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payOrderDraft, setPayOrderDraft] = useState(null);
  const [payForm, setPayForm] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [payErrors, setPayErrors] = useState({});

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
      setError(err.response?.data?.error || t('paymentFailed'));
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
      setError(err.response?.data?.error || t('updateFailed'));
    } finally {
      setActionId(null);
    }
  };

  const openPay = (order) => {
    setPayErrors({});
    setError('');
    setPayOrderDraft(order);
    setPayForm({
      nameOnCard: user?.name || '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    });
    setPayOpen(true);
  };

  const closePay = () => {
    if (actionId) return;
    setPayOpen(false);
    setPayOrderDraft(null);
    setPayErrors({});
  };

  const validatePayForm = () => {
    const next = {};
    if (!payForm.nameOnCard.trim()) next.nameOnCard = t('nameOnCardRequired');

    const cardDigits = digitsOnly(payForm.cardNumber);
    if (!cardDigits) next.cardNumber = t('cardNumberRequired');
    else if (!luhnCheck(cardDigits)) next.cardNumber = t('cardNumberInvalid');

    const exp = parseExpiry(payForm.expiry);
    if (!payForm.expiry.trim()) next.expiry = t('expiryRequired');
    else if (!exp) next.expiry = t('expiryInvalid');
    else if (exp.expiresAt < new Date()) next.expiry = t('cardExpired');

    const cvvDigits = digitsOnly(payForm.cvv);
    if (!cvvDigits) next.cvv = t('cvvRequired');
    else if (cvvDigits.length < 3 || cvvDigits.length > 4) next.cvv = t('cvvInvalid');

    setPayErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitPay = async () => {
    if (!payOrderDraft) return;
    if (!validatePayForm()) return;
    await payOrder(payOrderDraft.id);
    setPayOpen(false);
    setPayOrderDraft(null);
  };

  return (
    <div className="role-page py-4 px-3">
      <header className="role-page-hero role-page-hero--gradient mb-4">
        <h1 className="role-page-title">{t('orders')}</h1>
        <p className="role-page-lead mb-0">
          {isSeller
            ? t('ordersDescriptionSeller')
            : t('ordersDescriptionBuyer')}
        </p>
      </header>

      {loading && (
        <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
          <span>{t('loadingOrders')}</span>
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
                      onClick={() => openPay(o)}
                    >
                      {actionId === o.id ? 'Working…' : 'Pay now'}
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
                        {it.line_price != null &&
                          ` · $${Number(it.line_price).toLocaleString()} ${t('priceLotSuffix')}`}
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

      {payOpen && (
        <>
          <div
            className="modal fade show"
            role="dialog"
            aria-modal="true"
            style={{ display: 'block' }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closePay();
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Pay securely (mock)</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={closePay} disabled={!!actionId} />
                </div>
                <div className="modal-body">
                  <div className="d-flex justify-content-between gap-2 mb-3">
                    <div className="text-secondary small">Order #{payOrderDraft?.id}</div>
                    <div className="fw-semibold">
                      {payOrderDraft?.total_price != null ? `$${Number(payOrderDraft.total_price).toLocaleString()}` : '—'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Name on card</label>
                    <input
                      type="text"
                      className={`form-control${payErrors.nameOnCard ? ' is-invalid' : ''}`}
                      value={payForm.nameOnCard}
                      onChange={(e) => setPayForm((p) => ({ ...p, nameOnCard: e.target.value }))}
                      autoComplete="cc-name"
                      disabled={!!actionId}
                    />
                    {payErrors.nameOnCard && <div className="invalid-feedback">{payErrors.nameOnCard}</div>}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Card number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control${payErrors.cardNumber ? ' is-invalid' : ''}`}
                      value={payForm.cardNumber}
                      onChange={(e) => setPayForm((p) => ({ ...p, cardNumber: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      autoComplete="cc-number"
                      disabled={!!actionId}
                    />
                    {payErrors.cardNumber && <div className="invalid-feedback">{payErrors.cardNumber}</div>}
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Expiry</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control${payErrors.expiry ? ' is-invalid' : ''}`}
                        value={payForm.expiry}
                        onChange={(e) => setPayForm((p) => ({ ...p, expiry: e.target.value }))}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                        disabled={!!actionId}
                      />
                      {payErrors.expiry && <div className="invalid-feedback">{payErrors.expiry}</div>}
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">CVV</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        className={`form-control${payErrors.cvv ? ' is-invalid' : ''}`}
                        value={payForm.cvv}
                        onChange={(e) => setPayForm((p) => ({ ...p, cvv: e.target.value }))}
                        placeholder="123"
                        autoComplete="cc-csc"
                        disabled={!!actionId}
                      />
                      {payErrors.cvv && <div className="invalid-feedback">{payErrors.cvv}</div>}
                    </div>
                  </div>

                  <div className="alert alert-info mt-3 mb-0 small" role="alert">
                    This is a <strong>mock checkout</strong>. No real card data is stored or processed.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary fw-semibold" onClick={closePay} disabled={!!actionId}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success fw-bold"
                    onClick={submitPay}
                    disabled={!!actionId}
                  >
                    {actionId ? 'Processing…' : 'Pay & confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default OrdersPage;
