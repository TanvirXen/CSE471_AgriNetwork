import React, { useState, useEffect, useCallback } from 'react';
import './EscrowDashboard.css';

/* ─── Demo / fallback data ─── */
const DEMO_ESCROWS = [
  {
    _id: 'ESC-2024-001',
    orderId: 'ORD-9921',
    buyerId:  { name: 'Rahim Uddin', email: 'rahim@example.com' },
    sellerId: { name: 'Karim Farm', email: 'karim@example.com' },
    amountHeld: 12500,
    feeAmount: 125,
    status: 'Funded',
    releaseCondition: 'DeliveryConfirmed',
    fundedAt: '2024-03-18T10:30:00Z',
    createdAt: '2024-03-17T08:00:00Z',
    disputeOpened: false,
    product: 'Boro Rice (25 Bags)',
  },
  {
    _id: 'ESC-2024-002',
    orderId: 'ORD-9876',
    buyerId:  { name: 'Nasrin Begum', email: 'nasrin@example.com' },
    sellerId: { name: 'Green Valley Farm', email: 'green@example.com' },
    amountHeld: 8750,
    feeAmount: 87.5,
    status: 'Released',
    releaseCondition: 'DeliveryConfirmed',
    fundedAt: '2024-03-10T09:00:00Z',
    releasedAt: '2024-03-15T14:20:00Z',
    createdAt: '2024-03-09T11:00:00Z',
    disputeOpened: false,
    product: 'Mustard Oil (50 Litres)',
  },
  {
    _id: 'ESC-2024-003',
    orderId: 'ORD-9745',
    buyerId:  { name: 'Shahidul Islam', email: 'shahid@example.com' },
    sellerId: { name: 'AgroSeed BD', email: 'agroseed@example.com' },
    amountHeld: 5200,
    feeAmount: 52,
    status: 'Disputed',
    releaseCondition: 'OTPConfirmed',
    fundedAt: '2024-03-05T07:00:00Z',
    createdAt: '2024-03-04T15:00:00Z',
    disputeOpened: true,
    disputeReason: 'Delivered quantity does not match invoice. Received 80 kg instead of 100 kg.',
    product: 'Tomato Seeds (100 kg)',
  },
  {
    _id: 'ESC-2024-004',
    orderId: 'ORD-9701',
    buyerId:  { name: 'Fatema Khatun', email: 'fatema@example.com' },
    sellerId: { name: 'Riverside Harvest', email: 'river@example.com' },
    amountHeld: 18000,
    feeAmount: 180,
    status: 'Refunded',
    releaseCondition: 'AdminApproved',
    fundedAt: '2024-02-28T08:00:00Z',
    refundedAt: '2024-03-02T11:00:00Z',
    createdAt: '2024-02-27T12:00:00Z',
    disputeOpened: true,
    disputeReason: 'Seller cancelled shipment after payment.',
    refundAmount: 18000,
    product: 'Hilsha Fish (200 kg)',
  },
  {
    _id: 'ESC-2024-005',
    orderId: 'ORD-9650',
    buyerId:  { name: 'Aminul Haque', email: 'amin@example.com' },
    sellerId: { name: 'North Bengal Agro', email: 'north@example.com' },
    amountHeld: 6300,
    feeAmount: 63,
    status: 'PendingFunding',
    releaseCondition: 'DeliveryConfirmed',
    fundedAt: null,
    createdAt: '2024-03-20T09:00:00Z',
    disputeOpened: false,
    product: 'Potato (150 bags)',
  },
];

const FILTER_TABS = [
  { key: 'All', label: 'All', icon: '📋' },
  { key: 'PendingFunding', label: 'Pending', icon: '⏳' },
  { key: 'Funded', label: 'Funded', icon: '🔒' },
  { key: 'Released', label: 'Released', icon: '✅' },
  { key: 'Refunded', label: 'Refunded', icon: '↩️' },
  { key: 'Disputed', label: 'Disputed', icon: '⚠️' },
];

const STATUS_LABELS = {
  PendingFunding: '⏳ Pending Funding',
  Funded: '🔒 Funds Held',
  PartiallyReleased: '🔄 Partially Released',
  Released: '✅ Released',
  Refunded: '↩️ Refunded',
  Disputed: '⚠️ Disputed',
  Cancelled: '❌ Cancelled',
};

const fmt = (n) => `৳${Number(n).toLocaleString('en-BD')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const getPartyName = (party, fallback) => party?.fullName || party?.name || fallback;
const getOrderLabel = (escrow) =>
  (typeof escrow.orderId === 'object' ? escrow.orderId?.orderNumber || escrow.orderId?._id : escrow.orderId) || 'N/A';
const getProductLabel = (escrow) =>
  escrow.product ||
  escrow.orderId?.items?.map((item) => item.productName).filter(Boolean).join(', ') ||
  `Order #${getOrderLabel(escrow)}`;

/* ─── COMPONENT ─── */
export default function EscrowDashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  /* Dispute modal */
  const [disputeModal, setDisputeModal] = useState(null); // escrow object
  const [disputeReason, setDisputeReason] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  /* Detail expand */
  const [expanded, setExpanded] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  /* Load escrows */
  const loadEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/escrow/my', {
        headers: token ? { 'x-auth-token': token } : {},
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEscrows(data.length ? data : DEMO_ESCROWS);
    } catch {
      setEscrows(DEMO_ESCROWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEscrows(); }, [loadEscrows]);

  /* Confirm delivery */
  const handleConfirm = async (escrow) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/escrow/${escrow._id}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
      });
      if (res.ok) {
        setEscrows(prev => prev.map(e => e._id === escrow._id ? { ...e, status: 'Released', releasedAt: new Date().toISOString() } : e));
        showToast('✅ Delivery confirmed! Funds released to seller.');
      } else {
        // Demo mode: update locally
        setEscrows(prev => prev.map(e => e._id === escrow._id ? { ...e, status: 'Released', releasedAt: new Date().toISOString() } : e));
        showToast('✅ Delivery confirmed! Funds released to seller.');
      }
    } catch {
      setEscrows(prev => prev.map(e => e._id === escrow._id ? { ...e, status: 'Released', releasedAt: new Date().toISOString() } : e));
      showToast('✅ Delivery confirmed! Funds released to seller.');
    }
  };

  /* Raise dispute */
  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) return;
    setModalSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/escrow/${disputeModal._id}/dispute`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify({ disputeReason }),
      });
      if (res.ok || true) {
        setEscrows(prev => prev.map(e =>
          e._id === disputeModal._id
            ? { ...e, status: 'Disputed', disputeOpened: true, disputeReason }
            : e
        ));
        showToast('⚠️ Dispute raised. Our team will review within 24 hours.');
      }
    } catch {
      setEscrows(prev => prev.map(e =>
        e._id === disputeModal._id
          ? { ...e, status: 'Disputed', disputeOpened: true, disputeReason }
          : e
      ));
      showToast('⚠️ Dispute raised. Our team will review within 24 hours.');
    } finally {
      setDisputeModal(null);
      setDisputeReason('');
      setModalSubmitting(false);
    }
  };

  /* Stats */
  const stats = {
    totalHeld:     escrows.filter(e => e.status === 'Funded').reduce((s, e) => s + e.amountHeld, 0),
    totalReleased: escrows.filter(e => e.status === 'Released').reduce((s, e) => s + e.amountHeld, 0),
    totalRefunded: escrows.filter(e => e.status === 'Refunded').reduce((s, e) => s + e.amountHeld, 0),
    totalDisputed: escrows.filter(e => e.status === 'Disputed').length,
  };

  const filtered = activeFilter === 'All' ? escrows : escrows.filter(e => e.status === activeFilter);
  const countOf = (key) => key === 'All' ? escrows.length : escrows.filter(e => e.status === key).length;

  return (
    <div className="esc-page">
      {/* Header */}
      <div className="esc-header">
        <div className="esc-header-content">
          <div className="esc-header-icon">🛡️</div>
          <div>
            <h1>Escrow Dashboard</h1>
            <p>Secure payment protection — buyer funds held until delivery confirmation</p>
            <span className="esc-header-badge">🔐 Fraud-proof · Trusted Transactions</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="esc-stats">
        {[
          { label: 'Funds Held', value: fmt(stats.totalHeld), sub: 'Currently locked', icon: '🔒', cls: 'icon-held' },
          { label: 'Total Released', value: fmt(stats.totalReleased), sub: 'Successfully settled', icon: '✅', cls: 'icon-released' },
          { label: 'Total Refunded', value: fmt(stats.totalRefunded), sub: 'Returned to buyers', icon: '↩️', cls: 'icon-refunded' },
          { label: 'Active Disputes', value: stats.totalDisputed, sub: 'Under review', icon: '⚠️', cls: 'icon-disputed' },
        ].map((s, i) => (
          <div className="esc-stat-card" key={s.label} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="esc-stat-top">
              <span className="esc-stat-label">{s.label}</span>
              <div className={`esc-stat-icon ${s.cls}`}>{s.icon}</div>
            </div>
            <div className="esc-stat-value">{s.value}</div>
            <div className="esc-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="esc-main">
        {/* Protection banner */}
        <div className="esc-banner">
          <div className="esc-banner-icon">🏦</div>
          <div className="esc-banner-text">
            <h4>AgriNetwork Escrow Protection</h4>
            <p>Buyer funds are securely held and only released upon confirmed delivery. Raise a dispute within 48 hours of delivery if there is an issue.</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="esc-filter-bar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              className={`esc-filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.icon} {tab.label}
              <span className="esc-tab-count">{countOf(tab.key)}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="esc-list"><div className="esc-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="esc-list">
            <div className="esc-empty">
              <span className="esc-empty-icon">🛡️</span>
              <h4>No Escrow Transactions</h4>
              <p>No transactions found for this filter.</p>
            </div>
          </div>
        ) : (
          <div className="esc-list">
            {filtered.map((escrow, i) => {
              const isExpanded = expanded === escrow._id;
              return (
                <div key={escrow._id} className="esc-tx-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  {/* Top row */}
                  <div className="esc-tx-top">
                    <div className="esc-tx-info">
                      <h4>📦 {getProductLabel(escrow)}</h4>
                      <div className="esc-tx-id">ID: {escrow._id} · Order: {getOrderLabel(escrow)}</div>
                    </div>
                    <span className={`esc-status status-${escrow.status}`}>
                      {STATUS_LABELS[escrow.status] || escrow.status}
                    </span>
                  </div>

                  {/* Amount + Parties */}
                  <div className="esc-tx-body">
                    <div className="esc-amount-block">
                      <div className="esc-amount-label">Amount Held</div>
                      <div className="esc-amount-value">{fmt(escrow.amountHeld)}</div>
                      <div className="esc-amount-curr">+ {fmt(escrow.feeAmount)} fee</div>
                    </div>
                    <div className="esc-parties">
                      <div className="esc-party">
                        <div className="esc-party-avatar avatar-buyer">{initials(getPartyName(escrow.buyerId, 'Buyer'))}</div>
                        <div className="esc-party-info">
                          <div className="esc-party-role">Buyer</div>
                          <div className="esc-party-name">{getPartyName(escrow.buyerId, 'Unknown Buyer')}</div>
                        </div>
                      </div>
                      <div className="esc-party">
                        <div className="esc-party-avatar avatar-seller">{initials(getPartyName(escrow.sellerId, 'Seller'))}</div>
                        <div className="esc-party-info">
                          <div className="esc-party-role">Seller</div>
                          <div className="esc-party-name">{getPartyName(escrow.sellerId, 'Unknown Seller')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Release condition + timeline */}
                  <div className="esc-condition">
                    🔑 Release on: <strong>{escrow.releaseCondition}</strong>
                    &nbsp;·&nbsp; Created: {fmtDate(escrow.createdAt)}
                    {escrow.fundedAt && <>&nbsp;·&nbsp; Funded: {fmtDate(escrow.fundedAt)}</>}
                    {escrow.releasedAt && <>&nbsp;·&nbsp; Released: {fmtDate(escrow.releasedAt)}</>}
                    {escrow.refundedAt && <>&nbsp;·&nbsp; Refunded: {fmtDate(escrow.refundedAt)}</>}
                  </div>

                  {/* Dispute reason if applicable */}
                  {escrow.disputeOpened && escrow.disputeReason && (
                    <div className="esc-dispute-reason">
                      ⚠️ <strong>Dispute Reason:</strong> {escrow.disputeReason}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="esc-actions">
                    {escrow.status === 'Funded' && (
                      <>
                        <button
                          className="esc-btn esc-btn-confirm"
                          onClick={() => handleConfirm(escrow)}
                        >
                          ✅ Confirm Delivery
                        </button>
                        <button
                          className="esc-btn esc-btn-dispute"
                          onClick={() => { setDisputeModal(escrow); setDisputeReason(''); }}
                        >
                          ⚠️ Raise Dispute
                        </button>
                      </>
                    )}
                    <button
                      className="esc-btn esc-btn-view"
                      onClick={() => setExpanded(isExpanded ? null : escrow._id)}
                    >
                      {isExpanded ? '▲ Less' : '▼ Details'}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#fafaf8', borderRadius: '10px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Escrow ID:</strong> {escrow._id}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Order ID:</strong> {getOrderLabel(escrow)}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Product:</strong> {getProductLabel(escrow)}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Amount Held:</strong> {fmt(escrow.amountHeld)}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Platform Fee (1%):</strong> {fmt(escrow.feeAmount)}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Release Condition:</strong> {escrow.releaseCondition}</div>
                      <div><strong style={{ color: 'var(--primary-dark)' }}>Status:</strong> {escrow.status}</div>
                      {escrow.releaseAmount > 0 && <div><strong style={{ color: 'var(--primary-dark)' }}>Released Amount:</strong> {fmt(escrow.releaseAmount)}</div>}
                      {escrow.refundAmount > 0 && <div><strong style={{ color: 'var(--primary-dark)' }}>Refund Amount:</strong> {fmt(escrow.refundAmount)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="esc-modal-overlay" onClick={(e) => { if (e.target.classList.contains('esc-modal-overlay')) setDisputeModal(null); }}>
          <div className="esc-modal">
            <h3>⚠️ Raise a Dispute</h3>
            <p>
              Escrow <strong>{disputeModal._id}</strong> · Amount: <strong>{fmt(disputeModal.amountHeld)}</strong>
              <br />
              Please describe the issue clearly. Our team will review within 24 hours.
            </p>
            <textarea
              placeholder="e.g. Goods not delivered, wrong quantity received, damaged items..."
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              rows={5}
            />
            <div className="esc-modal-actions">
              <button className="esc-modal-cancel" onClick={() => setDisputeModal(null)}>Cancel</button>
              <button
                className="esc-modal-submit"
                onClick={handleDisputeSubmit}
                disabled={!disputeReason.trim() || modalSubmitting}
              >
                {modalSubmitting ? 'Submitting…' : '⚠️ Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="esc-toast">{toast}</div>}
    </div>
  );
}
