import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Store, Tag, Camera, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardProfile = () => {
  const { user, token, updateUserInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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

  const allCategories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Organic', 'Livestock', 'Poultry', 'Fish'];

  const toggleCategory = (cat) => {
    setProfile(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="profile-container">
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
                <label className="form-label">Full Name</label>
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
