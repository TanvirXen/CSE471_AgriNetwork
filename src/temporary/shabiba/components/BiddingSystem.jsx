import React, { useState, useEffect } from 'react';

const BiddingSystem = ({ product, onClose }) => {
    const [bidAmount, setBidAmount] = useState(product.price + 100);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bidding-modal">
            <div className="bidding-content">
                <h2 style={{ color: 'var(--primary-dark)' }}>Live Bidding</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Bulk {product.name} (Lot #1024)</p>

                <div className="timer-box">
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>Time Remaining</div>
                    {formatTime(timeLeft)}
                </div>

                <div style={{ textAlign: 'left', background: 'var(--neutral-bg)', padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Current Bid:</span>
                        <span style={{ fontWeight: '700', color: 'var(--primary-main)' }}>৳{product.price}</span>
                    </div>
                </div>

                <div className="bid-input-group">
                    <input
                        type="number"
                        className="bid-input"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <button style={{
                        background: 'var(--primary-main)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0 24px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}>
                        Place Bid
                    </button>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: '24px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Cancel and return
                </button>
            </div>
        </div>
    );
};

export default BiddingSystem;
