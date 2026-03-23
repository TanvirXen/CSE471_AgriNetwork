// ResultCard.jsx — AgriNetwork Bangladesh
// Individual result card for a farmer, vendor, or market

function ResultCard({ item, isSelected, onClick, onChat, onViewDetails }) {
    const {
        type,
        name,
        crop,
        price,
        unit,
        district,
        rating,
        stock,
        isVerified = true,
        isNew = false,
    } = item;

    const handleChatClick = (e) => {
        e.stopPropagation();
        onChat && onChat(item);
    };

    const handleDetailsClick = (e) => {
        e.stopPropagation();
        onViewDetails && onViewDetails(item);
    };

    return (
        <div
            className={`sm-card ${isSelected ? "selected" : ""}`}
            onClick={() => onClick && onClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onClick && onClick(item)}
        >
            <div className="sm-card__header">
                <div className={`sm-card__avatar ${type}`}>
                    {type === "farmer" ? "🌾" : type === "vendor" ? "🏪" : "🏬"}
                    {isVerified && (
                        <span className="sm-card__avatar-badge verified" title="Verified Safe">
                            ✔
                        </span>
                    )}
                    {isNew && (
                        <span className="sm-card__avatar-badge new" title="New Member">
                            ★
                        </span>
                    )}
                </div>
                <div className="sm-card__info">
                    <div className="sm-card__name">{name}</div>
                    <div className="sm-card__meta">
                        <span className="sm-card__loc-icon">📍</span>
                        {district}
                        <span className={`sm-card__type-tag ${type}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="sm-card__products">
                {crop.split(", ").map((c, i) => (
                    <span key={i} className={`sm-product-tag ${i === 0 ? "highlight" : ""}`}>
                        {c}
                    </span>
                ))}
            </div>

            <div className="sm-card__stats">
                {price > 0 ? (
                    <div className="sm-card__price">
                        <span className="sm-card__price-label">Starting from</span>
                        <div className="sm-card__price-value">
                            ৳ {price}
                            <span className="sm-card__price-unit"> {unit}</span>
                        </div>
                    </div>
                ) : (
                    <div className="sm-card__price">
                        <span className="sm-card__price-label">Contact for</span>
                        <div className="sm-card__price-value">Market Rate</div>
                    </div>
                )}

                <div className="sm-card__rating">⭐ {rating}</div>

                <div className={`sm-card__avail ${stock}`}>
                    {stock === "in-stock" ? "Ready" : stock === "limited" ? "Low Stock" : "Out"}
                </div>
            </div>

            {isSelected && (
                <div className="sm-card__action">
                    <button className="sm-btn sm-btn--primary" onClick={handleDetailsClick}>View Details</button>
                    <button className="sm-btn sm-btn--ghost" onClick={handleChatClick}>💬 Chat</button>
                </div>
            )}
        </div>
    );
}

export default ResultCard;
