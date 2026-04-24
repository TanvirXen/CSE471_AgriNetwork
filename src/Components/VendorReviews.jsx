import React, { useState, useEffect } from 'react';
import { Star, Flag, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/network';

export default function VendorReviews({ vendorId, productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (productId || vendorId) {
      fetchReviews();
    }
  }, [vendorId, productId]);

  const fetchReviews = async () => {
    try {
      const url = productId 
        ? `${API_BASE_URL}/api/reviews/product/${productId}`
        : `${API_BASE_URL}/api/reviews/vendor/${vendorId}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (reviewId) => {
    if (!reportReason) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason })
      });

      if (res.ok) {
        setToastMessage('Review reported to Admin successfully.');
        setReportingId(null);
        setReportReason('');
        setTimeout(() => setToastMessage(''), 3000);
      } else {
         const data = await res.json();
         alert(data.message || 'Failed to report.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
        <MessageSquare color="var(--primary-main)" size={24} /> Verified {productId ? 'Product' : 'Vendor'} Reviews
      </h3>

      {toastMessage && (
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #10b981' }}>
          {toastMessage}
        </div>
      )}

      {reviews.length === 0 ? (
        <div style={{ backgroundColor: 'var(--white)', padding: '2rem', borderRadius: '12px', textAlign: 'center', color: '#64748b', boxShadow: 'var(--shadow-sm)' }}>
          No reviews yet for this {productId ? 'product' : 'vendor'}.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map(review => (
            <div key={review._id} style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--neutral-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
                    {review.customerId?.fullName || 'Anonymous Customer'}
                    <span style={{ fontSize: '0.8rem', backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', verticalAlign: 'middle' }}>
                      Verified Purchase
                    </span>
                  </h4>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                       <Star key={star} size={16} color={star <= Math.round(review.averageRating) ? '#eab308' : '#cbd5e1'} fill={star <= Math.round(review.averageRating) ? '#eab308' : 'none'} />
                    ))}
                  </div>
                </div>
                
                {user && ['Vendor', 'Farmer', 'Wholesaler'].includes(user.role) && (
                  <button 
                    onClick={() => setReportingId(reportingId === review._id ? null : review._id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}
                  >
                    <Flag size={14} /> Report
                  </button>
                )}
              </div>

              {review.reviewText && (
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.5, margin: '0 0 1rem 0' }}>{review.reviewText}</p>
              )}

              <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                <span>Quality: {review.rating?.quality || 0}/5</span>
                <span>Timeliness: {review.rating?.timeliness || 0}/5</span>
                <span>Communication: {review.rating?.communication || 0}/5</span>
              </div>

              {reportingId === review._id && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#334155' }}>Reason for reporting:</label>
                  <input 
                    type="text" 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
                    placeholder="Inappropriate content, spam, etc."
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleReport(review._id)} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Report</button>
                    <button onClick={() => setReportingId(null)} style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
