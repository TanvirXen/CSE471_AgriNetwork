import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, Leaf, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Tesseract from 'tesseract.js';
import './NIDVerification.css';

const NIDVerification = () => {
    const [frontSide, setFrontSide] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backSide, setBackSide] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDone, setIsDone] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState("none");
    const [extractedName, setExtractedName] = useState('');
    const [extractedNid, setExtractedNid] = useState('');
    const [ocrLoading, setOcrLoading] = useState(false);

    const frontInputRef = useRef(null);
    const backInputRef = useRef(null);
    const navigate = useNavigate();
    const { token, user, updateUserInfo } = useAuth(); // Use token from context if available

    // Fetch latest status on mount and redirect if already verified
    React.useEffect(() => {
        if (user?.role === 'Admin') {
            navigate('/dashboard');
            return;
        }

        // If the user is already verified (e.g. returning login), skip NID page entirely
        if (user?.verificationStatus === 'verified') {
            navigate('/dashboard', { replace: true });
            return;
        }

        let interval;

        const fetchStatus = async () => {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) return;

            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${apiUrl}/api/auth/me`, {
                    headers: { 'x-auth-token': authToken }
                });
                const data = await response.json();
                if (response.ok) {
                    setVerificationStatus(data.verificationStatus);
                    updateUserInfo(data);
                    
                    if (data.verificationStatus === 'verified') {
                        // Verified after submitting NID — redirect to dashboard
                        clearInterval(interval);
                        navigate('/dashboard', { replace: true });
                    } else if (data.verificationStatus === 'pending') {
                        setIsDone(true);
                    }
                }
            } catch (err) {
                console.error("Error fetching verification status:", err);
            }
        };

        fetchStatus();

        // Poll every 5 seconds in case verification completes asynchronously
        interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, [token, user?.verificationStatus]);

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'front') {
                if (frontPreview) URL.revokeObjectURL(frontPreview);
                setFrontSide(file);
                setFrontPreview(previewUrl);
                
                // Start OCR
                setOcrLoading(true);
                try {
                    const { data: { text } } = await Tesseract.recognize(file, 'eng');
                    console.log("OCR Extracted Text:", text);
                    
                    // Simple regex/heuristic extraction
                    const nidMatch = text.match(/\b\d{10}\b|\b\d{13}\b|\b\d{17}\b/);
                    if (nidMatch) setExtractedNid(nidMatch[0]);

                    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z\s]+)/i);
                    if (nameMatch && nameMatch[1]) {
                        setExtractedName(nameMatch[1].trim());
                    } else {
                        // Fallback: try to find a capitalized name
                        const capitalizedWords = text.match(/^[A-Z][a-z]+ [A-Z][a-z]+/m);
                        if (capitalizedWords) setExtractedName(capitalizedWords[0]);
                    }
                } catch (error) {
                    console.error("OCR Error:", error);
                    setError("Failed to extract text from image. Please enter details manually.");
                } finally {
                    setOcrLoading(false);
                }
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
        formData.append('extractedName', extractedName);
        formData.append('extractedNid', extractedNid);

        try {
            // Priority: context token -> localStorage token
            const authToken = token || localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || '';
            
            const response = await fetch(`${apiUrl}/api/users/verify-nid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                const updatedStatus = data.verificationStatus || 'verified';
                setVerificationStatus(updatedStatus);
                setIsDone(true);
                
                alert("Verification Successful!");
                updateUserInfo({ ...user, verificationStatus: 'verified', isVerified: true });
                navigate('/dashboard', { replace: true });
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
                        
                        {(frontPreview || ocrLoading) && (
                            <div className="extracted-data-fields" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', margin: '1.5rem auto 0' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>Extracted Name</label>
                                    <input 
                                        type="text" 
                                        value={extractedName} 
                                        onChange={(e) => setExtractedName(e.target.value)}
                                        placeholder="Enter or edit your name"
                                        disabled={ocrLoading}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>NID Number</label>
                                    <input 
                                        type="text" 
                                        value={extractedNid} 
                                        onChange={(e) => setExtractedNid(e.target.value)}
                                        placeholder="Enter or edit your NID number"
                                        disabled={ocrLoading}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && <div className="error-box compact"><AlertCircle size={18} /><span>{error}</span></div>}

                        <div className="button-wrapper" data-disabled={!frontSide || !backSide || loading}>
                            <button
                                className="primary-button"
                                onClick={handleSubmit}
                                disabled={!frontSide || !backSide || loading}
                                style={{ width: '100%', marginTop: '2rem', position: 'relative', overflow: 'hidden' }}
                            >
                                {loading ? "Verifying Identity..." : "Submit for e-KYC Verification"}
                            </button>
                            {(!frontSide || !backSide) && (
                                <div className="disabled-hover-overlay">
                                    <AlertCircle size={18} /> Both NID Sides Required
                                </div>
                            )}
                        </div>

                        <p className="privacy-note compact">
                            Automated identity verification is powered by Secure OCR.
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
                        <h1 className="auth-title compact">
                            {verificationStatus === 'verified' ? "Verified!" : "Verification Incomplete"}
                        </h1>
                        <p className="auth-subtitle compact">
                            {verificationStatus === 'verified' 
                                ? "Your identity has been verified. You now have full access to the marketplace." 
                                : "The system could not match the name on your NID with your account name. Please ensure you upload a clear photo of YOUR own NID."}
                        </p>
                        
                        <div className="button-wrapper" data-disabled={verificationStatus !== 'verified'}>
                            <button 
                                className="primary-button" 
                                onClick={verificationStatus === 'verified' ? () => navigate('/dashboard') : () => setIsDone(false)} 
                                style={{ width: '100%', marginTop: '1.5rem', opacity: 1 }}
                            >
                                {verificationStatus === 'verified' ? "Go to Dashboard" : "Try Again"}
                            </button>
                            {verificationStatus !== 'verified' && (
                                <div className="disabled-hover-overlay">
                                    <AlertCircle size={18} /> Name mismatch detected during scan
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default NIDVerification;
