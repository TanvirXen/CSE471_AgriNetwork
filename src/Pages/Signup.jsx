import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, User, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import '../CSS/Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

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
                  <input type="text" className="form-input" placeholder="John Doe" required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="john@example.com" required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" required />
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
                  disabled={!role}
                  className="primary-button" 
                  style={{ flex: 2, opacity: role ? 1 : 0.6 }}
                  onClick={() => window.location.href = `/complete-profile/${role}`}
                >
                  Complete Registration
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
