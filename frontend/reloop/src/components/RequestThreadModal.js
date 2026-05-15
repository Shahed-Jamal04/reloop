import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './RequestThreadModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const POLL_INTERVAL_MS = 6000;

function formatTime(dt) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    return sameDay
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  } catch {
    return '';
  }
}

export default function RequestThreadModal({ open, onClose, requestId, title, counterpartName }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);

  const load = async (silent = false) => {
    if (!requestId) return;
    try {
      if (!silent) setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE_URL}/requests/${requestId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.error('Failed to load thread:', err);
      setError(err.response?.data?.error || 'Failed to load messages.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load + poll while open
  useEffect(() => {
    if (!open || !requestId) return;
    load();
    const iv = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestId, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, open]);

  // Focus the input when the modal opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async (e) => {
    e?.preventDefault?.();
    const body = text.trim();
    if (!body || sending) return;
    try {
      setSending(true);
      setError('');
      const res = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/messages`,
        { message: body },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!open) return null;

  return (
    <div className="chat-backdrop" onClick={onClose} role="presentation">
      <div
        className="chat-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Conversation"
      >
        <header className="chat-header">
          <div className="min-w-0">
            <div className="text-secondary small text-uppercase fw-semibold" style={{ letterSpacing: '.05em' }}>
              Conversation
            </div>
            <div className="fw-bold text-truncate">{title || 'Request'}</div>
            {counterpartName && (
              <div className="text-secondary small">
                <i className="bi bi-person me-1" aria-hidden="true" />
                with {counterpartName}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary chat-close"
            onClick={onClose}
            aria-label="Close conversation"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="chat-body" ref={scrollerRef}>
          {loading && messages.length === 0 && (
            <div className="d-flex justify-content-center align-items-center gap-2 py-5 text-secondary">
              <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
              <span>Loading conversation…</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mx-3 mt-3 mb-0" role="alert">{error}</div>
          )}

          {!loading && messages.length === 0 && !error && (
            <div className="chat-empty">
              <div className="empty-state-icon mx-auto mb-2" aria-hidden="true">
                <i className="bi bi-chat-dots" />
              </div>
              <p className="fw-semibold mb-1 text-secondary">No messages yet</p>
              <p className="small text-secondary mb-0">
                Send the first message to start the conversation.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const mine = Number(m.sender_id) === Number(user?.id);
            return (
              <div key={m.id} className={`chat-msg ${mine ? 'mine' : 'theirs'}`}>
                {!mine && <div className="chat-msg-sender">{m.sender_name}</div>}
                <div className="chat-bubble">{m.message}</div>
                <div className="chat-msg-time">{formatTime(m.created_at)}</div>
              </div>
            );
          })}
        </div>

        <form className="chat-composer" onSubmit={send}>
          <textarea
            ref={inputRef}
            className="form-control"
            rows={2}
            placeholder="Write a message…  (Enter to send, Shift+Enter for newline)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={2000}
            disabled={sending}
          />
          <button
            type="submit"
            className="btn btn-success fw-bold"
            disabled={sending || !text.trim()}
            aria-label="Send message"
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <i className="bi bi-send-fill me-1" aria-hidden="true" />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
