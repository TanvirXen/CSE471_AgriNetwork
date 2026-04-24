import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, CreditCard, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { API_BASE_URL } from '../config/network';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lng, e.latlng.lat]);
    },
  });
  return position ? <Marker position={[position[1], position[0]]} /> : null;
};

const CartCheckoutModal = () => {
  const { cart, removeFromCart, clearCart, cartTotal, isCartOpen, setIsCartOpen, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('Morning');
  const [deliveryQuote, setDeliveryQuote] = useState({ fee: 150, distanceKm: 0, durationMinutes: 0 });
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  const [selectedCoordinates, setSelectedCoordinates] = useState(null); // [lng, lat]
  const [addressText, setAddressText] = useState('');

  useEffect(() => {
    if (isCartOpen && cart.length > 0 && selectedCoordinates) {
      const fetchQuote = async () => {
        setIsLoadingQuote(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/delivery/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendorId: cart[0].sellerId || cart[0].vendorId,
              pickupCoords: [90.4125, 23.8103],
              dropCoords: selectedCoordinates
            })
          });
          if (res.ok) {
            const data = await res.json();
            setDeliveryQuote({
              fee: data.deliveryFee,
              distanceKm: data.distanceKm,
              durationMinutes: data.durationMinutes,
              geometry: data.geometry
            });
          }
        } catch (err) {
          console.error("Failed to quote delivery fee", err);
        }
        setIsLoadingQuote(false);
      };
      fetchQuote();
    }
  }, [isCartOpen, cart, selectedCoordinates]);

  if (!isCartOpen) return null;

  const platformFee = cartTotal * 0.05;
  const grandTotal = cartTotal + deliveryQuote.fee + platformFee;

  const handleCheckout = async () => {
    if (!user) {
      setError("Please log in to checkout.");
      return;
    }

    if (cart.length === 0) return;
    
    if (!selectedCoordinates || selectedCoordinates[0] === 0) {
      setError("Please select your delivery location on the map.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const orderPayload = {
      buyerId: user._id || user.id,
      sellerId: cart[0].sellerId || cart[0].vendorId || user._id, 
      items: cart.map(c => ({
        listingId: c.id,
        productName: c.name,
        quantity: c.qty,
        unitPrice: c.price,
        subtotal: c.price * c.qty
      })),
      pricing: {
        itemsTotal: cartTotal,
        deliveryFee: deliveryQuote.fee,
        platformFee,
        escrowFee: 0,
        discount: 0,
        grandTotal
      },
      pickupDate: pickupDate || new Date().toISOString(),
      pickupTimeSlot,
      routePolyline: deliveryQuote.geometry ? JSON.stringify(deliveryQuote.geometry) : null,
      deliveryAddress: {
        contactName: user.fullName || "AgriNetwork User",
        phone: user.phone || "01700000000",
        addressText: addressText || "Selected Map Location",
        district: "Dhaka",
        division: "Dhaka",
        coordinates: { type: "Point", coordinates: selectedCoordinates }
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
    } catch (_err) {
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
             
             {cart.length > 0 && (
               <div style={{ marginTop: '2rem' }}>
                 <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18}/> Delivery Details</h3>
                 <input 
                   type="text" 
                   placeholder="Enter full building address locally (e.g. House 4, Road 2)"
                   value={addressText}
                   onChange={(e) => setAddressText(e.target.value)}
                   style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }}
                 />
                 <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Select exact location on the map to calculate precise routing:</p>
                 <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                   <MapContainer center={[23.8103, 90.4125]} zoom={12} style={{ height: '100%', width: '100%' }}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <LocationMarker position={selectedCoordinates} setPosition={setSelectedCoordinates} />
                   </MapContainer>
                 </div>
               </div>
             )}
          </div>

          {cart.length > 0 && (
             <div style={{ padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #eee', borderRadius: '0 0 12px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#4b5563' }}>
                   <span>Pickup Schedule</span>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="date" 
                        value={pickupDate} 
                        onChange={e => setPickupDate(e.target.value)} 
                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <select 
                        value={pickupTimeSlot} 
                        onChange={e => setPickupTimeSlot(e.target.value)}
                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </select>
                   </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                   <span>Subtotal</span>
                   <span>৳{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     Delivery Fee 
                     {isLoadingQuote ? '(Calculating...)' : `(${deliveryQuote.distanceKm.toFixed(1)} km)`}
                   </span>
                   <span>৳{deliveryQuote.fee.toFixed(2)}</span>
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
