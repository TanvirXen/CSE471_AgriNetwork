import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, ArrowLeft } from 'lucide-react';
import '../CSS/Auth.css';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

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
        
        {!submitted ? (
          <>
            <h1 className="auth-title">Forgot Password?</h1>
            <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>
            
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@example.com"
                  required 
                />
              </div>
              
              <button type="submit" className="primary-button">
                Send Reset Link
              </button>
              
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/login" className="auth-link" style={{ display: 'flex', setItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ padding: '2rem 1rem' }}>
              <div style={{ backgroundColor: 'var(--accent-soft)', width: '60px', height: '60px', borderRadius: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
                <Mail size={32} color="var(--primary-main)" />
              </div>
              <h2 className="auth-title">Check Your Email</h2>
              <p className="auth-subtitle">We've sent a password reset link to your email address.</p>
              
              <Link to="/login" className="primary-button" style={{ display: 'block', textDecoration: 'none' }}>
                Return to Login
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
