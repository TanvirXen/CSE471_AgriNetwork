import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, User, Store, ArrowRight, ArrowLeft, Phone, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../CSS/Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    setError('');
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleRegister = async () => {
    if (!role) {
      setError('Please select a role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: role.charAt(0).toUpperCase() + role.slice(1) })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate(`/complete-profile/${role}`);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-logo">
          <Leaf size={28} /> AgriNetwork
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join our community of farmers and traders</p>
              
              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                      type="text" 
                      name="fullName"
                      className="form-input" 
                      placeholder="John Doe" 
                      style={{ paddingLeft: '40px' }}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                      type="tel" 
                      name="phone"
                      className="form-input" 
                      placeholder="017XXXXXXXX" 
                      style={{ paddingLeft: '40px' }}
                      value={formData.phone}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                    <input 
                      type="password" 
                      name="password"
                      className="form-input" 
                      placeholder="••••••••" 
                      style={{ paddingLeft: '40px' }}
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>

                <div className="auth-footer-links">
                  <span>Already have an account? <Link to="/login" className="auth-link">Log in</Link></span>
                </div>
                
                <button type="submit" className="primary-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Next <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="auth-title">Choose Your Role</h1>
              <p className="auth-subtitle">Tell us how you'll use AgriNetwork</p>
              
              <div className="role-selection">
                <div 
                  className={`role-card ${role === 'customer' ? 'active' : ''}`}
                  onClick={() => setRole('customer')}
                >
                  <div className="role-icon"><User size={32} /></div>
                  <div className="role-name">Customer</div>
                  <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>I want to buy fresh produce directly</p>
                </div>
                
                <div 
                  className={`role-card ${role === 'vendor' ? 'active' : ''}`}
                  onClick={() => setRole('vendor')}
                >
                  <div className="role-icon"><Store size={32} /></div>
                  <div className="role-name">Vendor</div>
                  <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>I want to sell my agri-products</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={prevStep} className="primary-button" style={{ backgroundColor: '#dad7cd', color: '#344e41', flex: 1 }}>
                  Back
                </button>
                <button 
                  disabled={!role || loading}
                  className="primary-button" 
                  style={{ flex: 2, opacity: role ? 1 : 0.6 }}
                  onClick={handleRegister}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;
