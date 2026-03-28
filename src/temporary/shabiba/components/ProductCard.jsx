import React from 'react';

const ProductCard = ({ product, onBuy }) => {
    const { name, category, price, quality, image, tag, isLive } = product;

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={image} alt={name} className="product-image" loading="lazy" />
                <div className="quality-badge">Grade {quality}</div>
                {(tag || isLive) && (
                    <div className="tag-overlay" style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: isLive ? '#ff4757' : 'var(--primary-main)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {isLive && <span className="live-dot-blink"></span>}
                        {isLive ? 'Live' : tag}
                    </div>
                )}
            </div>
            <div className="product-info">
                <div className="product-category" style={{ textTransform: 'capitalize' }}>{category}</div>
                <h3 className="product-name">{name}</h3>
                <div className="product-price-row">
                    <div className="product-price">৳{price.toLocaleString()}</div>
                    <button className="buy-btn" onClick={() => onBuy(product)}>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
