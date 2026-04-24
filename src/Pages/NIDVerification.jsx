import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, Leaf, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/network';
import './NIDVerification.css';

const NIDVerification = () => {
    const [frontSide, setFrontSide] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backSide, setBackSide] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDone, setIsDone] = useState(false);

    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);
    const navigate = useNavigate();
    const { token } = useAuth(); // Use token from context if available

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'front') {
                if (frontPreview) URL.revokeObjectURL(frontPreview);
                setFrontSide(file);
                setFrontPreview(previewUrl);
            } else {
                if (backPreview) URL.revokeObjectURL(backPreview);
                setBackSide(file);
                setBackPreview(previewUrl);
            }
            setError("");
        }
    };

    const removeImage = (e, type) => {
        e.stopPropagation();
        if (type === 'front') {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            setFrontSide(null);
            setFrontPreview(null);
        } else {
            if (backPreview) URL.revokeObjectURL(backPreview);
            setBackSide(null);
            setBackPreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!frontSide || !backSide) {
            setError("Please upload both sides of your NID.");
            return;
        }
        
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append('nidFront', frontSide);
        formData.append('nidBack', backSide);

        try {
            // Priority: context token -> localStorage token
            const authToken = token || localStorage.getItem('token');
            const apiUrl = API_BASE_URL;
            
            const response = await fetch(`${apiUrl}/api/users/verify-nid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert("Verification request sent successfully!");
                setIsDone(true);
            } else {
                const errorMsg = data.message || "Something went wrong. Please try again.";
                setError(errorMsg);
                alert("Error: " + errorMsg);
            }
        } catch (err) {
            const errorMsg = "Network error. Please check your connection.";
            setError(errorMsg);
            alert("Error: " + errorMsg);
            console.error("Verification submit error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verification-full-screen-container">
            <motion.div
                className="verification-auth-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {!isDone ? (
                    <>
                        <div className="auth-logo compact">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Leaf size={28} color="var(--primary-main)" /> AgriNetwork
                            </div>
                        </div>
                        <h1 className="auth-title compact">NID Verification</h1>
                        <p className="auth-subtitle compact">Verify your identity to ensure a safe marketplace</p>

                        <div className="nid-upload-flex-container">
                            {/* Front Side Upload */}
                            <div
                                className={`upload-area fixed-nid-frame ${frontPreview ? 'has-image' : ''}`}
                                onClick={() => !frontPreview && frontInputRef.current.click()}
                            >
                                <input type="file" ref={frontInputRef} onChange={(e) => handleFileChange(e, 'front')} style={{ display: 'none' }} accept="image/*" />
                                {frontPreview ? (
                                    <div className="preview-wrapper">
                                        <img src={frontPreview} alt="Front NID" className="preview-img nid-fit" />
                                        <button className="remove-btn compact" onClick={(e) => removeImage(e, 'front')}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder compact">
                                        <Upload className="upload-icon" size={28} />
                                        <span className="upload-text">Upload Front Side</span>
                                        <span className="upload-hint">JPG, PNG up to 5MB</span>
                                    </div>
                                )}
                            </div>

                            {/* Back Side Upload */}
                            <div
                                className={`upload-area fixed-nid-frame ${backPreview ? 'has-image' : ''}`}
                                onClick={() => !backPreview && backInputRef.current.click()}
                            >
                                <input type="file" ref={backInputRef} onChange={(e) => handleFileChange(e, 'back')} style={{ display: 'none' }} accept="image/*" />
                                {backPreview ? (
                                    <div className="preview-wrapper">
                                        <img src={backPreview} alt="Back NID" className="preview-img nid-fit" />
                                        <button className="remove-btn compact" onClick={(e) => removeImage(e, 'back')}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder compact">
                                        <Upload className="upload-icon" size={28} />
                                        <span className="upload-text">Upload Back Side</span>
                                        <span className="upload-hint">JPG, PNG up to 5MB</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <div className="error-box compact"><AlertCircle size={18} /><span>{error}</span></div>}

                        <div className="button-wrapper" data-disabled={!frontSide || !backSide}>
                            <button
                                className="primary-button"
                                onClick={handleSubmit}
                                disabled={!frontSide || !backSide || loading}
                                style={{ width: '100%', marginTop: '2rem' }}
                            >
                                {loading ? "Submitting..." : "Submit for Verification"}
                            </button>
                            {(!frontSide || !backSide) && (
                                <div className="disabled-hover-overlay">
                                    <AlertCircle size={18} /> Not Working: Both NID Sides Required
                                </div>
                            )}
                        </div>

                        <p className="privacy-note compact">
                            Your data is encrypted and used only for identity verification.
                        </p>
                    </>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '2rem 1rem' }}
                    >
                        <div style={{ backgroundColor: 'rgba(58, 90, 64, 0.1)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem' }}>
                            <Leaf size={48} color="var(--primary-main)" />
                        </div>
                        <h1 className="auth-title compact">Verification Sent!</h1>
                        <p className="auth-subtitle compact">Our team is reviewing your documents. You'll be notified within 24 hours.</p>
                        <button className="primary-button" onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: '1.5rem' }}>Go to Dashboard</button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default NIDVerification;
