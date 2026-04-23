import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, UploadCloud, CheckCircle, Navigation, MapPin, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const VendorDelivery = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [delivery, setDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpText, setOtpText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [simulatedSMS, setSimulatedSMS] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveryDetails();
  }, [orderId]);

  const fetchDeliveryDetails = async () => {
    try {
      const orderRes = await fetch(`${API_BASE_URL}/api/orders?_id=${orderId}`);
      const ordersData = await orderRes.json();
      const currentOrder = ordersData.find(o => o._id === orderId);
      if (currentOrder) setOrder(currentOrder);

      const delRes = await fetch(`${API_BASE_URL}/api/delivery/${orderId}`);
      if (delRes.ok) {
        const delData = await delRes.json();
        setDelivery(delData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStartDelivery = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/${orderId}/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSimulatedSMS(data.simulatedSMS);
        fetchDeliveryDetails();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to start delivery");
    }
    setSubmitting(false);
  };

  const handleCompleteDelivery = async () => {
    if (!otpText || !photo) {
      setError("Both OTP and a Photo are required!");
      return;
    }
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append("otpText", otpText);
    formData.append("photo", photo);

    try {
      const res = await fetch(`${API_BASE_URL}/api/delivery/${orderId}/complete`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        fetchDeliveryDetails();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to complete delivery");
    }
    setSubmitting(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
        <Truck /> Delivery Handler View
      </h2>
      
      {order && (
        <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <p><strong>Order:</strong> {order.orderNumber}</p>
          <p><strong>Destination:</strong> {order.deliveryAddress?.fullAddress || "Default Address"}</p>
          <p><strong>Status:</strong> {delivery?.logisticsStatus || "Unknown"}</p>
        </div>
      )}

      {error && <div style={{ color: 'red', background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {delivery?.logisticsStatus === 'Pending' && (
         <div>
           <p style={{ marginBottom: '1rem' }}>This order is ready to be delivered. Press Start to initiate delivery and send OTP to the customer.</p>
           <button 
             onClick={handleStartDelivery} 
             disabled={submitting}
             style={{ padding: '1rem 2rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}
           >
              {submitting ? 'Starting...' : 'Start Delivery'}
           </button>
         </div>
      )}

      {delivery?.logisticsStatus === 'InTransit' && (
         <div>
           {simulatedSMS && (
              <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bbf7d0' }}>
                 <strong>[Simulated SMS to Customer]</strong><br/>
                 {simulatedSMS}
              </div>
           )}

           <div style={{ marginBottom: '1rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontWeight: 600 }}>
               <KeyRound size={18} /> Enter Customer OTP
             </label>
             <input 
               type="text"
               value={otpText}
               onChange={e => setOtpText(e.target.value)}
               placeholder="4-digit OTP"
               style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
             />
           </div>

           <div style={{ marginBottom: '1.5rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontWeight: 600 }}>
               <UploadCloud size={18} /> Upload Proof of Delivery (Photo)
             </label>
             <input 
               type="file"
               accept="image/*"
               onChange={e => setPhoto(e.target.files[0])}
               style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px dashed #d1d5db', cursor: 'pointer' }}
             />
           </div>

           <button 
             onClick={handleCompleteDelivery} 
             disabled={submitting}
             style={{ padding: '1rem', background: 'var(--primary-main)', color: 'white', border: 'none', borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
           >
              <CheckCircle size={20} />
              {submitting ? 'Verifying...' : 'Complete Delivery'}
           </button>
         </div>
      )}

      {delivery?.logisticsStatus === 'Delivered' && (
         <div style={{ textAlign: 'center', padding: '2rem' }}>
           <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
           <h3 style={{ color: '#16a34a' }}>Successfully Delivered</h3>
           <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>The order and delivery status have been successfully updated.</p>
           {delivery.proofOfDeliveryPhotos && delivery.proofOfDeliveryPhotos.length > 0 && (
             <img src={delivery.proofOfDeliveryPhotos[0] !== '' && !delivery.proofOfDeliveryPhotos[0].startsWith('http') ? `${API_BASE_URL}${delivery.proofOfDeliveryPhotos[0]}` : delivery.proofOfDeliveryPhotos[0]} alt="Proof" style={{ width: '100%', height: 'auto', marginTop: '1rem', borderRadius: '8px' }} />
           )}
           <button onClick={() => navigate(-1)} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', border: '1px solid #ccc', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
         </div>
      )}
    </div>
  );
};

export default VendorDelivery;
