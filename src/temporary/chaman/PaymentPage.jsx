// PaymentPage.jsx — AgriNetwork Bangladesh
// Payment hub linking to Escrow for secure agricultural transactions

import React, { useState } from 'react';

const PAYMENT_METHODS = [
  { id: 'bkash', name: 'bKash', icon: '📱', color: '#E2136E', desc: 'Pay via bKash mobile banking' },
  { id: 'nagad', name: 'Nagad', icon: '💸', color: '#F6821F', desc: 'Pay via Nagad mobile banking' },
  { id: 'rocket', name: 'Rocket', icon: '🚀', color: '#8B1C8C', desc: 'Pay via Dutch-Bangla Rocket' },
  { id: 'card', name: 'Card Payment', icon: '💳', color: '#1a73e8', desc: 'Visa / Mastercard / AMEX' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: '#344e41', desc: 'NPSB / BEFTN bank transfer' },
  { id: 'escrow', name: 'Escrow Guard', icon: '🛡️', color: '#2e6fa3', desc: 'Secure hold until delivery confirmed' },
];

const RECENT_TRANSACTIONS = [
  { id: 'TXN-001', type: 'escrow', desc: 'Boro Rice (25 bags) — Escrow funded', amount: 12500, status: 'Held', date: '18 Mar 2024', icon: '🔒' },
  { id: 'TXN-002', type: 'payment', desc: 'Mustard Oil (50L) — Payment released', amount: 8750, status: 'Completed', date: '15 Mar 2024', icon: '✅' },
  { id: 'TXN-003', type: 'refund', desc: 'Tomato Seeds — Dispute refund', amount: 5200, status: 'Refunded', date: '10 Mar 2024', icon: '↩️' },
  { id: 'TXN-004', type: 'payment', desc: 'Organic Wheat (100kg) — Direct pay', amount: 3800, status: 'Completed', date: '05 Mar 2024', icon: '✅' },
];

const statusColor = { Held: '#2e6fa3', Completed: '#4a804e', Refunded: '#e07b39', Pending: '#e8a020' };
const fmt = (n) => `৳${Number(n).toLocaleString('en-BD')}`;

export default function PaymentPage() {
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState('select'); // select | confirm | success
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!amount || isNaN(amount)) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1800));
    setProcessing(false);
    setStep('success');
  };

  const reset = () => { setStep('select'); setSelected(null); setAmount(''); setNote(''); };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #344e41 0%, #4a804e 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20,
        boxShadow: '0 8px 32px rgba(52,78,65,0.3)',
      }}>
        <div style={{ fontSize: '3rem' }}>💳</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            AgriNetwork Payments
          </h1>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.95rem' }}>
            Secure payments for agricultural transactions — powered by Escrow protection
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            {['🔐 Fraud-proof', '⚡ Instant', '🛡️ Escrow Protected', '🇧🇩 Bangladesh MFS'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', backdropFilter: 'blur(4px)' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {step === 'success' ? (
        /* Success Screen */
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#4a804e', margin: '0 0 8px' }}>Payment Successful!</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            {fmt(amount)} via {PAYMENT_METHODS.find(m => m.id === selected)?.name}
            {selected === 'escrow' ? ' — Funds held in Escrow until delivery confirmed.' : ' — Transaction complete.'}
          </p>
          <button onClick={reset} style={{
            background: '#4a804e', color: '#fff', border: 'none', padding: '12px 36px',
            borderRadius: 12, fontSize: '1rem', cursor: 'pointer', fontWeight: 700,
          }}>Make Another Payment</button>
        </div>
      ) : step === 'confirm' ? (
        /* Confirm Screen */
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 24px', color: '#1a1a2e' }}>Confirm Payment</h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {[
              ['Method', `${PAYMENT_METHODS.find(m => m.id === selected)?.icon} ${PAYMENT_METHODS.find(m => m.id === selected)?.name}`],
              ['Amount', fmt(amount)],
              note && ['Note', note],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8faf8', borderRadius: 10 }}>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{value}</span>
              </div>
            ))}
          </div>
          {selected === 'escrow' && (
            <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: '0.88rem', color: '#344e41' }}>
              🛡️ <strong>Escrow Protection Active:</strong> Funds will be held securely and released only after you confirm delivery. You can raise a dispute within 48 hours.
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep('select')} style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: 12, background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#666' }}>
              ← Back
            </button>
            <button onClick={handlePay} disabled={processing} style={{
              flex: 2, padding: '12px', background: 'linear-gradient(135deg, #344e41, #4a804e)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
              opacity: processing ? 0.8 : 1
            }}>
              {processing ? '⏳ Processing…' : `Pay ${fmt(amount)}`}
            </button>
          </div>
        </div>
      ) : (
        /* Main Select Screen */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Left: Method Selection + Amount */}
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>Select Payment Method</h3>
            <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
              {PAYMENT_METHODS.map(method => (
                <button key={method.id} onClick={() => setSelected(method.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: selected === method.id ? `${method.color}15` : '#fff',
                    border: `2px solid ${selected === method.id ? method.color : '#e8e8e8'}`,
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: selected === method.id ? `0 4px 16px ${method.color}25` : '0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                  <span style={{ fontSize: '1.8rem' }}>{method.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{method.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>{method.desc}</div>
                  </div>
                  {selected === method.id && (
                    <span style={{ marginLeft: 'auto', color: method.color, fontWeight: 700, fontSize: '1.2rem' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {selected && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <h4 style={{ margin: '0 0 14px', color: '#1a1a2e' }}>Payment Details</h4>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: 6 }}>Amount (BDT) *</span>
                  <input type="number" placeholder="Enter amount (e.g. 5000)"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e8e8e8', fontSize: '1rem', fontWeight: 600, color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: 6 }}>Note (optional)</span>
                  <input type="text" placeholder="e.g. For Rice order #ORD-9921"
                    value={note} onChange={e => setNote(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e8e8e8', fontSize: '0.9rem', color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
                  />
                </label>
                <button onClick={() => amount && !isNaN(amount) && setStep('confirm')}
                  disabled={!amount || isNaN(amount)}
                  style={{
                    width: '100%', padding: '14px',
                    background: amount ? 'linear-gradient(135deg, #344e41, #4a804e)' : '#ccc',
                    color: '#fff', border: 'none', borderRadius: 12,
                    fontSize: '1rem', fontWeight: 700, cursor: amount ? 'pointer' : 'not-allowed',
                  }}>
                  Continue to Confirm →
                </button>
              </div>
            )}
          </div>

          {/* Right: Recent Transactions */}
          <div>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>Recent Transactions</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {RECENT_TRANSACTIONS.map(tx => (
                <div key={tx.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>{tx.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a2e' }}>{tx.desc}</div>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 2 }}>{tx.id} · {tx.date}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#344e41' }}>{fmt(tx.amount)}</div>
                      <span style={{ fontSize: '0.72rem', color: statusColor[tx.status] || '#888', fontWeight: 600 }}>{tx.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info card */}
            <div style={{ background: 'linear-gradient(135deg, #f0f7f0, #e8f5e9)', borderRadius: 14, padding: 20, marginTop: 16, border: '1px solid #c8e6c9' }}>
              <div style={{ fontWeight: 700, color: '#344e41', marginBottom: 8 }}>🛡️ Why Use Escrow?</div>
              <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#555', fontSize: '0.85rem', lineHeight: 1.8 }}>
                <li>Funds held safely until delivery is confirmed</li>
                <li>Dispute resolution within 24–48 hours</li>
                <li>1% platform fee — lowest in the market</li>
                <li>Full refund if seller fails to deliver</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
