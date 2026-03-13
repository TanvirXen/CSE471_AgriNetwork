// DetailModal.jsx — AgriNetwork Bangladesh
// Modal to show realistic profile details of a farmer or vendor

import React from "react";
import { X, MapPin, Star, ShieldCheck, ShoppingBasket, Phone, Calendar } from "lucide-react";

function DetailModal({ item, onClose, onChat }) {
    if (!item) return null;

    return (
        <div className="sm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="sm-modal" role="dialog" aria-modal="true">
                <div className="sm-modal__header">
                    <div className="sm-modal__title">Profile Details</div>
                    <button className="sm-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sm-modal__body">
                    <div className="sm-profile-header">
                        <div className={`sm-profile-avatar ${item.type}`}>
                            {item.type === "farmer" ? "🌾" : item.type === "vendor" ? "🏪" : "🏬"}
                        </div>
                        <div className="sm-profile-info">
                            <h2>{item.name}</h2>
                            <div className="sm-profile-tags">
                                <span className={`sm-card__type-tag ${item.type}`}>
                                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </span>
                                {item.isVerified && (
                                    <span className="sm-verify-badge">
                                        <ShieldCheck size={14} /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sm-profile-grid">
                        <div className="sm-detail-item">
                            <MapPin size={18} />
                            <div>
                                <label>Location</label>
                                <p>{item.district}, Bangladesh</p>
                            </div>
                        </div>
                        <div className="sm-detail-item">
                            <Star size={18} style={{ color: "var(--sm-accent)" }} />
                            <div>
                                <label>Rating</label>
                                <p>{item.rating} / 5.0 (48 reviews)</p>
                            </div>
                        </div>
                        <div className="sm-detail-item">
                            <ShoppingBasket size={18} />
                            <div>
                                <label>Main Products</label>
                                <p>{item.crop}</p>
                            </div>
                        </div>
                        <div className="sm-detail-item">
                            <Calendar size={18} />
                            <div>
                                <label>Member Since</label>
                                <p>January 2024</p>
                            </div>
                        </div>
                    </div>

                    <div className="sm-profile-description">
                        <h3>About</h3>
                        <p>
                            Experienced {item.type} dedicated to providing high-quality agricultural products 
                            directly from the fields of {item.district}. Committed to fair pricing and 
                            sustainable farming practices for the benefit of all Bangladeshi citizens.
                        </p>
                    </div>

                    <div className="sm-price-board">
                        <div className="sm-price-main">
                            <label>Starting Price</label>
                            <div className="sm-price-val">
                                ৳ {item.price || "Negotiable"} <span>{item.unit || ""}</span>
                            </div>
                        </div>
                        <div className="sm-stock-status">
                            <span className={`sm-stock-dot ${item.stock}`} />
                            {item.stock === "in-stock" ? "Currently Available" : "Limited Availability"}
                        </div>
                    </div>
                </div>

                <div className="sm-modal__footer">
                    <button className="sm-btn sm-btn--ghost" onClick={onClose}>Close</button>
                    <button className="sm-btn sm-btn--primary" style={{ flex: 1 }} onClick={() => onChat(item)}>
                        💬 Start Chat & Negotiate
                    </button>
                </div>
            </div>

            <style>{`
                .sm-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                    padding: 20px;
                }
                .sm-modal {
                    background: white;
                    width: 100%;
                    max-width: 500px;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    animation: modalSlide 0.3s ease-out;
                }
                @keyframes modalSlide {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .sm-modal__header {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sm-modal__title {
                    font-weight: 700;
                    color: var(--sm-dark);
                }
                .sm-modal__close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #888;
                }
                .sm-modal__body {
                    padding: 24px;
                }
                .sm-profile-header {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .sm-profile-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                }
                .sm-profile-avatar.farmer { background: var(--sm-sage-light); }
                .sm-profile-avatar.vendor { background: #fce7f3; }
                .sm-profile-info h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: var(--sm-dark);
                }
                .sm-profile-tags {
                    display: flex;
                    gap: 8px;
                    margin-top: 4px;
                }
                .sm-verify-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    color: var(--sm-main);
                    background: var(--sm-sage-light);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                }
                .sm-profile-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .sm-detail-item {
                    display: flex;
                    gap: 12px;
                    color: #666;
                }
                .sm-detail-item label {
                    display: block;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #999;
                    margin-bottom: 2px;
                }
                .sm-detail-item p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--sm-dark);
                    font-weight: 600;
                }
                .sm-profile-description h3 {
                    font-size: 0.9rem;
                    margin-bottom: 8px;
                    color: var(--sm-dark);
                }
                .sm-profile-description p {
                    font-size: 0.85rem;
                    line-height: 1.5;
                    color: #666;
                }
                .sm-price-board {
                    margin-top: 24px;
                    background: var(--sm-offwhite);
                    padding: 16px;
                    border-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sm-price-main label { font-size: 0.75rem; color: #888; }
                .sm-price-val { font-size: 1.25rem; font-weight: 700; color: var(--sm-main); }
                .sm-price-val span { font-size: 0.85rem; font-weight: 400; color: #888; }
                .sm-stock-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 6px;
                }
                .sm-stock-dot.in-stock { background: #10b981; }
                .sm-stock-status { font-size: 0.8rem; color: #666; }
                .sm-modal__footer {
                    padding: 20px;
                    background: #f9f9f9;
                    display: flex;
                    gap: 12px;
                }
            `}</style>
        </div>
    );
}

export default DetailModal;
