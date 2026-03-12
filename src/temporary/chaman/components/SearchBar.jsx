// SearchBar.jsx — AgriNetwork Bangladesh
// Search bar with suggestions dropdown

import { useState } from "react";

const SUGGESTIONS = [
    { id: 1, type: "crop", name: "Rice (Miniket)", sub: "Major crop in Mymensingh, Bogura" },
    { id: 2, type: "farmer", name: "Rahim Uddin", sub: "Farmer in Mymensingh · Rice, Wheat" },
    { id: 3, type: "location", name: "Bogura Haat", sub: "Wholesale Market · Bogura District" },
    { id: 4, type: "crop", name: "Potato (Diamond)", sub: "Available in Dhaka, Rangpur" },
    { id: 5, type: "vendor", name: "Dhaka Fresh Ltd.", sub: "Vendor in Dhaka · Potato, Onion" },
];

function SearchBar({ onSearch }) {
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = query
        ? SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        : [];

    const handleSearch = (e) => {
        e?.preventDefault();
        onSearch && onSearch(query);
        setShowSuggestions(false);
    };

    const handleSelectSuggestion = (s) => {
        setQuery(s.name);
        setShowSuggestions(false);
        onSearch && onSearch(s.name);
    };

    return (
        <div className="sm-search-wrap">
            <form className="sm-search-box" onSubmit={handleSearch}>
                <span className="sm-search-icon">🔍</span>
                <input
                    className="sm-search-input"
                    placeholder="Search for crops, farmers, or markets..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {query && (
                    <button
                        type="button"
                        className="sm-search-clear"
                        onClick={() => setQuery("")}
                        title="Clear"
                    >
                        ✕
                    </button>
                )}
                <button type="submit" className="sm-search-btn">
                    Find Now
                </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="sm-suggestions">
                    {filteredSuggestions.map((s) => (
                        <div
                            key={s.id}
                            className="sm-suggestion-item"
                            onClick={() => handleSelectSuggestion(s)}
                        >
                            <div className="sm-suggestion-item__icon">
                                {s.type === "crop" ? "🌾" : s.type === "farmer" ? "👤" : "📍"}
                            </div>
                            <div>
                                <div className="sm-suggestion-item__main">{s.name}</div>
                                <div className="sm-suggestion-item__sub">{s.sub}</div>
                            </div>
                            <span className="sm-suggestion-item__tag">{s.type}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
