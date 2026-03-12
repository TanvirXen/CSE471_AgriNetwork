// SearchMapPage.jsx — AgriNetwork Bangladesh
// Full Search, Discovery & Map page (UI Only)

import { useState } from "react";
import "./SearchMap.css";

import SearchBar from "./components/SearchBar";
import MapView, { MAP_MARKERS } from "./components/MapView";
import FilterPanel from "./components/FilterPanel";
import ResultsList from "./components/ResultsList";

function SearchMapPage() {
    const [results, setResults] = useState(MAP_MARKERS);
    const [selectedId, setSelectedId] = useState(null);
    const [activeLayer, setActiveLayer] = useState("all");
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'map' for mobile

    const handleSearch = (query) => {
        if (!query) {
            setResults(MAP_MARKERS);
            return;
        }
        const filtered = MAP_MARKERS.filter(
            (m) =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.crop.toLowerCase().includes(query.toLowerCase()) ||
                m.district.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
    };

    const handleSelectResult = (item) => {
        setSelectedId(item.id);
    };

    return (
        <div className="sm-page">
            {/* Top Header / Search Section */}
            <header className="sm-topbar">
                <div className="sm-topbar__title-row">
                    <div className="sm-topbar__brand">
                        <div className="sm-topbar__icon">🗺️</div>
                        <div>
                            <div className="sm-topbar__heading">AgriDiscovery Map</div>
                            <div className="sm-topbar__sub">Find nearby farmers, vendors & markets</div>
                        </div>
                    </div>

                    <div className="sm-topbar__stats">
                        <div className="sm-stat-pill">
                            <span className="sm-stat-pill__dot" />
                            1.2k Live Farmers
                        </div>
                        <div className="sm-stat-pill">
                            ⭐ 4.8 Top Rated
                        </div>
                    </div>
                </div>

                {/* Global Search */}
                <SearchBar onSearch={handleSearch} />

                {/* Categories Chips */}
                <div className="sm-chips">
                    {["All", "Grains", "Vegetables", "Fruits", "Spices", "Fish"].map((cat) => (
                        <button
                            key={cat}
                            className={`sm-chip ${cat === "All" ? "active" : "inactive"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Body */}
            <main className="sm-body">
                {/* Left: Filters + List */}
                <aside className={`sm-left ${viewMode === "map" ? "mob-hidden" : ""}`}>
                    <FilterPanel onFilterChange={(f) => console.log("Filter changed:", f)} />
                    <ResultsList
                        results={results}
                        selectedId={selectedId}
                        onSelectResult={handleSelectResult}
                    />
                </aside>

                {/* Right: Map */}
                <section className={`sm-map-panel ${viewMode === "list" ? "mob-hidden" : ""}`}>
                    {/* Map Layer Controls */}
                    <div className="sm-map-layer-btn">
                        {["all", "farmer", "vendor", "market"].map((layer) => (
                            <button
                                key={layer}
                                className={`sm-map-layer-pill ${activeLayer === layer ? "active" : ""}`}
                                onClick={() => setActiveLayer(layer)}
                            >
                                {layer.charAt(0).toUpperCase() + layer.slice(1)}s
                            </button>
                        ))}
                    </div>

                    {/* Map Controls */}
                    <div className="sm-map-controls">
                        <button className="sm-map-btn" title="Zoom in">+</button>
                        <button className="sm-map-btn" title="Zoom out">−</button>
                        <button className="sm-map-btn" title="My Location">🧭</button>
                        <button className="sm-map-btn" title="Fullscreen">⛶</button>
                    </div>

                    {/* Map Legend */}
                    <div className="sm-map-legend">
                        <div className="sm-legend-title">Legend</div>
                        <div className="sm-legend-item">
                            <span className="sm-legend-dot" style={{ background: "var(--sm-sage)" }} />
                            Farmers
                        </div>
                        <div className="sm-legend-item">
                            <span className="sm-legend-dot" style={{ background: "#c4556a" }} />
                            Vendors
                        </div>
                        <div className="sm-legend-item">
                            <span className="sm-legend-dot" style={{ background: "var(--sm-main)" }} />
                            Wholesale Markets
                        </div>
                    </div>

                    {/* Result count overlay for map */}
                    <div className="sm-map-info">
                        🟢 Found {results.length} results in Bangladesh
                    </div>

                    {/* Map Component */}
                    <MapView
                        markers={results}
                        selectedId={selectedId}
                        onSelectMarker={handleSelectResult}
                        activeLayer={activeLayer}
                    />
                </section>
            </main>

            {/* Mobile Toggle Bar */}
            <footer className="sm-mob-toggle-bar">
                <button
                    className={`sm-mob-view-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                >
                    📋 List View
                </button>
                <button
                    className={`sm-mob-view-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => setViewMode("map")}
                >
                    📍 Map View
                </button>
            </footer>
        </div>
    );
}

export default SearchMapPage;
