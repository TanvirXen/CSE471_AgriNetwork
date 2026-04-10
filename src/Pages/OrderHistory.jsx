import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, X, Download, Package, FileText, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../CSS/OrderHistory.css';
import OrderTimeline from '../Components/OrderTimeline';
import CancelRefundModal from '../Components/CancelRefundModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const STATUS_COLORS = {
  'Pending': 'status-pending',
  'Confirmed': 'status-confirmed',
  'Shipped': 'status-shipped',
  'OutForDelivery': 'status-shipped',
  'Delivered': 'status-delivered',
  'Cancelled': 'status-cancelled'
};

const OrderHistory = () => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const { user } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders?buyerId=${user?._id || user?.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
         // Sort orders descending by createdAt
         data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
         setOrders(data);

         // Auto-sync the currently viewed order so timeline progresses live natively
         setSelectedOrder(prev => {
            if (!prev) return null;
            return data.find(o => o._id === prev._id) || prev;
         });
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  useEffect(() => {
    let intervalId;
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOrders(); // async — setState calls happen after await, not synchronously
      intervalId = setInterval(fetchOrders, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchStatus = filterStatus === 'All' || order.status === filterStatus;
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const matchDate = filterDate === '' || orderDate === filterDate;
      const matchSearch = filterSearch === '' ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(filterSearch.toLowerCase())) ||
        (order.items && order.items.some(item => item.productName && item.productName.toLowerCase().includes(filterSearch.toLowerCase())));

      return matchStatus && matchDate && matchSearch;
    });
  }, [orders, filterStatus, filterDate, filterSearch]);

  const generateInvoiceHtml = (order) => `
      <html><head>
        <meta charset="UTF-8">
        <title>Invoice ${order.orderNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; margin: auto; max-width: 800px; color: #333; line-height: 1.6; }
          h2 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.95rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; color: #374151; }
          .total { font-size: 1.5rem; font-weight: bold; color: #166534; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h2>AgriNetwork Official Invoice</h2>
        <div class="meta">
          <div><strong>Order Number:</strong> ${order.orderNumber}</div>
          <div><strong>Placed On:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        <div><strong>Status:</strong> ${order.status}</div>
        
        <table>
          <tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity} ${item.unit || 'kg'}</td>
              <td>৳${item.unitPrice.toFixed(2)}</td>
              <td>৳${item.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        
        <div style="margin-top: 20px; text-align: right; font-size: 1.1rem; color: #4b5563;">
          Delivery Fee: ৳${(order.pricing?.deliveryFee || 0).toFixed(2)}<br/>
          Platform Fee: ৳${(order.pricing?.platformFee || 0).toFixed(2)}
        </div>
        
        <div class="total">Grand Total: ৳${(order.pricing?.grandTotal || 0).toFixed(2)}</div>
        
        <div style="margin-top: 60px; text-align: center; color: #9ca3af; font-size: 0.85rem;">
          Thank you for trusting AgriNetwork!
        </div>
      </body></html>
    `;

  const handleViewInvoice = (e, order) => {
    e.stopPropagation();
    setToastMessage(`Opening invoice for ${order.orderNumber}...`);
    const invoiceHtml = generateInvoiceHtml(order);
    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDownloadInvoice = (e, order) => {
    e.stopPropagation();
    setToastMessage(`Downloading invoice for ${order.orderNumber}...`);
    const invoiceHtml = generateInvoiceHtml(order);
    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${order.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCancelSubmit = async (orderId, reason) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o._id === orderId ? { ...o, status: 'Cancelled' } : o
        ));
        setShowCancelModal(false);
        setSelectedOrder(null);
        setToastMessage('Cancellation request submitted successfully.');
      } else {
        setToastMessage('Cancellation failed. Support contacted.');
      }
    } catch(err) {
      console.error(err);
      setToastMessage('Error communicating with server.');
    }
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className={`order-history-wrapper ${isDashboardRoute ? 'dashboard-embedded' : ''}`}>
      <div className="order-history-container">

        {/* Header */}
        <div className="order-history-header">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Order Tracking & History
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Monitor your transaction progress and complete order history.
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          className="filters-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="filter-group">
            <label><Search size={14} style={{ display: 'inline', marginRight: 4 }} /> Search Product / ID</label>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. Wheat or ORD-8921"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label><Filter size={14} style={{ display: 'inline', marginRight: 4 }} /> Status</label>
            <select
              className="filter-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="OutForDelivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Date</label>
            <input
              type="date"
              className="filter-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="orders-list">
          <AnimatePresence>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  className="order-card"
                  onClick={() => setSelectedOrder(order)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="order-header">
                    <div className="order-id-date">
                      <div className="id">{order.orderNumber}</div>
                      <div className="date">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <div className={`status-badge ${STATUS_COLORS[order.status] || 'status-pending'}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="products-list">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="product-item">
                          <Package size={16} className="product-icon" />
                          <span>{item.productName} <span style={{ color: 'var(--text-muted)' }}>x {item.quantity}</span></span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          +{order.items.length - 2} more items...
                        </div>
                      )}
                    </div>

                    <div className="order-total" style={{ borderTop: '1px dashed var(--neutral-bg)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                         <span>Subtotal</span><span>৳{(order.pricing?.itemsTotal || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                         <span>Delivery Fee</span><span>৳{(order.pricing?.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                         <span>Platform Fee</span><span>৳{(order.pricing?.platformFee || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '0.5rem' }}>
                         <span className="label">Grand Total</span>
                         <span className="amount" style={{ color: 'var(--primary-main)', fontSize: '1.1rem' }}>৳{(order.pricing?.grandTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="empty-state-icon">
                  <Search size={32} />
                </div>
                <h3>No orders found</h3>
                <p>Try adjusting your filters to find what you're looking for.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem', margin: '0 auto' }}
                  onClick={() => { setFilterStatus('All'); setFilterDate(''); setFilterSearch(''); }}
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>Order Details</h2>
                <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-order-summary">
                  <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.5rem' }}>{selectedOrder.orderNumber}</h3>
                  <div className={`status-badge ${STATUS_COLORS[selectedOrder.status] || 'status-pending'}`}>
                    {selectedOrder.status}
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </p>

                {/* Status Timeline */}
                <h3 style={{ fontSize: '1.125rem', color: 'var(--primary-dark)', marginBottom: '1rem' }}>Delivery Progress</h3>
                <OrderTimeline status={selectedOrder.status} />

                {/* Items */}
                <div className="modal-items">
                  <h3>Purchased Items</h3>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <div className="item-info">
                        <Package size={20} color="var(--primary-main)" />
                        <div>
                          <div className="item-name">{item.productName}</div>
                          <div className="item-qty">Qty: {item.quantity} {item.unit || 'kg'}</div>
                        </div>
                      </div>
                      <div className="item-price">৳{(item.subtotal || 0).toFixed(2)}</div>
                    </div>
                  ))}

                  <div className="modal-total">
                    <span>Total Cost</span>
                    <span>৳{(selectedOrder.pricing?.grandTotal || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                  {(!['Cancelled', 'Refunded'].includes(selectedOrder.status)) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn" style={{ backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #d1d5db' }} onClick={(e) => handleViewInvoice(e, selectedOrder)}>
                        <FileText size={18} /> View Invoice
                      </button>
                      <button className="btn btn-primary" onClick={(e) => handleDownloadInvoice(e, selectedOrder)}>
                        <Download size={18} /> Download
                      </button>
                    </div>
                  )}

                  {['Pending', 'Confirmed', 'Processing'].includes(selectedOrder.status) && (
                    <button
                      className="btn btn-danger"
                      onClick={() => { setSelectedOrder(null); setShowCancelModal(true); }}
                    >
                      <AlertCircle size={18} /> Request Cancellation / Refund
                    </button>
                  )}

                  {['Cancelled', 'Refunded', 'RefundRequested'].includes(selectedOrder.status) && (
                    <div style={{ textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                      This order was cancelled or refunded. Reason: {selectedOrder.cancellationReason || "Customer Requested"}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Request Modal */}
      <CancelRefundModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        order={selectedOrder || (showCancelModal ? orders.find(o => ['Pending', 'Confirmed'].includes(o.status)) : null)} 
        onSubmit={handleCancelSubmit}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="order-history-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              backgroundColor: 'var(--primary-dark)',
              color: 'var(--white)',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <FileText size={20} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrderHistory;
