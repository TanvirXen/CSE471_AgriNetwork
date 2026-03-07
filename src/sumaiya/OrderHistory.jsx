import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, X, Download, Package, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import './OrderHistory.css';
import OrderTimeline from './components/OrderTimeline';
import CancelRefundModal from './components/CancelRefundModal';

// Mock Data
const MOCK_ORDERS = [
  {
    id: 'ORD-8921',
    date: '2026-03-01',
    status: 'Delivered',
    total: 1250.00,
    items: [
      { name: 'Organic Wheat', quantity: '50 kg', price: 1000.00 },
      { name: 'Premium Rice', quantity: '10 kg', price: 250.00 }
    ],
    invoiceUrl: '#'
  },
  {
    id: 'ORD-8945',
    date: '2026-03-03',
    status: 'Shipped',
    total: 840.00,
    items: [
      { name: 'Fresh Tomatoes', quantity: '20 kg', price: 600.00 },
      { name: 'Onions', quantity: '15 kg', price: 240.00 }
    ],
    invoiceUrl: '#'
  },
  {
    id: 'ORD-8960',
    date: '2026-03-05',
    status: 'Confirmed',
    total: 4500.00,
    items: [
      { name: 'Basmati Rice Bulk', quantity: '100 kg', price: 4500.00 }
    ],
    invoiceUrl: '#'
  },
  {
    id: 'ORD-8972',
    date: '2026-03-06',
    status: 'Pending',
    total: 320.00,
    items: [
      { name: 'Farm Fresh Eggs', quantity: '10 Dozen', price: 120.00 },
      { name: 'Carrots', quantity: '5 kg', price: 200.00 }
    ],
    invoiceUrl: '#'
  },
  {
    id: 'ORD-8850',
    date: '2026-02-15',
    status: 'Cancelled',
    total: 1500.00,
    items: [
      { name: 'Corn Seeds', quantity: '25 kg', price: 1500.00 }
    ],
    invoiceUrl: '#'
  }
];

const STATUS_COLORS = {
  'Pending': 'status-pending',
  'Confirmed': 'status-confirmed',
  'Shipped': 'status-shipped',
  'Delivered': 'status-delivered',
  'Cancelled': 'status-cancelled'
};

const OrderHistory = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchStatus = filterStatus === 'All' || order.status === filterStatus;
      const matchDate = filterDate === '' || order.date === filterDate;
      const matchSearch = filterSearch === '' ||
        order.id.toLowerCase().includes(filterSearch.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(filterSearch.toLowerCase()));

      return matchStatus && matchDate && matchSearch;
    });
  }, [orders, filterStatus, filterDate, filterSearch]);

  const handleDownloadInvoice = (e, orderId) => {
    e.stopPropagation();
    // Simulate Download
    setToastMessage(`Downloading invoice for ${orderId}...`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCancelSubmit = (orderId, reason) => {
    // Update order status purely in UI state
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Cancelled' } : o
    ));
    setShowCancelModal(false);
    setSelectedOrder(null);
    setToastMessage('Cancellation request submitted successfully.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="order-history-wrapper">
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
                  key={order.id}
                  className="order-card"
                  onClick={() => setSelectedOrder(order)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="order-header">
                    <div className="order-id-date">
                      <div className="id">{order.id}</div>
                      <div className="date">{new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <div className={`status-badge ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="products-list">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="product-item">
                          <Package size={16} className="product-icon" />
                          <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>x {item.quantity}</span></span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          +{order.items.length - 2} more items...
                        </div>
                      )}
                    </div>

                    <div className="order-total">
                      <div className="label">Total Amount</div>
                      <div className="amount">৳{order.total.toFixed(2)}</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontSize: '1.5rem' }}>{selectedOrder.id}</h3>
                  <div className={`status-badge ${STATUS_COLORS[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  Placed on {new Date(selectedOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                          <div className="item-name">{item.name}</div>
                          <div className="item-qty">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="item-price">৳{item.price.toFixed(2)}</div>
                    </div>
                  ))}

                  <div className="modal-total">
                    <span>Total Cost</span>
                    <span>৳{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                  {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Shipped' || selectedOrder.status === 'Confirmed') && (
                    <button className="btn btn-primary" onClick={(e) => handleDownloadInvoice(e, selectedOrder.id)}>
                      <Download size={18} /> Download Invoice
                    </button>
                  )}

                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Confirmed') && (
                    <button
                      className="btn btn-danger"
                      onClick={() => { setSelectedOrder(null); setShowCancelModal(true); }}
                    >
                      <AlertCircle size={18} /> Request Cancellation / Refund
                    </button>
                  )}

                  {selectedOrder.status === 'Cancelled' && (
                    <div style={{ textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                      This order was cancelled successfully.
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
        order={selectedOrder || (showCancelModal ? MOCK_ORDERS.find(o => ['Pending', 'Confirmed'].includes(o.status)) : null)} // Fallback just in case
        onSubmit={handleCancelSubmit}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
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
