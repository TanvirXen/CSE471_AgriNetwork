import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

const CancelRefundModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit(order._id || order.id, reason);
      setIsSubmitting(false);
      setReason('');
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          className="modal-content"
          style={{ maxWidth: '450px' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="modal-header" style={{ backgroundColor: '#dc2626' }}>
            <h2>Request Cancel / Refund</h2>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b' }}>
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Are you sure you want to cancel order #{order.orderNumber || order._id}?</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>This action cannot be undone. If approved, refunds may take 3-5 business days.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
                  Reason for Cancellation
                </label>
                <textarea 
                  className="filter-input"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Please tell us why you are requesting a cancellation/refund..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-danger" style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)' }} onClick={onClose} disabled={isSubmitting}>
                  Keep Order
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#dc2626' }} disabled={isSubmitting || !reason.trim()}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelRefundModal;
