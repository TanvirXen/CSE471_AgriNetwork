import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const CartCheckoutModal = () => {
  const { cart, removeFromCart, clearCart, cartTotal, isCartOpen, setIsCartOpen, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isCartOpen) return null;

  const deliveryFee = 150;
  const platformFee = cartTotal * 0.05;
  const grandTotal = cartTotal + deliveryFee + platformFee;

  const handleCheckout = async () => {
    if (!user) {
      setError("Please log in to checkout.");
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    const orderPayload = {
      buyerId: user._id || user.id,
      sellerId: cart[0].sellerId || user._id, // fallback logic
      items: cart.map(c => ({
        listingId: c.id,
        productName: c.name,
        quantity: c.qty,
        unitPrice: c.price,
        subtotal: c.price * c.qty
      })),
      pricing: {
        itemsTotal: cartTotal,
        deliveryFee,
        platformFee,
        escrowFee: 0,
        discount: 0,
        grandTotal
      },
      deliveryAddress: {
        contactName: user.name || "AgriNetwork User",
        phone: user.phone || "01700000000",
        fullAddress: "Default Delivery Address",
        district: "Dhaka",
        division: "Dhaka",
        coordinates: { type: "Point", coordinates: [90.41, 23.81] }
      },
      status: "Pending",
      timeline: [{ status: "Pending", note: "Order placed securely via Marketplace." }]
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        clearCart();
        setIsCartOpen(false);
        navigate('/sumaiya/OrderHistory');
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to checkout.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An error occurred during checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setIsCartOpen(false)}>
        <motion.div 
          className="modal-content"
          style={{ maxWidth: '500px', width: '90%' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
        >
          <div className="modal-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart /> Your Cart</h2>
            <button className="modal-close-btn" onClick={() => setIsCartOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
             {error && <p style={{ color: 'red', textAlign: 'center', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '5px' }}>{error}</p>}
             
             {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <p>Your cart is empty.</p>
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                         <div>
                            <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary-dark)' }}>{item.name}</h4>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                               <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>-</button>
                               <span style={{ fontWeight: 'bold' }}>{item.qty} {item.unit || 'kg'}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>+</button>
                               × ৳{item.price}
                            </div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold' }}>৳{item.price * item.qty}</span>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>

          {cart.length > 0 && (
             <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #eee', borderRadius: '0 0 12px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                   <span>Subtotal</span>
                   <span>৳{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                   <span>Delivery Fee</span>
                   <span>৳{deliveryFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#4b5563' }}>
                   <span>Platform Fee (5%)</span>
                   <span>৳{platformFee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '1rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-dark)' }}>
                   <span>Grand Total</span>
                   <span>৳{grandTotal.toFixed(2)}</span>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                   <button 
                     onClick={handleCheckout} 
                     disabled={isSubmitting}
                     style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                   >
                      <CreditCard size={20} />
                      {isSubmitting ? 'Processing...' : 'Place Order Securely'}
                   </button>
                </div>
             </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CartCheckoutModal;
