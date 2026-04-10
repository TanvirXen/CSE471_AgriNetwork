import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Store, User, MapPin, Phone, Briefcase, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../CSS/Auth.css';

const CompleteProfile = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserInfo } = useAuth();
  
  const isVendor = role === 'vendor';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    businessName: '',
    tradeLicenseNo: '',
    shopName: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, phone: user.phone || '' }));
    }
  }, [user]);

  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat) 
        : [...prev, cat]
    );
  };

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Organic', 'Livestock', 'Poultry', 'Fish'];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          ...formData, 
          productCategories: selectedCategories 
        })
      });

      const data = await res.json();

      if (res.ok) {
        updateUserInfo(data);
        navigate('/verify-nid');
      } else {
        setError(data.message || 'Failed to save profile.');
      }
    } catch (_err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        style={{ maxWidth: '600px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <Leaf size={28} /> AgriNetwork
        </div>
        <h1 className="auth-title">Complete Your Profile</h1>
        <p className="auth-subtitle">
          {isVendor 
            ? "Setup your shop and let customers find your products" 
            : "Tell us a bit more to personalize your shopping experience"}
        </p>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                  type="tel" 
                  name="phone"
                  className="form-input" 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="017XXXXXXXX" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Location / Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input 
                  type="text" 
                  name="address"
                  className="form-input" 
                  style={{ paddingLeft: '40px' }} 
                  placeholder="Your primary address" 
                  value={formData.address}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>

            {isVendor && (
              <>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Business / Shop Name</label>
                  <div style={{ position: 'relative' }}>
                    <Store size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                      type="text" 
                      name="businessName"
                      className="form-input" 
                      style={{ paddingLeft: '40px' }} 
                      placeholder="Green Agri Farm" 
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Trade License (Optional)</label>
                  <input 
                    type="text" 
                    name="tradeLicenseNo"
                    className="form-input" 
                    placeholder="ABC-123-XYZ" 
                    value={formData.tradeLicenseNo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Categories (Select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {categories.map(cat => (
                      <span 
                        key={cat} 
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: selectedCategories.includes(cat) ? 'var(--primary-main)' : 'var(--neutral-bg)', 
                          color: selectedCategories.includes(cat) ? 'white' : 'var(--primary-dark)',
                          borderRadius: '20px', 
                          fontSize: '0.9rem', 
                          cursor: 'pointer', 
                          fontWeight: '500',
                          border: '1.5px solid transparent',
                          borderColor: selectedCategories.includes(cat) ? 'var(--primary-main)' : 'transparent',
                          transition: 'var(--transition-smooth)'
                        }} 
                        onClick={() => toggleCategory(cat)}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!isVendor && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Preferred Product Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {categories.map(cat => (
                    <span 
                      key={cat} 
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: selectedCategories.includes(cat) ? 'var(--primary-main)' : 'var(--neutral-bg)', 
                        color: selectedCategories.includes(cat) ? 'white' : 'var(--primary-dark)',
                        borderRadius: '20px', 
                        fontSize: '0.9rem', 
                        cursor: 'pointer', 
                        fontWeight: '500',
                        border: '1.5px solid transparent',
                        borderColor: selectedCategories.includes(cat) ? 'var(--primary-main)' : 'transparent',
                        transition: 'var(--transition-smooth)'
                      }} 
                      onClick={() => toggleCategory(cat)}
                    >
                        {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button type="submit" className="primary-button" style={{ marginTop: '2rem' }} disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save and Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
