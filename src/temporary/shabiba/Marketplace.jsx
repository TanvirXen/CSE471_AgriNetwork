import React, { useState, useEffect } from 'react';
import CategorySidebar from './components/CategorySidebar';

const Marketplace = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSegment, setActiveSegment] = useState('all');
    
    const [products, setProducts] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:5000/api/market';

    useEffect(() => {
        const fetchMarketData = async () => {
            setLoading(true);
            try {
                // 1. Fetch active streams
                const streamsResponse = await fetch(`${API_BASE_URL}/streams`);
                const streamsData = await streamsResponse.json();
                setStreams(streamsData.data || []);

                // 2. Build filtered URL for products
                let productUrl = `${API_BASE_URL}/products`;
                const params = new URLSearchParams();
                
                if (activeCategory !== 'all') params.append('category', activeCategory.toLowerCase());
                if (activeSegment !== 'all') params.append('segment', activeSegment.toLowerCase());
                
                if (params.toString()) {
                    productUrl += `?${params.toString()}`;
                }

                // 3. Fetch filtered products
                const productsResponse = await fetch(productUrl);
                const productsData = await productsResponse.json();
                setProducts(productsData.data || []);
                
            } catch (error) {
                console.error("Error fetching marketplace data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();
    }, [activeCategory, activeSegment]);

    return (
        <div style={{ display: 'flex', gap: '20px', padding: '20px', background: '#eef6f0', minHeight: '100vh', fontFamily: 'system-ui' }}>
            <CategorySidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                activeSegment={activeSegment}
                setActiveSegment={setActiveSegment}
            />

            <main style={{ flexGrow: 1 }}>
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{ color: '#0f172a', margin: '0 0 5px 0' }}>Shabiba Marketplace</h1>
                    <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                        <span>Current View: <strong>{activeCategory}</strong></span>
                        <span>|</span>
                        <span>Segment: <strong>{activeSegment}</strong></span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b', fontSize: '1.2rem' }}>
                        <div className="spinner" style={{ marginBottom: '10px' }}>⌛</div>
                        Loading Marketplace Data...
                    </div>
                ) : (
                    <>
                        {/* Live Section */}
                        {streams.length > 0 && (
                            <section style={{ marginBottom: '40px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c' }}>
                                    <span style={{ color: '#ef4444', animation: 'pulse 2s infinite' }}>●</span> Live From the Farm
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {streams.map(stream => (
                                        <div key={stream._id || stream.id} style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                            <img src={stream.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Stream" />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}></div>
                                            <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'white' }}>
                                                <h4 style={{ margin: 0 }}>{stream.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{stream.viewers} watching</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Product Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
                            {products.map(product => (
                                <div key={product._id || product.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}>
                                    <div style={{ height: '180px', position: 'relative' }}>
                                        <img 
                                            src={product.image} 
                                            alt={product.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Agro+Product"; }} 
                                        />
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', color: '#1e293b' }}>
                                            Grade {product.quality}
                                        </div>
                                        {product.isLive && (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>LIVE</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ color: '#059669', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{product.segment}</div>
                                        <h4 style={{ margin: '5px 0', fontSize: '1rem', color: '#1e293b' }}>{product.name}</h4>
                                        <div style={{ color: '#047857', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>৳{product.price?.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem' }}>🔍</div>
                                <h3>No products found</h3>
                                <p>Try adjusting your category or segment filters.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .spinner { animation: rotate 2s linear infinite; display: inline-block; font-size: 2rem; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Marketplace;