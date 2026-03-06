import React from 'react';

const LiveStreamCard = ({ stream, onJoin }) => {
    const { title, viewers, host, thumbnail, tags } = stream;

    return (
        <div className="live-card">
            <img src={thumbnail} alt={title} className="product-image" style={{ height: '100%' }} />
            <div className="live-overlay">
                <div className="live-badge">
                    <span className="dot" style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></span>
                    LIVE
                </div>
                <div style={{ color: 'white' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{title}</h3>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Host: {host} • {viewers} watching</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        {tags.map(tag => (
                            <span key={tag} style={{
                                padding: '2px 8px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                fontSize: '0.7rem'
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => onJoin(stream)}
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            background: 'var(--accent-soft)',
                            color: 'var(--primary-dark)',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Join Stream
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveStreamCard;
