// LivePriceTicker.jsx — AgriNetwork Bangladesh
// Scrolling market prices banner at the top of the chat page

const MARKET_PRICES = [
    { name: "Rice (Miniket)", price: 58, unit: "৳/kg", change: "+2.1%", up: true },
    { name: "Wheat", price: 32, unit: "৳/kg", change: "-0.8%", up: false },
    { name: "Potato", price: 22, unit: "৳/kg", change: "+1.5%", up: true },
    { name: "Onion", price: 75, unit: "৳/kg", change: "+4.2%", up: true },
    { name: "Tomato", price: 35, unit: "৳/kg", change: "-3.1%", up: false },
    { name: "Mustard", price: 120, unit: "৳/kg", change: "+0.9%", up: true },
    { name: "Lentil (Masur)", price: 98, unit: "৳/kg", change: "-1.2%", up: false },
    { name: "Garlic", price: 180, unit: "৳/kg", change: "+5.0%", up: true },
    { name: "Hilsa Fish", price: 850, unit: "৳/kg", change: "+8.3%", up: true },
    { name: "Jute", price: 3200, unit: "৳/q", change: "-1.5%", up: false },
];

// Duplicate array for seamless infinite scroll
const TICKER_ITEMS = [...MARKET_PRICES, ...MARKET_PRICES];

function LivePriceTicker() {
    return (
        <div className="cn-ticker">
            <div className="cn-ticker__track">
                <div className="cn-ticker__label">
                    <span className="cn-ticker__dot" />
                    Live Market
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                    <div className="cn-ticker__strip">
                        {TICKER_ITEMS.map((item, idx) => (
                            <span key={idx} className="cn-ticker__item">
                                <span className="cn-ticker__item-name">{item.name}</span>
                                <span className="cn-ticker__item-price">{item.price}</span>
                                <span className="cn-ticker__item-unit">{item.unit}</span>
                                <span className={`cn-ticker__item-change ${item.up ? "up" : "down"}`}>
                                    {item.up ? "▲" : "▼"} {item.change}
                                </span>
                                {idx < TICKER_ITEMS.length - 1 && (
                                    <span className="cn-ticker__divider">•</span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LivePriceTicker;
