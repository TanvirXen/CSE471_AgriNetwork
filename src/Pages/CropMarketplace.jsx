import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/CropMarketplace.css';
import { Filter, Search, Calendar, MapPin, Tag, AlertCircle, CheckCircle, Package, Phone, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartCheckoutModal from '../Components/CartCheckoutModal';
import { Star, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config/network';

const FILTER_OPTIONS = {
    variety: ['All', 'BRRI Dhan 28', 'Kataribhog', 'BARI Gom 26', 'Tosha Jute'],
    moisture: ['All', '< 12%', '12% - 14%', '> 14%'],
    grade: ['All', 'Premium', 'A', 'B', 'C'],
    sackType: ['All', 'Jute (50kg)', 'Plastic (25kg)', 'Woven Sack (50kg)', 'Bales (180kg)']
};

const CropMarketplace = () => {
    const navigate = useNavigate();
    const { cart, addToCart, setIsCartOpen, showToast } = useCart();
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        variety: 'All',
        moisture: 'All',
        grade: 'All',
        sackType: 'All',
        search: ''
    });

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Modal States
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState('Jan');
    const [calendarData, setCalendarData] = useState([]);
    const [calendarLoading, setCalendarLoading] = useState(false);

    const [contactOpen, setContactOpen] = useState(false);
    const [sellerInfo, setSellerInfo] = useState(null);
    const [sellerLoading, setSellerLoading] = useState(false);

    useEffect(() => {
        const fetchCrops = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (activeFilters.variety !== 'All') params.append('variety', activeFilters.variety);
                if (activeFilters.grade !== 'All') params.append('grade', activeFilters.grade);
                if (activeFilters.sackType !== 'All') params.append('sackType', activeFilters.sackType);

                const queryString = params.toString();
                const url = queryString
                    ? `${API_BASE_URL}/api/crops/filter?${queryString}`
                    : `${API_BASE_URL}/api/crops/filter`;

                const response = await fetch(url, {
                    method: "GET",
                    credentials: "include", // <- add this
                });
                if (!response.ok) throw new Error('Failed to load crops');

                const data = await response.json();

                const mappedCrops = data.map(doc => ({
                    id: doc._id,
                    name: doc.productName || 'Unnamed Crop',
                    variety: doc.variety || 'Unknown Variety',
                    region: doc.region || 'Unknown Region',
                    price: doc.pricing?.unitPrice || 0,
                    unit: doc.pricing?.unit || 'kg',
                    moisture: doc.moisturePercentage ? `${doc.moisturePercentage}%` : 'N/A',
                    grade: doc.grade || 'N/A',
                    sackType: doc.sackType || 'N/A',
                    diseaseNotes: doc.diseaseNotes || 'None reported.',
                    qualityNotes: doc.qualityNotes || 'No quality notes provided.',
                    vendorId: doc.vendorId || doc.sellerId,
                    sellerId: doc.sellerId || doc.vendorId,
                    isSpotlight: true,
                    bulkDeals: (doc.pricing?.bulkPricingTiers || []).map(t => ({
                        minQty: t.minQty,
                        price: t.pricePerUnit
                    })),
                    averageRating: typeof doc.averageRating === 'number' ? doc.averageRating : 0,
                    trustScore: typeof doc.trustScore === 'number' ? doc.trustScore : 0,
                    totalReviews: typeof doc.totalReviews === 'number' ? doc.totalReviews : 0,
                    harvestDate: 'N/A',
                    image: doc.media?.length > 0 ? doc.media[0].url : 'https://placehold.co/400x300?text=No+Image'

                }));

                setCrops(mappedCrops);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCrops();
    }, [activeFilters.variety, activeFilters.grade, activeFilters.sackType]);

    const handleFilterChange = (type, value) => {
        setActiveFilters(prev => ({ ...prev, [type]: value }));
    };

    const handleCardClick = (id) => {
        navigate(`/sumaiya/crop/${id}`);
    };

    const handleContact = async (e, id) => {
        e.stopPropagation();
        setContactOpen(true);
        setSellerLoading(true);
        setSellerInfo(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/crops/${id}/seller`, {
                credentials: "include", // <- add this
            });
            const data = await res.json();
            setSellerInfo(data);
        } catch {
            setSellerInfo({ error: "Could not fetch details" });
        } finally {
            setSellerLoading(false);
        }
    };

    const openCalendar = () => {
        setCalendarOpen(true);
        if (calendarData.length === 0) fetchCalendar('Jan');
    };

    const fetchCalendar = async (month) => {
        setCalendarMonth(month);
        setCalendarLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/crops/harvest?month=${month}`, {
                credentials: "include", // <- add this
            });
            const data = await res.json();
            setCalendarData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setCalendarLoading(false);
        }
    };

    const filteredCrops = crops.filter(crop => {
        if (activeFilters.search && !crop.name.toLowerCase().includes(activeFilters.search.toLowerCase())) return false;

        if (activeFilters.moisture !== 'All') {
            const cropMoistureVal = parseInt(crop.moisture);
            if (isNaN(cropMoistureVal)) return false;

            if (activeFilters.moisture === '< 12%' && cropMoistureVal >= 12) return false;
            if (activeFilters.moisture === '12% - 14%' && (cropMoistureVal < 12 || cropMoistureVal > 14)) return false;
            if (activeFilters.moisture === '> 14%' && cropMoistureVal <= 14) return false;
        }
        return true;
    });

    return (
        <div className="sumaiya-crop-marketplace">
            <header className="cm-header">
                <div className="cm-header-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <MapPin size={24} color="var(--accent-soft)" />
                    AgriNetwork Market
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setIsCartOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}>
                       <ShoppingCart size={24} />
                       {cart.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-soft)', color: 'var(--primary-dark)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{cart.length}</span>}
                    </button>
                </div>
            </header>

            <div className="cm-container">
                <aside className={`cm-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="cm-sidebar-header">
                        <h3>Filters</h3>
                        <button className="cm-close-filter" onClick={() => setIsMobileFilterOpen(false)}>×</button>
                    </div>

                    <div className="cm-filter-group">
                        <h4 className="cm-filter-title">Crop Variety</h4>
                        <div className="cm-filter-options">
                            {FILTER_OPTIONS.variety.map(opt => (
                                <label key={opt} className="cm-checkbox-label">
                                    <input
                                        type="radio"
                                        name="variety"
                                        checked={activeFilters.variety === opt}
                                        onChange={() => handleFilterChange('variety', opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="cm-filter-group">
                        <h4 className="cm-filter-title">Moisture %</h4>
                        <div className="cm-filter-options">
                            {FILTER_OPTIONS.moisture.map(opt => (
                                <label key={opt} className="cm-checkbox-label">
                                    <input
                                        type="radio"
                                        name="moisture"
                                        checked={activeFilters.moisture === opt}
                                        onChange={() => handleFilterChange('moisture', opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="cm-filter-group">
                        <h4 className="cm-filter-title">Quality Grade</h4>
                        <div className="cm-filter-options">
                            {FILTER_OPTIONS.grade.map(opt => (
                                <label key={opt} className="cm-checkbox-label">
                                    <input
                                        type="radio"
                                        name="grade"
                                        checked={activeFilters.grade === opt}
                                        onChange={() => handleFilterChange('grade', opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="cm-filter-group">
                        <h4 className="cm-filter-title">Packaging / Sack Type</h4>
                        <div className="cm-filter-options">
                            {FILTER_OPTIONS.sackType.map(opt => (
                                <label key={opt} className="cm-checkbox-label">
                                    <input
                                        type="radio"
                                        name="sackType"
                                        checked={activeFilters.sackType === opt}
                                        onChange={() => handleFilterChange('sackType', opt)}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="cm-main-content">
                    <div className="cm-page-header">
                        <div>
                            <h1 className="cm-page-title">Wholesale Crop Marketplace</h1>
                            <p className="cm-page-subtitle">Transparent pricing, verified quality, direct from farmers.</p>
                        </div>

                        <div className="cm-search-bar">
                            <Search className="cm-search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search crops, varieties, or regions..."
                                value={activeFilters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>

                    <button className="cm-filter-toggle" onClick={() => setIsMobileFilterOpen(true)}>
                        <Filter size={18} />
                        Show Filters
                    </button>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading marketplace data...</div>
                    ) : error ? (
                        <div style={{ color: 'red', padding: '20px', backgroundColor: '#ffebe9' }}>Error: {error}</div>
                    ) : (
                        <>
                            {/* Region Spotlights */}
                            <section className="cm-spotlight-section">
                                <h2 className="cm-section-title">
                                    <MapPin size={24} color="var(--primary-main)" />
                                    Region Spotlights
                                </h2>
                                <div className="cm-spotlight-grid">
                                    {crops
                                        .filter(c => c.isSpotlight)
                                        .sort((a, b) => b.viewCount - a.viewCount)
                                        .slice(0, 3)
                                        .map(crop => (
                                            <div key={`spotlight-${crop.id}`} className="cm-spotlight-card" onClick={() => handleCardClick(crop.id)}>
                                                <img src={crop.image} alt={crop.name} className="cm-spotlight-img" />
                                                <div className="cm-spotlight-overlay">
                                                    <span className="cm-badge primary" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--primary-dark)' }}>⭐ High Demand</span>
                                                    <h3>{crop.region}</h3>
                                                    <p>{crop.name} • {crop.variety}</p>
                                                </div>
                                            </div>
                                        ))}
                                    {crops.filter(c => c.isSpotlight).length === 0 && (
                                        <p style={{ color: '#666' }}>No spotlight regions currently highlighted.</p>
                                    )}
                                </div>
                            </section>

                            {/* Harvest Calendar Preview */}
                            <section className="cm-calendar-section">
                                <div className="cm-calendar-banner">
                                    <div className="cm-calendar-info">
                                        <h3><Calendar size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Harvest Calendar</h3>
                                        <p>Plan your bulk purchases ahead of time. See what's coming next season.</p>
                                    </div>
                                    <button className="cm-btn-outline" onClick={openCalendar}>View Full Calendar</button>
                                </div>
                            </section>

                            {/* Crop Listings */}
                            <section className="cm-listings-section">
                                <h2 className="cm-section-title">Available Listings ({filteredCrops.length})</h2>
                                <div className="cm-listings-grid">
                                    {filteredCrops.map(crop => (
                                        <div key={crop.id} className="cm-crop-card" onClick={() => handleCardClick(crop.id)} style={{ cursor: 'pointer' }}>
                                            <div className="cm-card-image-wrap">
                                                <img src={crop.image} alt={crop.name} className="cm-card-image" />
                                                <span className="cm-card-grade">Grade {crop.grade}</span>
                                            </div>

                                            <div className="cm-card-body">
                                                <div className="cm-card-header">
                                                    <h3 className="cm-card-title">{crop.name}</h3>
                                                    <span className="cm-card-price">৳{crop.price}<small>/{crop.unit}</small></span>
                                                </div>

                                                <div className="cm-card-meta" style={{ marginBottom: '0.5rem' }}>
                                                    <span><Tag size={14} /> {crop.variety}</span>
                                                    <span><MapPin size={14} /> {crop.region}</span>
                                                    <span><Package size={14} /> {crop.sackType}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontWeight: 'bold' }}>
                                                        <Star size={14} fill="#eab308" /> {crop.averageRating.toFixed(1)} ({crop.totalReviews})
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
                                                        <ShieldCheck size={14} /> Trust: {Math.round(crop.trustScore)}
                                                    </div>
                                                </div>

                                                {/* Bulk Deals Tier */}
                                                {crop.bulkDeals.length > 0 && (
                                                    <div className="cm-bulk-deals">
                                                        <h4>Wholesaler Pricing Tiers</h4>
                                                        <ul>
                                                            {crop.bulkDeals.map((deal, idx) => (
                                                                <li key={idx}>Min {deal.minQty} {crop.unit}: <strong>৳{deal.price}</strong>/{crop.unit}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Quality & Disease Notes */}
                                                <div className="cm-quality-notes">
                                                    <div className="cm-note">
                                                        <CheckCircle size={16} color="var(--secondary)" />
                                                        <p><strong>Quality:</strong> {crop.qualityNotes}</p>
                                                    </div>
                                                    <div className="cm-note">
                                                        <AlertCircle size={16} color="var(--primary-main)" />
                                                        <p><strong>Health:</strong> {crop.diseaseNotes}</p>
                                                    </div>
                                                </div>

                                                <div className="cm-card-footer">
                                                    <span className="cm-moisture">Moisture: {crop.moisture}</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="cm-btn-primary"
                                                            onClick={(e) => { e.stopPropagation(); addToCart(crop); showToast('Added to cart successfully!'); }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f59e0b', border: 'none' }}
                                                        >
                                                            <ShoppingCart size={16} /> Add
                                                        </button>
                                                        <button
                                                            className="cm-btn-primary"
                                                            onClick={(e) => handleContact(e, crop.id)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'background-color 0.2s', backgroundColor: 'var(--primary-main)' }}
                                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-main)'}
                                                        >
                                                            <Phone size={16} /> Contact
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCrops.length === 0 && (
                                        <div className="cm-no-results">
                                            <p>No crops match your current filters. Try adjusting them.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* MODALS */}

            {/* Calendar Modal */}
            {calendarOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(52,78,65,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setCalendarOpen(false)}>
                    <div style={{ backgroundColor: 'var(--neutral-bg)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '800px', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                            <h2 style={{ color: 'var(--primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={28} /> Full Harvest Calendar</h2>
                            <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--secondary)' }} onClick={() => setCalendarOpen(false)}>×</button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', justifyContent: 'center', flexShrink: 0 }}>
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => fetchCalendar(m)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '2px solid var(--secondary)',
                                        backgroundColor: calendarMonth === m ? 'var(--primary-main)' : 'white',
                                        color: calendarMonth === m ? 'white' : 'var(--primary-dark)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', minHeight: '200px', overflowY: 'auto' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--primary-dark)', borderBottom: '2px solid var(--accent-soft)', paddingBottom: '0.5rem' }}>Expected Harvests in {calendarMonth}</h3>
                            {calendarLoading ? (
                                <p style={{ textAlign: 'center', color: 'var(--primary-main)', padding: '2rem' }}>Loading season data...</p>
                            ) : calendarData.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--secondary)', padding: '2rem', fontStyle: 'italic' }}>No major crops harvesting this month.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {calendarData.map(c => (
                                        <div key={c.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fcfcfc', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-sm)' }} onClick={() => handleCardClick(c.id)} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', backgroundColor: '#eee', overflow: 'hidden', flexShrink: 0 }}>
                                                {c.image && <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </div>
                                            <div>
                                                <strong style={{ display: 'block', color: 'var(--primary-dark)', fontSize: '1.05rem' }}>{c.name}</strong>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', display: 'block', marginBottom: '4px' }}>Yield: {c.expectedYield}</span>
                                                {c.dates && c.dates.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                        {c.dates.map((d, i) => (
                                                            <span key={i} style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--primary-dark)', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--primary-main)', fontWeight: 600 }}>
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Checkout Modal */}
            <CartCheckoutModal />

            {/* Contact Modal */}
            {contactOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(52,78,65,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setContactOpen(false)}>
                    <div style={{ backgroundColor: 'var(--white)', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: 'var(--primary-dark)', margin: '0 0 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.5rem' }}>
                            Seller Contact Info <button style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: '1.5rem', padding: 0 }} onClick={() => setContactOpen(false)}>×</button>
                        </h3>
                        {sellerLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--primary-main)' }}>Fetching secure contact info...</div>
                        ) : sellerInfo?.error ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'red', backgroundColor: '#ffebe9', borderRadius: '8px' }}>{sellerInfo.error}</div>
                        ) : (
                            <div style={{ textAlign: 'center', margin: '2rem 0', backgroundColor: 'var(--neutral-bg)', padding: '2rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-dark)', marginBottom: '1rem' }}>{sellerInfo?.name || 'Verified Supplier'}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    <Phone size={28} /> {sellerInfo?.phone || 'No phone provided'}
                                </div>
                            </div>
                        )}
                        <button onClick={() => setContactOpen(false)} style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--white)', fontSize: '1.1rem', transition: 'var(--transition)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}>Close Window</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CropMarketplace;
