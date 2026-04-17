import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const StarRating = ({ label, value, onChange }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '0.25rem' }}>{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            color={star <= value ? '#eab308' : '#e2e8f0'}
            fill={star <= value ? '#eab308' : 'none'}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => onChange(star)}
            whileHover={{ scale: 1.1 }}
          />
        ))}
      </div>
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [quality, setQuality] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (quality === 0 || timeliness === 0 || communication === 0) {
      setError('Please provide a rating for all criteria.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      // If order.items has multiple, review handles the first or whole order context
      const productId = order.items && order.items.length > 0 ? order.items[0].listingId : null;
      
      const payload = {
        orderId: order._id,
        productId,
        vendorId: order.vendorId || order.sellerId,
        quality,
        timeliness,
        communication,
        reviewText
      };

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onReviewSubmitted();
        onClose();
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to submit review.");
      }
    } catch (err) {
      setError('An error occurred while submitting.');
      console.error(err);
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
        <motion.div
          className="modal-content"
          style={{ maxWidth: '500px', width: '90%' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
        >
          <div className="modal-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare /> Rate this Delivery
            </h2>
            <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="modal-body">
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your feedback is securely tied to Order <strong>{order.orderNumber}</strong>. Be honest and constructive!
            </p>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <StarRating label="Product Quality" value={quality} onChange={setQuality} />
            <StarRating label="Delivery Timeliness" value={timeliness} onChange={setTimeliness} />
            <StarRating label="Vendor Communication" value={communication} onChange={setCommunication} />

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
                Written Review (Optional)
              </label>
              <textarea
                rows="4"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think about the packaging, quality, and service?"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
