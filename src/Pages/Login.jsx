import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, LogIn } from 'lucide-react';
import '../CSS/Auth.css';

const Login = () => {
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
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to manage your agri-business</p>
        
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <div className="auth-footer-links">
            <Link to="/forgot-password" title='Coming Soon' className="auth-link">Forgot Password?</Link>
            <span>New here? <Link to="/signup" className="auth-link">Create account</Link></span>
          </div>
          
          <button type="submit" className="primary-button">
            Log In
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
