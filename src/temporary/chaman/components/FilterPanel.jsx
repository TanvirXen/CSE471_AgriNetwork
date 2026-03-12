// FilterPanel.jsx — AgriNetwork Bangladesh
// Filters for location, crop category, and price range

import { useState } from "react";

function FilterPanel({ onFilterChange }) {
    const [price, setPrice] = useState(500);
    const [showVerified, setShowVerified] = useState(true);

    const handlePriceChange = (e) => {
        setPrice(e.target.value);
        onFilterChange && onFilterChange({ price: e.target.value });
    };

    return (
        <div className="sm-filters">
            <div className="sm-filters__row">
                <div className="sm-filter-group">
                    <label>Category</label>
                    <select className="sm-filter-select" defaultValue="all">
                        <option value="all">All Crops</option>
                        <option value="grains">Grains & Pulses</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="spices">Spices</option>
                    </select>
                </div>
                <div className="sm-filter-group">
                    <label>District</label>
                    <select className="sm-filter-select" defaultValue="all">
                        <option value="all">Everywhere</option>
                        <option value="dhaka">Dhaka</option>
                        <option value="mymensingh">Mymensingh</option>
                        <option value="bogura">Bogura</option>
                        <option value="rajshahi">Rajshahi</option>
                        <option value="sylhet">Sylhet</option>
                    </select>
                </div>
            </div>

            {/* Price Range */}
            <div className="sm-range-wrap">
                <div className="sm-range-labels">
                    <label>Max Price</label>
                    <span>৳ <strong>{price}</strong> /kg</span>
                </div>
                <input
                    type="range"
                    className="sm-range-input"
                    min="10"
                    max="2000"
                    step="10"
                    value={price}
                    onChange={handlePriceChange}
                    style={{ "--range-pct": `${(price / 2000) * 100}%` }}
                />
            </div>

            <div className="sm-toggle-row">
                <div className="sm-toggle-label">
                    <span>✨ Verified Only</span>
                </div>
                <label className="sm-toggle">
                    <input
                        type="checkbox"
                        checked={showVerified}
                        onChange={(e) => setShowVerified(e.target.checked)}
                    />
                    <span className="sm-toggle__track" />
                </label>
            </div>

            <div className="sm-filter-actions">
                <button className="sm-btn sm-btn--ghost" title="Reset filters">
                    Reset
                </button>
                <button className="sm-btn sm-btn--primary">
                    Apply Filters
                </button>
            </div>
        </div>
    );
}

export default FilterPanel;
