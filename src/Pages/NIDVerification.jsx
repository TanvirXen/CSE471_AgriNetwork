import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Upload, CheckCircle, ShieldCheck } from 'lucide-react';
import '../CSS/Auth.css';

const NIDVerification = () => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleUpload = (side) => {
    // Simulate file selection
    if (side === 'front') setFrontImage(true);
    else setBackImage(true);
  };

  const startVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsDone(true);
    }, 2500);
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-logo">
          <Leaf size={28} /> AgriNetwork
        </div>
        
        {!isDone ? (
          <>
            <h1 className="auth-title">NID Verification</h1>
            <p className="auth-subtitle">Verify your identity to ensure a safe marketplace</p>
            
            <div className="nid-upload-container">
              <div 
                className="upload-area" 
                onClick={() => handleUpload('front')}
                style={{ borderColor: frontImage ? 'var(--primary-main)' : '' }}
              >
                {frontImage ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={32} color="var(--primary-main)" />
                    <p style={{ marginTop: '8px', color: 'var(--primary-main)', fontWeight: '600' }}>Front Side Uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="upload-icon" />
                    <span className="upload-text">Upload Front Side</span>
                    <span className="upload-hint">JPG, PNG up to 5MB</span>
                  </>
                )}
              </div>

              <div 
                className="upload-area" 
                onClick={() => handleUpload('back')}
                style={{ borderColor: backImage ? 'var(--primary-main)' : '' }}
              >
                {backImage ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={32} color="var(--primary-main)" />
                    <p style={{ marginTop: '8px', color: 'var(--primary-main)', fontWeight: '600' }}>Back Side Uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="upload-icon" />
                    <span className="upload-text">Upload Back Side</span>
                    <span className="upload-hint">JPG, PNG up to 5MB</span>
                  </>
                )}
              </div>
            </div>

            <button 
              className="primary-button" 
              onClick={startVerification}
              disabled={!frontImage || !backImage || isVerifying}
              style={{ width: '100%', marginTop: '2rem', opacity: (!frontImage || !backImage) ? 0.6 : 1 }}
            >
              {isVerifying ? "Verifying..." : "Submit for Verification"}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '1rem' }}>
              Your data is encrypted and used only for identity verification.
            </p>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '2rem 1rem' }}
          >
            <div style={{ backgroundColor: 'var(--accent-soft)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldCheck size={48} color="var(--primary-main)" />
            </div>
            <h1 className="auth-title">Verification Sent!</h1>
            <p className="auth-subtitle">Our team is reviewing your documents. You'll be notified within 24 hours.</p>
            <button className="primary-button" onClick={() => window.location.href = '/'}>Go to Dashboard</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default NIDVerification;
