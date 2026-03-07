import React from 'react';

const ProductCard = ({ product, onBuy }) => {
    const { name, category, price, quality, image, tag } = product;

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={image} alt={name} className="product-image" />
                <div className="quality-badge">Grade {quality}</div>
                {tag && (
                    <div className="tag-overlay" style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'var(--primary-main)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                    }}>
                        {tag}
                    </div>
                )}
            </div>
            <div className="product-info">
                <div className="product-category">{category}</div>
                <h3 className="product-name">{name}</h3>
                <div className="product-price-row">
                    <div className="product-price">৳{price}</div>
                    <button className="buy-btn" onClick={() => onBuy(product)}>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
