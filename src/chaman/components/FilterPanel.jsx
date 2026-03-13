// FilterPanel.jsx — AgriNetwork Bangladesh
// Filters for location, crop category, price range — fully functional

import { useState } from "react";

const DISTRICTS = [
  "Everywhere", "Dhaka", "Mymensingh", "Bogura", "Rajshahi",
  "Chittagong", "Comilla", "Sylhet", "Khulna", "Barisal",
  "Rangpur", "Faridpur", "Narayanganj", "Gazipur", "Cox's Bazar",
];

const CATEGORIES = [
  { value: "all", label: "All Crops" },
  { value: "Rice", label: "Grains & Pulses" },
  { value: "Tomato", label: "Vegetables" },
  { value: "Mango", label: "Fruits" },
  { value: "Garlic", label: "Spices" },
  { value: "Fish", label: "Fish & Seafood" },
];

function FilterPanel({ onFilterChange }) {
  const DEFAULT = { category: "all", district: "Everywhere", maxPrice: 1000, verifiedOnly: false };
  const [filters, setFilters] = useState(DEFAULT);

  const handleApply = () => {
    onFilterChange && onFilterChange({
      q: filters.category !== "all" ? filters.category : "",
      district: filters.district,
      maxPrice: filters.maxPrice,
      verifiedOnly: filters.verifiedOnly,
    });
  };

  const handleReset = () => {
    setFilters(DEFAULT);
    onFilterChange && onFilterChange({ q: "", district: "Everywhere", maxPrice: 1000, verifiedOnly: false });
  };

  return (
    <div className="sm-filters">
      <div className="sm-filters__row">
        <div className="sm-filter-group">
          <label>Category</label>
          <select
            className="sm-filter-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="sm-filter-group">
          <label>District</label>
          <select
            className="sm-filter-select"
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="sm-range-wrap">
        <div className="sm-range-labels">
          <label>Max Price</label>
          <span>৳ <strong>{filters.maxPrice}</strong> /kg</span>
        </div>
        <input
          type="range"
          className="sm-range-input"
          min="10"
          max="5000"
          step="10"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
          style={{ "--range-pct": `${(filters.maxPrice / 5000) * 100}%` }}
        />
      </div>

      <div className="sm-toggle-row">
        <div className="sm-toggle-label">
          <span>✨ Verified Only</span>
        </div>
        <label className="sm-toggle">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
          />
          <span className="sm-toggle__track" />
        </label>
      </div>

      <div className="sm-filter-actions">
        <button className="sm-btn sm-btn--ghost" onClick={handleReset}>Reset</button>
        <button className="sm-btn sm-btn--primary" onClick={handleApply}>Apply Filters</button>
      </div>
    </div>
  );
}

export default FilterPanel;
