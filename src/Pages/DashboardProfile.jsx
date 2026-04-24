import React, { useEffect, useState } from 'react';
import { Camera, Check, Loader2, MapPin, Phone, Store, WalletCards } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardProfile = () => {
  const { user, token, updateUserInfo } = useAuth();
  const [searchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAmount, setWalletAmount] = useState('500');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [walletMessage, setWalletMessage] = useState({ type: '', text: '' });
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    businessName: '',
    categories: [],
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.addresses?.[0]?.fullAddress || '',
        businessName: user.profile?.organizationName || user.profile?.shopName || '',
        categories: user.profile?.productCategories || [],
      });
    }
  }, [user]);

  useEffect(() => {
    const walletStatus = searchParams.get('wallet');
    if (!walletStatus) return;

    const syncWalletResult = async () => {
      if (walletStatus === 'success' && token) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: {
              'x-auth-token': token
            }
          });

          if (res.ok) {
            const latestUser = await res.json();
            updateUserInfo(latestUser);
          }
        } catch (_err) {
          // Message handling below is still enough for the UI.
        }
      }

      const nextWalletMessage = {
        success: { type: 'success', text: 'Balance added successfully.' },
        review: { type: 'error', text: 'Payment received but marked for manual review by SSLCommerz.' },
        failed: { type: 'error', text: 'Payment failed. No balance was added.' },
        cancelled: { type: 'error', text: 'Payment was cancelled before completion.' },
        error: { type: 'error', text: 'Payment callback could not be verified.' },
      }[walletStatus] || { type: 'error', text: 'Payment status could not be determined.' };

      setWalletMessage(nextWalletMessage);

      const params = new URLSearchParams(window.location.search);
      params.delete('wallet');
      params.delete('tran_id');
      const nextQuery = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
    };

    syncWalletResult();
  }, [searchParams, token, updateUserInfo]);

  const allCategories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Organic', 'Livestock', 'Poultry', 'Fish'];
  const quickTopUpAmounts = ['500', '1000', '2000', '5000'];
  const formattedBalance = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2
  }).format(user?.walletBalance || 0);

  const toggleCategory = (cat) => {
    setProfile(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const handleAddBalance = async () => {
    const amount = Number(walletAmount);

    if (!Number.isFinite(amount) || amount < 10) {
      setWalletMessage({ type: 'error', text: 'Enter at least BDT 10 to continue.' });
      return;
    }

    setWalletLoading(true);
    setWalletMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/wallet/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ amount })
      });

      const data = await res.json();

      if (!res.ok || !data.gatewayUrl) {
        setWalletMessage({ type: 'error', text: data.message || 'Unable to start SSLCommerz payment.' });
        setWalletLoading(false);
        return;
      }

      window.location.assign(data.gatewayUrl);
    } catch (_err) {
      setWalletMessage({ type: 'error', text: 'Connection error. Please try again.' });
      setWalletLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          businessName: profile.businessName,
          productCategories: profile.categories
        })
      });

      const data = await res.json();

      if (res.ok) {
        updateUserInfo(data);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (_err) {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="profile-container">
      <div style={{
        marginBottom: '1.5rem',
        padding: '1.5rem',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #123524 0%, #1f6b47 100%)',
        color: 'white',
        boxShadow: '0 20px 40px rgba(18, 53, 36, 0.18)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0.45rem 0.8rem', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <WalletCards size={16} />
              AgriNetwork Wallet
            </div>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem' }}>Available balance</p>
            <h3 style={{ margin: '0.3rem 0 0', fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.03em' }}>{formattedBalance}</h3>
          </div>

          <div style={{ flex: '1 1 320px', maxWidth: '430px', width: '100%' }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem' }}>Add balance with SSLCommerz</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="number"
                min="10"
                step="0.01"
                className="form-input"
                value={walletAmount}
                disabled={walletLoading}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="Enter amount in BDT"
                style={{ flex: '1 1 180px', background: 'rgba(255,255,255,0.96)' }}
              />
              <button
                type="button"
                className="primary-button"
                onClick={handleAddBalance}
                disabled={walletLoading}
                style={{ width: 'auto', marginTop: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              >
                {walletLoading ? <Loader2 size={18} className="spin" /> : 'Add Balance'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.9rem' }}>
              {quickTopUpAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setWalletAmount(amount)}
                  disabled={walletLoading}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '999px',
                    border: walletAmount === amount ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.18)',
                    background: walletAmount === amount ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  BDT {amount}
                </button>
              ))}
            </div>

            {walletMessage.text && (
              <div style={{
                marginTop: '0.9rem',
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                background: walletMessage.type === 'success' ? 'rgba(220, 252, 231, 0.92)' : 'rgba(254, 226, 226, 0.95)',
                color: walletMessage.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '0.9rem'
              }}>
                {walletMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary-dark)' }}>My Profile</h2>
          <p style={{ color: 'var(--secondary)' }}>Manage your public identity and business details.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {message.text && (
            <div style={{ 
              padding: '0.6rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem',
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {message.text}
            </div>
          )}
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
            className="primary-button" 
            style={{ width: 'auto', padding: '0.6rem 1.5rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : (isEditing ? 'Save Changes' : 'Edit Profile')}
          </button>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-header-banner">
          <div className="profile-avatar-large">
            {profile.fullName?.charAt(0) || 'U'}
            <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary-main)', color: 'white', borderRadius: '50%', padding: '6px', border: '3px solid white', cursor: 'pointer' }}>
              <Camera size={16} />
            </div>
          </div>
        </div>

        <div className="profile-body">
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="profile-grid">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Full Name
                  {user?.isVerified && (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      backgroundColor: '#dcfce7', 
                      color: '#166534', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.7rem', 
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      <Check size={10} strokeWidth={4} /> Verified
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profile.fullName} 
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={profile.email} 
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  <input 
                    type="tel" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }} 
                    value={profile.phone} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Address</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }} 
                    value={profile.address} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: isEditing ? 'span 2' : 'auto' }}>
                <label className="form-label">Business Name</label>
                <div style={{ position: 'relative' }}>
                  <Store size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ paddingLeft: '40px' }} 
                    value={profile.businessName} 
                    disabled={!isEditing}
                    onChange={(e) => setProfile({...profile, businessName: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Product Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {(isEditing ? allCategories : profile.categories).map(cat => (
                    <span 
                      key={cat} 
                      onClick={() => isEditing && toggleCategory(cat)}
                      style={{ 
                        padding: '6px 14px', 
                        backgroundColor: profile.categories.includes(cat) ? 'var(--primary-main)' : 'var(--neutral-bg)', 
                        color: profile.categories.includes(cat) ? 'white' : 'var(--primary-dark)',
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        cursor: isEditing ? 'pointer' : 'default', 
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition-smooth)'
                      }} 
                    >
                      {profile.categories.includes(cat) && <Check size={14} />}
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
