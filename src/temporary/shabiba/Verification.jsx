import React from 'react';
import './Verification.css';

const Verification = () => {
    return (
        <div className="verification-container">
            {/* Design System Background Elements */}
            <div className="bg-mesh"></div>
            <div className="bg-accent-blob blob-1"></div>
            <div className="bg-accent-blob blob-2"></div>

            <div className="verification-card">
                <header className="verification-header">
                    <h1>Identity Verification</h1>
                    <p>Securely verify your account to access all features</p>
                </header>

                <div className="verification-content">
                    {/* Visual Hierarchy: Status Badges */}
                    <div className="badges-container">
                        <div className="badge badge-seller">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Verified Seller
                        </div>
                        <div className="badge badge-vendor">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            Verified Vendor
                        </div>
                    </div>

                    {/* Section: NID Identification */}
                    <section className="verification-section">
                        <h2 className="section-title">NID Identification</h2>
                        <div className="upload-grid">
                            <div className="upload-box">
                                <div className="upload-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                        <line x1="7" y1="8" x2="17" y2="8"></line>
                                        <line x1="7" y1="12" x2="17" y2="12"></line>
                                        <line x1="7" y1="16" x2="12" y2="16"></line>
                                    </svg>
                                </div>
                                <p>NID Front Side</p>
                                <span>Click or drag photo</span>
                            </div>
                            <div className="upload-box">
                                <div className="upload-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                        <path d="M3 10h18"></path>
                                        <path d="M7 15h.01"></path>
                                        <path d="M11 15h.01"></path>
                                    </svg>
                                </div>
                                <p>NID Back Side</p>
                                <span>Click or drag photo</span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Selfie Verification */}
                    <section className="verification-section">
                        <h2 className="section-title">Selfie Verification</h2>
                        <div className="selfie-section-box">
                            <div className="upload-box" style={{ maxWidth: '320px', margin: '0 auto', background: 'var(--white)' }}>
                                <div className="upload-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                </div>
                                <p>Capture Selfie</p>
                                <span>Ensure face is fully visible</span>
                            </div>

                            <div className="liveness-note">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>
                                    <strong>Liveness Check:</strong> Our AI ensures your verification is real-time and secure.
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Final Action */}
                    <button className="submit-btn" onClick={() => alert("Verification request sent!")}>
                        Verify Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verification;
