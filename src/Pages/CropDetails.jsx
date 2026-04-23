import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Tag, Package, AlertCircle, CheckCircle, ArrowLeft, Phone, Calendar, ShoppingCart } from 'lucide-react';
import '../CSS/CropMarketplace.css';
import { useCart } from '../context/CartContext';
import VendorReviews from '../Components/VendorReviews';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function CropDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, showToast } = useCart();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [contactOpen, setContactOpen] = useState(false);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [sellerLoading, setSellerLoading] = useState(false);

    useEffect(() => {
        const fetchCrop = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/crops/${id}`);
                if (!res.ok) throw new Error("Failed to load crop details");
                const data = await res.json();
                setCrop(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCrop();
    }, [id]);

    const handleContact = async () => {
        setContactOpen(true);
        setSellerLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/crops/${id}/seller`);
            const data = await res.json();
            setSellerInfo(data);
        } catch {
            setSellerInfo({ error: "Could not fetch seller details" });
        } finally {
            setSellerLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--neutral-bg)', minHeight: '100vh', color: 'var(--primary-dark)' }}>Loading full details...</div>;
    if (error) return <div style={{ padding: '40px', color: 'red', backgroundColor: '#ffebe9', minHeight: '100vh' }}>Error: {error}</div>;
    if (!crop) return null;

    return (
        <div style={{ backgroundColor: 'var(--neutral-bg)', minHeight: '100vh', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>
                    <ArrowLeft size={20} /> Back to Marketplace
                </button>

                <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ height: '350px', backgroundColor: '#eee', position: 'relative' }}>
                        <img src={crop.image} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {crop.isSpotlight && (
                            <span style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', backgroundColor: 'var(--accent-soft)', color: 'var(--primary-dark)', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
                                ⭐ Region Spotlight: High Demand
                            </span>
                        )}
                        <span style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', backgroundColor: 'var(--primary-dark)', color: 'var(--accent-soft)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: 'var(--shadow-sm)' }}>
                            Grade {crop.grade}
                        </span>
                    </div>

                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h1 style={{ margin: '0 0 1rem 0', color: 'var(--primary-dark)', fontSize: '2.5rem', fontWeight: 800 }}>{crop.name}</h1>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '1.05rem', marginBottom: '1rem', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308', fontWeight: 'bold' }}>
                                        ⭐ {crop.averageRating > 0 ? crop.averageRating.toFixed(1) : '0.0'} Product Rating ({crop.totalReviews} Reviews)
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 'bold', marginLeft: '1rem' }}>
                                        🛡️ Product Trust: {Math.round(crop.trustScore || 0)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--secondary)', flexWrap: 'wrap', fontSize: '1.05rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--neutral-bg)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}><Tag size={18} /> {crop.variety}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--neutral-bg)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}><MapPin size={18} /> {crop.region}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--neutral-bg)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}><Package size={18} /> {crop.sackType}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '200px' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-main)', lineHeight: 1 }}>
                                    ৳{crop.price}<small style={{ fontSize: '1.2rem', color: 'var(--secondary)', fontWeight: 600 }}>/{crop.unit}</small>
                                </div>
                                <div style={{ marginTop: '0.75rem', color: 'var(--secondary)', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                    <span>Moisture Level:</span> <span style={{ color: 'var(--primary-dark)' }}>{crop.moisture}</span>
                                </div>
                            </div>
                        </div>

                        {crop.description && (
                            <div style={{ marginTop: '2.5rem', backgroundColor: 'var(--neutral-bg)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.75rem', fontSize: '1.2rem', fontWeight: '700' }}>Description</h3>
                                <p style={{ color: 'var(--secondary)', lineHeight: 1.6, fontSize: '1rem', margin: 0 }}>{crop.description}</p>
                            </div>
                        )}

                        <hr style={{ borderTop: '2px solid var(--neutral-bg)', margin: '2.5rem 0' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
                            <div>
                                <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
                                    <CheckCircle color="var(--secondary)" size={24} /> Quality & Grading Details
                                </h3>
                                <div style={{ backgroundColor: 'var(--white)', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid var(--secondary)', color: 'var(--primary-dark)', lineHeight: 1.6, boxShadow: 'var(--shadow-sm)', fontSize: '1.05rem' }}>
                                    {crop.qualityNotes}
                                </div>

                                <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem', marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
                                    <AlertCircle color="var(--primary-main)" size={24} /> Health & Disease Conditions
                                </h3>
                                <div style={{ backgroundColor: 'var(--accent-soft)', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid var(--primary-main)', color: 'var(--primary-dark)', lineHeight: 1.6, boxShadow: 'var(--shadow-sm)', fontSize: '1.05rem' }}>
                                    {crop.diseaseNotes}
                                </div>
                            </div>

                            <div>
                                <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(52,78,65,0.1)' }}>
                                    <h3 style={{ color: 'var(--primary-dark)', marginTop: 0, marginBottom: '1.5rem', fontSize: '1.3rem' }}>Wholesale Deals</h3>
                                    {crop.bulkDeals && crop.bulkDeals.length > 0 ? (
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {crop.bulkDeals.map((deal, idx) => (
                                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px dashed var(--secondary)', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
                                                    <span>Buy {deal.minQty}+ {crop.unit}</span>
                                                    <strong style={{ color: 'var(--primary-main)' }}>৳{deal.price} / {crop.unit}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ color: 'var(--secondary)', margin: 0, fontStyle: 'italic', fontSize: '1.05rem' }}>No bulk pricing tiers currently available.</p>
                                    )}

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                        <button
                                            onClick={() => { addToCart(crop); showToast('Added to cart successfully!'); }}
                                            style={{ flex: 1, padding: '1.2rem', backgroundColor: '#f59e0b', color: 'var(--white)', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', transition: 'var(--transition)', boxShadow: 'var(--shadow-sm)' }}
                                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#d97706'; }}
                                            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f59e0b'; }}
                                        >
                                            <ShoppingCart size={22} /> Add to Cart
                                        </button>

                                        <button
                                            onClick={handleContact}
                                            style={{ flex: 1, padding: '1.2rem', backgroundColor: 'var(--primary-main)', color: 'var(--white)', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', transition: 'var(--transition)', boxShadow: 'var(--shadow-sm)' }}
                                            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--primary-dark)' }}
                                            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--primary-main)'; e.currentTarget.style.color = 'var(--white)' }}
                                        >
                                            <Phone size={22} /> Contact Seller
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--white)', border: '1px solid var(--neutral-bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'var(--white)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                        {crop.seller?.name?.charAt(0) || 'S'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{crop.seller?.name || 'Verified Supplier'}</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--secondary)' }}>Member since 2024</span>
                                            {crop.seller?.totalReviews > 0 && (
                                                <>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontWeight: 'bold' }}>
                                                        ⭐ {crop.seller.averageRating?.toFixed(1)} Seller Rating
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
                                                        🛡️ Seller Trust: {Math.round(crop.seller.trustScore || 0)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Reviews */}
                        {crop.id ? (
                            <VendorReviews vendorId={crop.sellerId || crop.vendorId || crop.seller?._id} productId={crop.id} />
                        ) : null}

                    </div>
                </div>
            </div>

            {contactOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(52,78,65,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setContactOpen(false)}>
                    <div style={{ backgroundColor: 'var(--white)', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: 'var(--primary-dark)', margin: '0 0 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.5rem' }}>
                            Seller Contact <button style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: 0 }} onClick={() => setContactOpen(false)}>×</button>
                        </h3>
                        {sellerLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--primary-main)' }}>Fetching secure contact info...</div>
                        ) : sellerInfo?.error ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'red', backgroundColor: '#ffebe9', borderRadius: '8px' }}>{sellerInfo.error}</div>
                        ) : (
                            <div style={{ textAlign: 'center', margin: '2rem 0', backgroundColor: 'var(--neutral-bg)', padding: '2rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-dark)', marginBottom: '1rem' }}>{sellerInfo?.name}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    <Phone size={28} /> {sellerInfo?.phone}
                                </div>
                            </div>
                        )}
                        <button onClick={() => setContactOpen(false)} style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--white)', fontSize: '1.1rem', transition: 'var(--transition)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}>Close Window</button>
                    </div>
                </div>
            )}
        </div>
    );
}
