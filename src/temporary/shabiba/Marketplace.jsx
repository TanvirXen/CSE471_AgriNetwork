import React, { useState, useEffect, useRef } from 'react';
import CategorySidebar from './components/CategorySidebar';
import { useAuth } from '../../context/AuthContext';
import { buildApiUrl } from '../../config/network';

import './Marketplace.css';

const Marketplace = () => {
    const { user } = useAuth();
    const videoRef = useRef(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [dbStreamId, setDbStreamId] = useState(null);
    const [cameraError, setCameraError] = useState(false);

    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSegment, setActiveSegment] = useState('all');
    
    const [products, setProducts] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStream, setActiveStream] = useState(null);
    const [liveViewerCount, setLiveViewerCount] = useState(0);
    const [chatInput, setChatInput] = useState('');

    const API_BASE_URL = buildApiUrl('/api/market');

    const handleStreamClick = async (stream) => {
        // Optimistically open modal
        setActiveStream(stream);
        try {
            const streamId = stream._id || stream.id;
            const response = await fetch(`${API_BASE_URL}/streams/${streamId}`);
            const data = await response.json();
            if (data.success) {
                // Update with full stream details (URL, chat)
                setActiveStream(data.data);
            }
        } catch (error) {
            console.error("Error fetching stream details:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !activeStream) return;

        let userString = "You";
        let textToSend = chatInput;
        let payloadBidAmount = null;

        // If message starts with a number, treat as a bid
        const isBid = /^\d+/.test(chatInput.trim());
        if (isBid) {
            const bidAmount = parseInt(chatInput.trim().match(/^\d+/)[0], 10);
            payloadBidAmount = bidAmount;
            
            userString = "You (System Bid)";
            textToSend = `Placed a bid of ৳${bidAmount.toLocaleString()}`;
            // If they typed more than just the number, append it visually
            if (chatInput.trim().length > bidAmount.toString().length) {
                textToSend += ` - ${chatInput.replace(/^\d+\s*/, '')}`;
            }
        }

        try {
            const streamId = activeStream._id || activeStream.id;
            const res = await fetch(`${API_BASE_URL}/streams/${streamId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: userString, text: textToSend, bidAmount: payloadBidAmount })
            });
            const data = await res.json();
            
            if (data.success) {
                // Instantly re-hydrate frontend modal with complete saved DB object!
                setActiveStream(data.data);
            }
        } catch (error) {
            console.error('Error posting chat message:', error);
        }
        
        setChatInput('');
    };

    const startVendorBroadcast = async () => {
        try {
            setCameraError(false);

            // STEP 1: Sync eagerly with MongoDB Atlas to initialize the chat room, initially hiding the 'Live' red badge
            const resInit = await fetch(`${API_BASE_URL}/streams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${user?.fullName?.split(' ')[0] || 'Vendor'}'s Farm Live Session`,
                    host: user?.fullName || 'Agri Vendor',
                    vendorId: user?._id || user?.id,
                    viewers: '0',
                    image: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80&w=600',
                    isLive: false
                })
            });
            const dataInit = await resInit.json();
            
            if (dataInit.success && dataInit.data) {
                const initStreamId = dataInit.data._id;
                setDbStreamId(initStreamId);
                setActiveStream(dataInit.data); // Open unified modal instantly for vendor
                setIsBroadcasting(true);
                
                // STEP 2: Request hardware natively
                setTimeout(async () => {
                   try {
                       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                           setCameraError(true);
                           return;
                       }
                       const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                       
                       if (videoRef.current) {
                           videoRef.current.srcObject = mediaStream;
                       }

                       // STEP 3: Camera succeeded! Tell MongoDB to go live instantly so Buyers see it!
                       const resLive = await fetch(`${API_BASE_URL}/streams`, {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                               title: `${user?.fullName?.split(' ')[0] || 'Vendor'}'s Farm Live Session`,
                               vendorId: user?._id || user?.id,
                               isLive: true
                           })
                       });
                       const dataLive = await resLive.json();
                       if (dataLive.success) setActiveStream(dataLive.data);

                   } catch (webrtcErr) {
                       console.warn("WebRTC Error: ", webrtcErr.message);
                       setCameraError(true);
                   }
                }, 300);
            }
        } catch (err) {
            console.error("Critical Stream Init Error: ", err.message);
        }
    };

    const endVendorBroadcast = async () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsBroadcasting(false);
        setActiveStream(null);

        if (dbStreamId) {
            try {
               await fetch(`${API_BASE_URL}/streams/${dbStreamId}/end`, { method: 'POST' });
               setDbStreamId(null);
               // Rerender streams list silently
               const res = await fetch(`${API_BASE_URL}/streams`);
               const d = await res.json();
               setStreams(d.data || []);
            } catch (_err) { /* ignore stop-stream errors silently */ }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    // Fluctuating viewer count simulation
    useEffect(() => {
        if (activeStream) {
            // Set base count safely bridging numerical logic from dynamic 'k' text
            let baseCount = 0;
            if (activeStream.viewers) {
                const viewerStr = String(activeStream.viewers).toLowerCase();
                if (viewerStr.includes('k')) {
                    baseCount = parseFloat(viewerStr) * 1000;
                } else {
                    baseCount = parseInt(viewerStr, 10) || 0;
                }
            }
            // Only overwrite if it significantly drifts to prevent jittering on backend fetch overlaps
            setLiveViewerCount(prev => prev > 0 && Math.abs(prev - baseCount) < 50 ? prev : baseCount);

            const interval = setInterval(() => {
                setLiveViewerCount(prev => {
                    const fluctuation = Math.floor(Math.random() * 7) - 3; // range: -3 to +3
                    return prev + fluctuation > 0 ? prev + fluctuation : 0;
                });
            }, 3500);

            return () => clearInterval(interval);
        }
    }, [activeStream]);

    // Real-time synchronization polling algorithm
    useEffect(() => {
        let pollInterval;
        if (activeStream && (activeStream._id || activeStream.id)) {
            const streamId = activeStream._id || activeStream.id;
            pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/streams/${streamId}`);
                    const data = await response.json();
                    if (data.success) {
                        // Soft update without jarring the cursor context
                        setActiveStream(data.data);
                    }
                } catch (_error) {
                    // Fail silently to avoid interrupting viewing experience during blips
                }
            }, 3000);
        }
        return () => clearInterval(pollInterval);
    }, [activeStream?._id, activeStream?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch active stream catalogue consistently
    useEffect(() => {
        const fetchStreams = async () => {
            try {
                const streamsResponse = await fetch(`${API_BASE_URL}/streams`);
                const streamsData = await streamsResponse.json();
                
                // Only filter isLive streams dynamically for the UI 
                const activeOnes = (streamsData.data || []).filter(s => s.isLive !== false);
                setStreams(activeOnes);
            } catch (_error) {
                // Fail silently
            }
        };
        fetchStreams();
        const globalStreamInterval = setInterval(fetchStreams, 4500); // 4.5s overall market state sync
        return () => clearInterval(globalStreamInterval);
    }, []);

    // Fetch products whenever category or segment changes
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let productUrl = `${API_BASE_URL}/products`;
                const params = new URLSearchParams();
                
                if (activeCategory !== 'all') params.append('category', activeCategory.toLowerCase());
                if (activeSegment !== 'all') params.append('segment', activeSegment.toLowerCase());
                
                if (params.toString()) {
                    productUrl += `?${params.toString()}`;
                }

                const productsResponse = await fetch(productUrl);
                const productsData = await productsResponse.json();
                setProducts(productsData.data || []);
                
            } catch (error) {
                console.error("Error fetching marketplace products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeCategory, activeSegment]);

    return (
        <div style={{ display: 'flex', background: '#f8f9fa', minHeight: '100vh', fontFamily: 'inherit' }}>
            <CategorySidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                activeSegment={activeSegment}
                setActiveSegment={setActiveSegment}
            />

            <main style={{ flexGrow: 1, padding: '2rem', overflowX: 'hidden' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ color: '#2d4a3e', margin: '0 0 5px 0', fontSize: '1.75rem', fontWeight: '800' }}>Shabiba Marketplace</h1>
                    <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                        <span>Current View: <strong>{activeCategory}</strong></span>
                        <span>|</span>
                        <span>Segment: <strong>{activeSegment}</strong></span>
                    </div>
                </div>

                {/* Live Section (Always at top) */}
                <section style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', margin: 0, fontSize: '1.2rem' }}>
                            <span style={{ color: '#ef4444', animation: 'pulse 2s infinite' }}>●</span> Live From the Farm
                        </h3>
                        {user?.role?.toLowerCase() === 'vendor' && (
                            <button 
                                onClick={startVendorBroadcast}
                                style={{ background: '#059669', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '5px' }}
                                onMouseOver={(e) => e.target.style.background = '#047857'}
                                onMouseOut={(e) => e.target.style.background = '#059669'}
                            >
                                <span style={{ fontSize: '1.1rem' }}>📹</span> Start My Live Session
                            </button>
                        )}
                    </div>
                    {streams.length > 0 ? (
                        <div className="streams-scroll-container" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '15px' }}>
                            {streams.map(stream => (
                                <div 
                                    key={stream._id || stream.id} 
                                    onClick={() => handleStreamClick(stream)}
                                    style={{ minWidth: '300px', flexShrink: 0, height: '200px', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-sm, 0 4px 6px -1px rgba(0,0,0,0.1))', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <img src={stream.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Stream" />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}></div>
                                    
                                    {/* LIVE BADGE WITH PULSING DOT */}
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(4px)' }}>
                                        <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                                        LIVE
                                    </div>

                                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'white' }}>
                                        <h4 style={{ margin: 0 }}>{stream.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{stream.viewers} watching</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '30px', background: 'white', borderRadius: '16px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                            No active live sessions currently. Check back later or start your own!
                        </div>
                    )}
                </section>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b', fontSize: '1.2rem' }}>
                        <div className="spinner" style={{ marginBottom: '10px' }}>⌛</div>
                        Loading Marketplace Data...
                    </div>
                ) : (
                    <>
                        {/* Product Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                            {products.map(product => (
                                <div key={product._id || product.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid transparent', boxShadow: 'var(--shadow-sm, 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06))', transition: 'all 0.3s ease' }}
                                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 10px 15px -3px rgba(0,0,0,0.1))'; }}
                                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 4px 6px -1px rgba(0,0,0,0.1))'; }}
                                >
                                    <div style={{ height: '180px', position: 'relative' }}>
                                        <img 
                                            src={product.image} 
                                            alt={product.name} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Agro+Product"; }} 
                                        />
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: '#2d4a3e' }}>
                                            Grade {product.quality}
                                        </div>
                                        {product.isLive && (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>LIVE</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ color: '#588157', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>{product.segment}</div>
                                        <h4 style={{ margin: '8px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: '700' }}>{product.name}</h4>
                                        <div style={{ color: '#3a5a40', fontWeight: '800', fontSize: '1.25rem', marginTop: '12px' }}>৳{product.price?.toLocaleString()}</div>
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

            {/* Live Stream Modal */}
            {activeStream && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '1000px', height: '80vh', borderRadius: '16px', display: 'flex', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <button onClick={() => isBroadcasting ? endVendorBroadcast() : setActiveStream(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        
                        {/* Video Area Placeholder */}
                        <div style={{ flex: '2', background: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 5, display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', animation: 'pulse 2s infinite', boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>
                                    <span style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                                    LIVE
                                </div>
                                <div style={{ color: 'white', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ color: '#ef4444' }}>👁</span> 
                                    <strong style={{ minWidth: '40px', textAlign: 'center' }}>
                                        {liveViewerCount >= 1000 ? (liveViewerCount / 1000).toFixed(1) + 'k' : liveViewerCount}
                                    </strong> watching
                                </div>
                            </div>
                            
                            {isBroadcasting && activeStream.vendorId === (user?._id || user?.id) ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f172a' }}>
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    {cameraError && (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', background: 'rgba(0,0,0,0.85)' }}>
                                            <span style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</span>
                                            <strong style={{ fontSize: '1.2rem', color: 'white' }}>Camera Access Required</strong>
                                            <span>Camera is required to go live. Audio & Text Chat active.</span>
                                        </div>
                                    )}
                                </div>
                            ) : activeStream.streamUrl ? (
                                <iframe 
                                    style={{ width: '100%', height: '100%', border: 'none', background: 'black' }}
                                    src={`${activeStream.streamUrl}?autoplay=1&mute=1`}
                                    title="Live Stream"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <>
                                    <img src={activeStream.image} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} alt="Stream background" />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                                            <span style={{ fontSize: '2rem', color: 'white', marginLeft: '6px' }}>▶</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Chat / Bidding Sidebar */}
                        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: '#f8fafc', minWidth: '300px' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.2rem' }}>{activeStream.title}</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Host: <strong>{activeStream.host || 'Agro Farmer'}</strong></p>
                                {activeStream.currentBid > 0 && (
                                    <div style={{ marginTop: '15px', background: '#ecfdf5', color: '#047857', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #a7f3d0', animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>🏆</span>
                                            <span>Current High Bid:</span>
                                        </div>
                                        <span style={{ fontSize: '1.2rem' }}>৳{activeStream.currentBid.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', margin: '0 0 10px 0' }}>Welcome to the live chat/bidding room!</p>
                                {activeStream.chatMessages && activeStream.chatMessages.length > 0 ? (
                                    activeStream.chatMessages.map((msg, index) => {
                                        const isSystemOrBid = msg.user.toLowerCase().includes('bid');
                                        return (
                                            <div key={index} style={{ background: isSystemOrBid ? '#f0fdf4' : 'white', padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: isSystemOrBid ? '#bbf7d0' : '#e2e8f0' }}>
                                                <strong style={{ color: isSystemOrBid ? '#16a34a' : '#059669', fontSize: '0.9rem' }}>{msg.user}:</strong> 
                                                <span style={{ fontSize: '0.9rem', color: isSystemOrBid ? '#15803d' : '#334155', fontWeight: isSystemOrBid ? 'bold' : 'normal', marginLeft: '5px' }}>{msg.text}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: '20px' }}>Loading chat or no messages yet...</div>
                                )}
                            </div>

                            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    placeholder="Type a message or bid (e.g. '500')..." 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}
                                    onMouseOver={(e) => e.target.style.background = '#047857'}
                                    onMouseOut={(e) => e.target.style.background = '#059669'}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .spinner { animation: rotate 2s linear infinite; display: inline-block; font-size: 2rem; }
                @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .streams-scroll-container::-webkit-scrollbar { height: 8px; }
                .streams-scroll-container::-webkit-scrollbar-track { background: #eef6f0; border-radius: 4px; }
                .streams-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .streams-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default Marketplace;
