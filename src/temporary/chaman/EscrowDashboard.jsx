import React, { useState, useEffect, useCallback } from 'react';
import './EscrowDashboard.css';

const FILTER_TABS = [
  { key:'All',           label:'All',      icon:'📋' },
  { key:'PendingFunding',label:'Pending',  icon:'⏳' },
  { key:'Funded',        label:'Funded',   icon:'🔒' },
  { key:'Released',      label:'Released', icon:'✅' },
  { key:'Refunded',      label:'Refunded', icon:'↩️' },
  { key:'Disputed',      label:'Disputed', icon:'⚠️' },
];

const STATUS_LABELS = {
  PendingFunding:    '⏳ Pending Funding',
  Funded:            '🔒 Funds Held',
  PartiallyReleased: '🔄 Partially Released',
  Released:          '✅ Released',
  Refunded:          '↩️ Refunded',
  Disputed:          '⚠️ Disputed',
  Cancelled:         '❌ Cancelled',
};



const fmt      = (n) => `৳${Number(n||0).toLocaleString('en-BD')}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'}) : '—';
const initials = (name='') => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '??';

/* Default release conditions for the create form */
const RELEASE_CONDITIONS = [
  'DeliveryConfirmed',
  'ManualRelease',
];

/* ──────────────────────────────────────────
   COMPONENT
────────────────────────────────────────── */
export default function EscrowDashboard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [escrows, setEscrows]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState('');

  /* Dispute modal */
  const [disputeModal,     setDisputeModal]     = useState(null);
  const [disputeReason,    setDisputeReason]    = useState('');
  const [modalSubmitting,  setModalSubmitting]  = useState(false);

  /* Create escrow modal */
  const [createModal,  setCreateModal]  = useState(false);
  const [createForm,   setCreateForm]   = useState({ sellerId:'', amountHeld:'', product:'', releaseCondition:'DeliveryConfirmed', note:'' });
  const [createLoading,setCreateLoading]= useState(false);
  const [createError,  setCreateError]  = useState('');

  /* Detail expand & AI risk */
  const [expanded, setExpanded]     = useState(null);


  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''), 3500); };

  /* ── Load escrows from backend ── */
  const loadEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Not logged in – show demo banner
        setEscrows(DEMO_ESCROWS);
        setLoading(false);
        return;
      }
      const res = await fetch('/api/escrow/my', { headers:{ 'x-auth-token': token } });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setEscrows(data.length ? data : DEMO_ESCROWS);

    } catch {
      setEscrows(DEMO_ESCROWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEscrows(); }, [loadEscrows]);



  /* ── Confirm delivery ── */
  const handleConfirm = async (escrow) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`/api/escrow/${escrow._id}/confirm`, {
          method: 'PUT',
          headers: { 'Content-Type':'application/json', 'x-auth-token': token },
        });
        if (res.ok) {
          const updated = await res.json();
          setEscrows(prev => prev.map(e => e._id===escrow._id ? {...e,...updated} : e));
          showToast('✅ Delivery confirmed! Funds released to seller.');
          return;
        }
      }
    } catch { /* fall through */ }
    // Local update (demo mode)
    setEscrows(prev => prev.map(e => e._id===escrow._id ? {...e,status:'Released',releasedAt:new Date().toISOString()} : e));
    showToast('✅ Delivery confirmed! Funds released to seller.');
  };

  /* ── Raise dispute ── */
  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) return;
    setModalSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`/api/escrow/${disputeModal._id}/dispute`, {
          method: 'PUT',
          headers: { 'Content-Type':'application/json', 'x-auth-token': token },
          body: JSON.stringify({ disputeReason }),
        });
      }
      setEscrows(prev => prev.map(e => e._id===disputeModal._id
        ? {...e, status:'Disputed', disputeOpened:true, disputeReason}
        : e
      ));
      showToast('⚠️ Dispute raised. Our team will review within 24 hours.');
    } catch {
      showToast('⚠️ Dispute submitted (demo mode).');
    } finally {
      setDisputeModal(null); setDisputeReason(''); setModalSubmitting(false);
    }
  };

  /* ── Create new escrow ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.sellerId.trim()) return setCreateError('Seller User ID is required.');
    if (!createForm.amountHeld || parseFloat(createForm.amountHeld) < 1) return setCreateError('Amount must be at least ৳1.');
    if (!createForm.product.trim()) return setCreateError('Product name is required.');

    setCreateLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Login required to create escrow.');

      const res = await fetch('/api/escrow', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'x-auth-token': token },
        body:    JSON.stringify({
          sellerId:         createForm.sellerId.trim(),
          amountHeld:       parseFloat(createForm.amountHeld),
          product:          createForm.product.trim(),
          releaseCondition: createForm.releaseCondition,
          note:             createForm.note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create escrow');

      setEscrows(prev => [data, ...prev]);

      setCreateModal(false);
      setCreateForm({ sellerId:'', amountHeld:'', product:'', releaseCondition:'DeliveryConfirmed', note:'' });
      showToast('🔒 Escrow created! Funds are now securely held.');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Stats ── */
  const stats = {
    totalHeld:     escrows.filter(e=>e.status==='Funded').reduce((s,e)=>s+e.amountHeld,0),
    totalReleased: escrows.filter(e=>e.status==='Released').reduce((s,e)=>s+e.amountHeld,0),
    totalRefunded: escrows.filter(e=>e.status==='Refunded').reduce((s,e)=>s+e.amountHeld,0),
    totalDisputed: escrows.filter(e=>e.status==='Disputed').length,
  };

  const filtered = activeFilter==='All' ? escrows : escrows.filter(e=>e.status===activeFilter);
  const countOf  = (key) => key==='All' ? escrows.length : escrows.filter(e=>e.status===key).length;
  const isDemo   = !localStorage.getItem('token');

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
        <button
          onClick={()=>{setCreateModal(true);setCreateError('');}}
          style={{
            background:'linear-gradient(135deg,#344e41,#52796f)',color:'#fff',
            border:'none',borderRadius:'10px',padding:'10px 20px',cursor:'pointer',
            fontWeight:700,fontSize:'0.9rem',display:'flex',alignItems:'center',gap:'8px',
            boxShadow:'0 4px 12px rgba(52,78,65,0.3)', whiteSpace:'nowrap',
          }}
        >
          + Create Escrow
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div style={{margin:'0 0 16px 0',padding:'12px 16px',background:'#fff3cd',borderRadius:'10px',color:'#856404',fontWeight:600,fontSize:'0.88rem'}}>
          📋 <strong>Demo Mode</strong> — Login to manage real escrow transactions.
        </div>
      )}

      {/* Stats */}
      <div className="esc-stats">
        {[
          { label:'Funds Held',      value:fmt(stats.totalHeld),     sub:'Currently locked',    icon:'🔒', cls:'icon-held'     },
          { label:'Total Released',  value:fmt(stats.totalReleased), sub:'Successfully settled', icon:'✅', cls:'icon-released' },
          { label:'Total Refunded',  value:fmt(stats.totalRefunded), sub:'Returned to buyers',   icon:'↩️', cls:'icon-refunded' },
          { label:'Active Disputes', value:stats.totalDisputed,      sub:'Under review',         icon:'⚠️', cls:'icon-disputed' },
        ].map((s,i) => (
          <div className="esc-stat-card" key={s.label} style={{animationDelay:`${i*0.08}s`}}>
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
        <div className="esc-banner">
          <div className="esc-banner-icon">🏦</div>
          <div className="esc-banner-text">
            <h4>AgriNetwork Escrow Protection</h4>
            <p>Buyer funds are securely held and only released upon confirmed delivery. Raise a dispute within 48 hours if there is an issue.</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="esc-filter-bar">
          {FILTER_TABS.map(tab => (
            <button key={tab.key}
              className={`esc-filter-tab ${activeFilter===tab.key?'active':''}`}
              onClick={()=>setActiveFilter(tab.key)}>
              {tab.icon} {tab.label}
              <span className="esc-tab-count">{countOf(tab.key)}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="esc-list"><div className="esc-spinner"/></div>
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
              const buyerName  = escrow.buyerId?.fullName  || escrow.buyerId?.name  || 'Buyer';
              const sellerName = escrow.sellerId?.fullName || escrow.sellerId?.name || 'Seller';
              return (
                <div key={escrow._id} className="esc-tx-card" style={{animationDelay:`${i*0.07}s`}}>
                  <div className="esc-tx-top">
                    <div className="esc-tx-info">
                      <h4>📦 {escrow.product || `Order #${escrow.orderId}`}</h4>
                      <div className="esc-tx-id">ID: {escrow._id} {escrow.orderId && `· Order: ${escrow.orderId}`}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px'}}>
                      <span className={`esc-status status-${escrow.status}`}>
                        {STATUS_LABELS[escrow.status] || escrow.status}
                      </span>

                    </div>
                  </div>

                  <div className="esc-tx-body">
                    <div className="esc-amount-block">
                      <div className="esc-amount-label">Amount Held</div>
                      <div className="esc-amount-value">{fmt(escrow.amountHeld)}</div>
                      <div className="esc-amount-curr">+ {fmt(escrow.feeAmount)} fee (1%)</div>
                    </div>
                    <div className="esc-parties">
                      <div className="esc-party">
                        <div className="esc-party-avatar avatar-buyer">{initials(buyerName)}</div>
                        <div className="esc-party-info">
                          <div className="esc-party-role">Buyer</div>
                          <div className="esc-party-name">{buyerName}</div>
                        </div>
                      </div>
                      <div className="esc-party">
                        <div className="esc-party-avatar avatar-seller">{initials(sellerName)}</div>
                        <div className="esc-party-info">
                          <div className="esc-party-role">Seller</div>
                          <div className="esc-party-name">{sellerName}</div>
                        </div>
                      </div>
                    </div>
                  </div>



                  <div className="esc-condition">
                    🔑 Release on: <strong>{escrow.releaseCondition}</strong>
                    &nbsp;·&nbsp; Created: {fmtDate(escrow.createdAt)}
                    {escrow.fundedAt   && <>&nbsp;·&nbsp; Funded: {fmtDate(escrow.fundedAt)}</>}
                    {escrow.releasedAt && <>&nbsp;·&nbsp; Released: {fmtDate(escrow.releasedAt)}</>}
                    {escrow.refundedAt && <>&nbsp;·&nbsp; Refunded: {fmtDate(escrow.refundedAt)}</>}
                  </div>

                  {escrow.disputeOpened && escrow.disputeReason && (
                    <div className="esc-dispute-reason">
                      ⚠️ <strong>Dispute Reason:</strong> {escrow.disputeReason}
                    </div>
                  )}

                  <div className="esc-actions">
                    {escrow.status === 'Funded' && (
                      <>
                        <button className="esc-btn esc-btn-confirm" onClick={()=>handleConfirm(escrow)}>
                          ✅ Confirm Delivery
                        </button>
                        <button className="esc-btn esc-btn-dispute"
                          onClick={()=>{setDisputeModal(escrow);setDisputeReason('');}}>
                          ⚠️ Raise Dispute
                        </button>
                      </>
                    )}

                    <button className="esc-btn esc-btn-view" onClick={()=>setExpanded(isExpanded?null:escrow._id)}>
                      {isExpanded?'▲ Less':'▼ Details'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{marginTop:'1rem',padding:'1rem',background:'#fafaf8',borderRadius:'10px',fontSize:'0.84rem',color:'var(--text-muted)',lineHeight:'1.7'}}>
                      <div><strong style={{color:'var(--primary-dark)'}}>Escrow ID:</strong> {escrow._id}</div>
                      {escrow.orderId && <div><strong style={{color:'var(--primary-dark)'}}>Order ID:</strong> {String(escrow.orderId)}</div>}
                      <div><strong style={{color:'var(--primary-dark)'}}>Product:</strong> {escrow.product||'—'}</div>
                      <div><strong style={{color:'var(--primary-dark)'}}>Amount Held:</strong> {fmt(escrow.amountHeld)}</div>
                      <div><strong style={{color:'var(--primary-dark)'}}>Platform Fee (1%):</strong> {fmt(escrow.feeAmount)}</div>
                      <div><strong style={{color:'var(--primary-dark)'}}>Release Condition:</strong> {escrow.releaseCondition}</div>
                      <div><strong style={{color:'var(--primary-dark)'}}>Status:</strong> {escrow.status}</div>
                      {escrow.note && <div><strong style={{color:'var(--primary-dark)'}}>Note:</strong> {escrow.note}</div>}
                      {escrow.releaseAmount>0 && <div><strong style={{color:'var(--primary-dark)'}}>Released Amount:</strong> {fmt(escrow.releaseAmount)}</div>}
                      {escrow.refundAmount>0  && <div><strong style={{color:'var(--primary-dark)'}}>Refund Amount:</strong> {fmt(escrow.refundAmount)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Escrow Modal ── */}
      {createModal && (
        <div className="esc-modal-overlay" onClick={e=>{if(e.target.classList.contains('esc-modal-overlay'))setCreateModal(false);}}>
          <div className="esc-modal" style={{maxWidth:'480px'}}>
            <h3>🔒 Create New Escrow</h3>
            <p>Funds will be held securely until delivery is confirmed by the buyer.</p>
            {createError && <div style={{background:'#f8d7da',color:'#721c24',padding:'8px 12px',borderRadius:'8px',marginBottom:'12px',fontSize:'0.85rem'}}>⚠️ {createError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',marginBottom:'4px',fontWeight:600,fontSize:'0.85rem'}}>Seller User ID *</label>
                <input
                  style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1.5px solid #ddd',fontSize:'0.9rem',boxSizing:'border-box'}}
                  placeholder="Paste the seller's User ID from their profile"
                  value={createForm.sellerId}
                  onChange={e=>setCreateForm(p=>({...p,sellerId:e.target.value}))}
                  required
                />
                <small style={{color:'#888',fontSize:'0.78rem'}}>Find it on the seller's listing or profile page</small>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',marginBottom:'4px',fontWeight:600,fontSize:'0.85rem'}}>Product / Description *</label>
                <input
                  style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1.5px solid #ddd',fontSize:'0.9rem',boxSizing:'border-box'}}
                  placeholder="e.g. Boro Rice (50 Bags)"
                  value={createForm.product}
                  onChange={e=>setCreateForm(p=>({...p,product:e.target.value}))}
                  required
                />
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',marginBottom:'4px',fontWeight:600,fontSize:'0.85rem'}}>Amount (BDT) *</label>
                <input
                  type="number" min="1" step="1"
                  style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1.5px solid #ddd',fontSize:'0.9rem',boxSizing:'border-box'}}
                  placeholder="e.g. 15000"
                  value={createForm.amountHeld}
                  onChange={e=>setCreateForm(p=>({...p,amountHeld:e.target.value}))}
                  required
                />
                {createForm.amountHeld && <small style={{color:'#588157'}}>Platform fee (1%): {fmt(Math.round(parseFloat(createForm.amountHeld||0)*0.01))}</small>}
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',marginBottom:'4px',fontWeight:600,fontSize:'0.85rem'}}>Release Condition</label>
                <select
                  style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1.5px solid #ddd',fontSize:'0.9rem',boxSizing:'border-box'}}
                  value={createForm.releaseCondition}
                  onChange={e=>setCreateForm(p=>({...p,releaseCondition:e.target.value}))}
                >
                  {RELEASE_CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',marginBottom:'4px',fontWeight:600,fontSize:'0.85rem'}}>Note (optional)</label>
                <textarea
                  rows={2}
                  style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1.5px solid #ddd',fontSize:'0.9rem',boxSizing:'border-box',resize:'vertical'}}
                  placeholder="Any special delivery terms…"
                  value={createForm.note}
                  onChange={e=>setCreateForm(p=>({...p,note:e.target.value}))}
                />
              </div>
              <div className="esc-modal-actions">
                <button type="button" className="esc-modal-cancel" onClick={()=>setCreateModal(false)}>Cancel</button>
                <button type="submit" className="esc-modal-submit" disabled={createLoading}>
                  {createLoading ? '⏳ Creating…' : '🔒 Lock Funds in Escrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dispute Modal ── */}
      {disputeModal && (
        <div className="esc-modal-overlay" onClick={e=>{if(e.target.classList.contains('esc-modal-overlay'))setDisputeModal(null);}}>
          <div className="esc-modal">
            <h3>⚠️ Raise a Dispute</h3>
            <p>
              Escrow <strong>{disputeModal._id}</strong> · Amount: <strong>{fmt(disputeModal.amountHeld)}</strong>
              <br/>Please describe the issue clearly. Our team will review within 24 hours.
            </p>
            <textarea
              placeholder="e.g. Goods not delivered, wrong quantity received, damaged items..."
              value={disputeReason}
              onChange={e=>setDisputeReason(e.target.value)}
              rows={5}
            />
            <div className="esc-modal-actions">
              <button className="esc-modal-cancel" onClick={()=>setDisputeModal(null)}>Cancel</button>
              <button className="esc-modal-submit" onClick={handleDisputeSubmit}
                disabled={!disputeReason.trim()||modalSubmitting}>
                {modalSubmitting?'Submitting…':'⚠️ Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="esc-toast">{toast}</div>}
    </div>
  );
}

/* ────────────────────────────────────
   Demo data (shown when not logged in)
──────────────────────────────────── */
const DEMO_ESCROWS = [
  {
    _id:'ESC-DEMO-001', orderId:'ORD-9921',
    buyerId:{name:'Rahim Uddin',fullName:'Rahim Uddin',email:'rahim@example.com'},
    sellerId:{name:'Karim Farm',fullName:'Karim Farm',email:'karim@example.com'},
    amountHeld:12500, feeAmount:125, status:'Funded',
    releaseCondition:'DeliveryConfirmed', fundedAt:'2024-03-18T10:30:00Z',
    createdAt:'2024-03-17T08:00:00Z', product:'Boro Rice (25 Bags)',
    risk:{ riskLevel:'Low', riskScore:12, riskReason:'Standard transaction. Amount within normal range.', aiPowered:false },
  },
  {
    _id:'ESC-DEMO-002', orderId:'ORD-9876',
    buyerId:{name:'Nasrin Begum',fullName:'Nasrin Begum'},
    sellerId:{name:'Green Valley Farm',fullName:'Green Valley Farm'},
    amountHeld:8750, feeAmount:87, status:'Released',
    releaseCondition:'DeliveryConfirmed', fundedAt:'2024-03-10T09:00:00Z',
    releasedAt:'2024-03-15T14:20:00Z', createdAt:'2024-03-09T11:00:00Z',
    product:'Mustard Oil (50 Litres)',
    risk:{ riskLevel:'Low', riskScore:8, riskReason:'Completed transaction. No issues.', aiPowered:false },
  },
  {
    _id:'ESC-DEMO-003', orderId:'ORD-9745',
    buyerId:{name:'Shahidul Islam',fullName:'Shahidul Islam'},
    sellerId:{name:'AgroSeed BD',fullName:'AgroSeed BD'},
    amountHeld:5200, feeAmount:52, status:'Disputed',
    releaseCondition:'OTPConfirmed', fundedAt:'2024-03-05T07:00:00Z',
    createdAt:'2024-03-04T15:00:00Z', disputeOpened:true,
    disputeReason:'Delivered quantity does not match invoice. Received 80 kg instead of 100 kg.',
    product:'Tomato Seeds (100 kg)',
    risk:{ riskLevel:'High', riskScore:82, riskReason:'Active dispute detected – review urgently.', aiPowered:false },
  },
  {
    _id:'ESC-DEMO-004', orderId:'ORD-9650',
    buyerId:{name:'Aminul Haque',fullName:'Aminul Haque'},
    sellerId:{name:'North Bengal Agro',fullName:'North Bengal Agro'},
    amountHeld:6300, feeAmount:63, status:'PendingFunding',
    releaseCondition:'DeliveryConfirmed', createdAt:'2024-03-20T09:00:00Z',
    product:'Potato (150 Bags)',
    risk:{ riskLevel:'Medium', riskScore:35, riskReason:'Pending for over 5 days – follow up with buyer.', aiPowered:false },
  },
];
