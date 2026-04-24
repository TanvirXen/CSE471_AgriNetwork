import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, X, Download, Package, FileText, AlertCircle, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../CSS/OrderHistory.css';
import OrderTimeline from '../Components/OrderTimeline';
import CancelRefundModal from '../Components/CancelRefundModal';
import DeliveryTrackingMap from '../Components/DeliveryTrackingMap';
import ReviewModal from '../Components/ReviewModal';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/network';

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
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [customerOTP, setCustomerOTP] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const [showRidersModal, setShowRidersModal] = useState(false);
  const [nearbyRiders, setNearbyRiders] = useState([]);
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    let intervalId;
    if (user) {
      fetchOrders();
      intervalId = setInterval(fetchOrders, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      let fetchUrl = `${API_BASE_URL}/api/orders?buyerId=${user?._id || user?.id}`;
      // Use vendorId filter if user is vendor or farmer
      if (user?.role?.toLowerCase() === 'vendor' || user?.role?.toLowerCase() === 'farmer') {
         fetchUrl = `${API_BASE_URL}/api/orders?vendorId=${user?._id || user?.id}`;
      }
      
      const res = await fetch(fetchUrl);
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

  const handleUpdateStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (res.ok) {
        const orderData = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? orderData : o));
        setSelectedOrder(orderData);
        setToastMessage(`Order status updated to ${newStatus}`);
        
        // Refetch delivery details to pull latest OSRM routes securely and any updated status
        const delRes = await fetch(`${API_BASE_URL}/api/delivery/${orderId}`);
        if(delRes.ok){
          const delData = await delRes.json();
          setSelectedDelivery(delData);
        }

      } else {
        const errData = await res.json();
        setToastMessage(errData.message || 'Failed to update status.');
      }
    } catch(err) {
      console.error(err);
      setToastMessage('Error updating status.');
    }
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCustomerSubmitProof = async (orderId) => {
    if (!customerOTP || !customerPhoto) {
      setToastMessage('Please provide both OTP and a photo.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    setIsSubmittingProof(true);
    const formData = new FormData();
    formData.append('otp', customerOTP);
    formData.append('photo', customerPhoto);

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/customer-proof`, {
        method: 'PUT',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        setSelectedOrder(data.order);
        setToastMessage('Proof submitted successfully!');
      } else {
        const errData = await res.json();
        setToastMessage(errData.message || 'Failed to submit proof.');
      }
    } catch(err) {
      console.error(err);
      setToastMessage('Error submitting proof.');
    }
    setIsSubmittingProof(false);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenRidersModal = async () => {
    setShowRidersModal(true);
    setIsLoadingRiders(true);
    try {
      let lng = 90.4125;
      let lat = 23.8103;
      if (user?.currentLocation?.coordinates && user.currentLocation.coordinates.length === 2 && user.currentLocation.coordinates[0] !== 0) {
        lng = user.currentLocation.coordinates[0];
        lat = user.currentLocation.coordinates[1];
      }
      const res = await fetch(`${API_BASE_URL}/api/riders/nearby?lng=${lng}&lat=${lat}`);
      if (res.ok) {
        const data = await res.json();
        setNearbyRiders(data);
      }
    } catch(err) {
      console.error(err);
    }
    setIsLoadingRiders(false);
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    setSelectedDelivery(null);
    setCustomerOTP('');
    setCustomerPhoto(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/${order._id}`);
      if (res.ok) {
        const delData = await res.json();
        setSelectedDelivery(delData);
      }
    } catch(err) {
      console.error(err);
    }
  };

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
                  onClick={() => handleSelectOrder(order)}
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

                {selectedOrder.deliveryAddress && (
                  <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress.fullAddress} 
                    {selectedOrder.deliveryAddress.district && `, ${selectedOrder.deliveryAddress.district}`} 
                    {selectedOrder.deliveryAddress.division && `, ${selectedOrder.deliveryAddress.division}`} <br/>
                    <strong>Contact:</strong> {selectedOrder.deliveryAddress.contactName} ({selectedOrder.deliveryAddress.phone})
                  </div>
                )}

                {selectedOrder.pickupDate && (
                  <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>Scheduled Pickup:</strong> {new Date(selectedOrder.pickupDate).toLocaleDateString()} ({selectedOrder.pickupTimeSlot})
                  </div>
                )}

                {selectedDelivery && selectedDelivery.logisticsStatus === "InTransit" && (
                   <div style={{ padding: '1rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #bfdbfe' }}>
                     <strong>Delivery In Transit!</strong> Please provide this OTP to the vendor: 
                     <span style={{ fontSize: '1.2rem', fontWeight: 'bold', marginLeft: '8px', tracking: '2px' }}>
                       {selectedDelivery.otpCodeHash}
                     </span>
                   </div>
                )}

                {(() => {
                  if (!selectedDelivery) return null;
                  let parsedGeojson = null;
                  if (selectedDelivery.routePolyline && selectedDelivery.routePolyline !== "null") {
                    try {
                      parsedGeojson = JSON.parse(selectedDelivery.routePolyline);
                    } catch(e) {
                      console.error("Failed to parse routePolyline", e);
                    }
                  }
                  
                  return (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Live Tracking</h3>
                      <DeliveryTrackingMap geojsonGeometry={parsedGeojson} />
                    </div>
                  );
                })()}

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

                  {['Pending'].includes(selectedOrder.status) && (!user?.role || user?.role?.toLowerCase() === 'customer') && (
                    <button
                      className="btn btn-danger"
                      onClick={() => { setSelectedOrder(null); setShowCancelModal(true); }}
                    >
                      <AlertCircle size={18} /> Request Cancellation / Refund
                    </button>
                  )}

                  {selectedOrder.status === 'Delivered' && (!user?.role || user?.role?.toLowerCase() === 'customer') && (
                    <button
                      className="btn btn-primary"
                      onClick={() => { setReviewOrder(selectedOrder); setShowReviewModal(true); }}
                      style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                    >
                      <Star size={18} /> Rate & Review Vendor
                    </button>
                  )}

                  {['Cancelled', 'Refunded', 'RefundRequested'].includes(selectedOrder.status) && (
                    <div style={{ textAlign: 'center', color: '#dc2626', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginTop: '1rem', width: '100%' }}>
                      This order was cancelled or refunded. Reason: {selectedOrder.cancellationReason || "Customer Requested"}
                    </div>
                  )}

                  {selectedOrder.status === 'OutForDelivery' && (!user?.role || user?.role?.toLowerCase() === 'customer') && !selectedOrder.customerSubmittedOTP && (
                    <div style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdfa', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                       <h4 style={{ color: '#0f766e', marginBottom: '0.5rem' }}>Verify Delivery Receipt</h4>
                       <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#134e4a' }}>Your system delivery pin is <strong>{selectedOrder.otp}</strong>. Please enter it below and upload a photo of the received goods to complete the delivery.</p>
                       <input 
                         type="text" 
                         placeholder="Enter OTP" 
                         value={customerOTP}
                         onChange={(e) => setCustomerOTP(e.target.value)}
                         style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                       />
                       <input 
                         type="file" 
                         accept="image/*"
                         onChange={(e) => setCustomerPhoto(e.target.files[0])}
                         style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white' }}
                       />
                       <button 
                         className="btn" 
                         style={{ backgroundColor: '#0d9488', color: 'white', width: '100%' }}
                         onClick={(e) => { e.stopPropagation(); handleCustomerSubmitProof(selectedOrder._id); }}
                         disabled={isSubmittingProof}
                       >
                         {isSubmittingProof ? 'Sending...' : 'Send Proof to Vendor'}
                       </button>
                    </div>
                  )}
                  {selectedOrder.status === 'OutForDelivery' && (!user?.role || user?.role?.toLowerCase() === 'customer') && selectedOrder.customerSubmittedOTP && (
                    <div style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                       <p style={{ color: '#475569', margin: 0 }}>You have submitted your delivery proof. Waiting for vendor verification...</p>
                    </div>
                  )}

                  {(user?.role?.toLowerCase() === 'vendor' || user?.role?.toLowerCase() === 'farmer') && (
                    <div style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       {selectedOrder.status === 'Pending' && (
                         <button className="btn" style={{ backgroundColor: 'var(--primary-main)', color: 'white', width: '100%' }} onClick={(e) => {
                           e.stopPropagation();
                           handleUpdateStatus(selectedOrder._id, 'Confirmed');
                         }}>
                            Confirm Order
                         </button>
                       )}
                       {selectedOrder.status === 'Confirmed' && (
                         <button className="btn" style={{ backgroundColor: '#eab308', color: 'white', width: '100%' }} onClick={(e) => {
                           e.stopPropagation();
                           handleOpenRidersModal();
                         }}>
                            Processing Completed (Assign Rider)
                         </button>
                       )}
                       {(selectedOrder.status === 'Processing' || selectedOrder.status === 'Shipped') && (
                         <button className="btn" style={{ backgroundColor: '#2563eb', color: 'white', width: '100%' }} onClick={(e) => {
                           e.stopPropagation();
                           handleUpdateStatus(selectedOrder._id, 'OutForDelivery');
                         }}>
                            Start Delivery
                         </button>
                       )}
                       
                       {selectedOrder.status === 'OutForDelivery' && (
                         <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                           <h4 style={{ color: '#334155', marginBottom: '1rem' }}>Customer Proof Verification</h4>
                           {!selectedOrder.customerSubmittedOTP ? (
                              <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>Waiting for customer to submit OTP and photo proof...</p>
                           ) : (
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>Expected OTP:</strong> {selectedOrder.otp}</p>
                                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                   <strong>Submitted OTP:</strong> 
                                   <span style={{ color: selectedOrder.otp === selectedOrder.customerSubmittedOTP ? '#16a34a' : '#dc2626', fontWeight: 'bold', marginLeft: '4px' }}>
                                      {selectedOrder.customerSubmittedOTP}
                                   </span>
                                </p>
                                {selectedOrder.customerSubmittedPhoto && (
                                   <div style={{ marginBottom: '1rem' }}>
                                     <strong style={{ fontSize: '0.9rem' }}>Delivery Photo:</strong>
                                     <img src={selectedOrder.customerSubmittedPhoto} alt="Customer Proof" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                   </div>
                                )}
                                <button className="btn" style={{ backgroundColor: '#16a34a', color: 'white', width: '100%' }} onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(selectedOrder._id, 'Delivered');
                                }}>
                                   Confirm & Mark as Delivered
                                </button>
                              </div>
                           )}
                         </div>
                       )}
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

      {/* Nearby Riders Modal */}
      <AnimatePresence>
        {showRidersModal && (
          <div className="modal-overlay" onClick={() => setShowRidersModal(false)}>
            <motion.div
              className="modal-content"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2>Assign Delivery Rider</h2>
                <button className="modal-close-btn" onClick={() => setShowRidersModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                {isLoadingRiders ? (
                  <p>Finding nearby riders...</p>
                ) : nearbyRiders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {nearbyRiders.map((rider) => (
                      <div 
                        key={rider._id} 
                        onClick={() => setSelectedRiderId(rider._id)}
                        style={{ 
                          padding: '1rem', 
                          border: `2px solid ${selectedRiderId === rider._id ? 'var(--primary-main)' : '#e5e7eb'}`, 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>{rider.name}</strong>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{rider.vehicleType} &bull; {rider.phone}</div>
                        </div>
                        <div style={{ color: 'var(--primary-main)' }}>Select</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No riders available nearby. An automated partner will be assigned if you proceed.</p>
                )}
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.5rem' }}
                  onClick={() => {
                     handleUpdateStatus(selectedOrder._id, 'Shipped', { riderId: selectedRiderId });
                     setShowRidersModal(false);
                  }}
                >
                  Save & Mark as Shipped
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReviewModal 
         isOpen={showReviewModal}
         onClose={() => setShowReviewModal(false)}
         order={reviewOrder}
         onReviewSubmitted={() => {
           setToastMessage('Thank you! Your verified review has been published.');
           setTimeout(() => setToastMessage(''), 3000);
         }}
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
