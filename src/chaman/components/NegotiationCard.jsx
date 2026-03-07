// NegotiationCard.jsx — AgriNetwork Bangladesh
// Offer / Counter-offer / Accepted / Rejected card embedded in the chat

/**
 * Props:
 *  type       : "offer" | "counter" | "accepted" | "rejected"
 *  crop       : string  — e.g. "Premium Rice (Miniket)"
 *  quantity   : string  — e.g. "200 kg"
 *  offerPrice : number  — price being offered
 *  marketPrice: number  — current market reference price
 *  unit       : string  — e.g. "৳/kg"
 *  isSender   : boolean — whether the current user sent this card
 *  onAccept   : fn
 *  onReject   : fn
 *  onCounter  : fn
 */
function NegotiationCard({
    type = "offer",
    crop = "Rice",
    quantity = "100 kg",
    offerPrice = 55,
    marketPrice = 58,
    unit = "৳/kg",
    isSender = false,
    onAccept,
    onReject,
    onCounter,
}) {
    const isResolved = type === "accepted" || type === "rejected";

    const BADGE_LABEL = {
        offer: "💰 Price Offer",
        counter: "🔄 Counter Offer",
        accepted: "✅ Deal Accepted",
        rejected: "❌ Offer Rejected",
    };

    const priceDiff = ((offerPrice - marketPrice) / marketPrice * 100).toFixed(1);
    const diffPositive = offerPrice > marketPrice;

    return (
        <div className={`cn-neg-card ${type}`}>
            {/* Badge */}
            <div className="cn-neg-card__badge">{BADGE_LABEL[type]}</div>

            {/* Crop Info */}
            <div className="cn-neg-card__crop">{crop}</div>
            <div className="cn-neg-card__detail">Quantity: {quantity}</div>

            {/* Price Comparison */}
            <div className="cn-neg-card__prices">
                <div className="cn-neg-card__price-block">
                    <div className="cn-neg-card__price-label">Offer Price</div>
                    <div className="cn-neg-card__price-value">{offerPrice}</div>
                    <div className="cn-neg-card__price-unit">{unit}</div>
                </div>
                <div className="cn-neg-card__arrow">→</div>
                <div className="cn-neg-card__price-block">
                    <div className="cn-neg-card__price-label">Total Value</div>
                    <div className="cn-neg-card__price-value">
                        {(offerPrice * parseInt(quantity)).toLocaleString()}
                    </div>
                    <div className="cn-neg-card__price-unit">৳ total</div>
                </div>
            </div>

            {/* Market Reference */}
            <div className="cn-neg-card__market-ref">
                📊 Market rate: <strong>{marketPrice} {unit}</strong>
                &nbsp;·&nbsp;
                <span style={{ color: diffPositive ? "#c4556a" : "#16a34a", fontWeight: 700 }}>
                    {diffPositive ? `+${priceDiff}%` : `${priceDiff}%`} vs market
                </span>
            </div>

            {/* Actions — only show for pending offers, and only for the receiver */}
            {!isResolved && !isSender && (
                <div className="cn-neg-card__actions">
                    <button className="cn-btn cn-btn--accept cn-btn--sm" onClick={onAccept}>
                        ✓ Accept
                    </button>
                    <button className="cn-btn cn-btn--counter cn-btn--sm" onClick={onCounter}>
                        ↩ Counter
                    </button>
                    <button className="cn-btn cn-btn--reject cn-btn--sm" onClick={onReject}>
                        ✕
                    </button>
                </div>
            )}

            {/* Resolved state label */}
            {isResolved && (
                <div
                    style={{
                        textAlign: "center",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: type === "accepted" ? "#16a34a" : "#dc2626",
                        padding: "6px 0 2px",
                    }}
                >
                    {type === "accepted"
                        ? "You agreed on this price 🎉"
                        : "This offer was declined"}
                </div>
            )}
        </div>
    );
}

export default NegotiationCard;
