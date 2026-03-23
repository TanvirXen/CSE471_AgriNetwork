// SearchMapPage.jsx — AgriNetwork Bangladesh
// Full Search, Discovery & Map page — Connected to Backend

import { useState, useEffect, useCallback } from "react";
import "./SearchMap.css";

import MapView from "./components/MapView";
import FilterPanel from "./components/FilterPanel";
import ResultsList from "./components/ResultsList";
import DetailModal from "./components/DetailModal";

import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Transform backend listing to frontned marker format
function listingToMarker(l) {
    return {
        id: l._id,
        name: l.title.split(" - ")[0] || l.title,
        type: l.type,
        district: l.district,
        crop: Array.isArray(l.crops) ? l.crops.join(", ") : "",
        price: l.price || 0,
        unit: l.unit || "৳/kg",
        rating: l.rating || 4.0,
        stock: l.stockStatus || "in-stock",
        isVerified: l.isVerified || false,
        lat: l.location?.coordinates[1] || 23.8103,
        lng: l.location?.coordinates[0] || 90.4125,
        userId: l.user?._id || l.user,
        phone: l.user?.phone || "",
        description: l.description || "",
        memberSince: l.createdAt,
    };
}

function SearchMapPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";

    const [allMarkers, setAllMarkers] = useState([]);
    const [results, setResults] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [activeLayer, setActiveLayer] = useState("all");
    const [viewMode, setViewMode] = useState("list");
    const [detailItem, setDetailItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        maxPrice: 500,
        district: "Everywhere",
        category: "All Crops",
        verifiedOnly: true,
    });

    // Fetch listings from backend
    const fetchListings = useCallback(async (searchFilters = {}) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            // Priority: URL query 'q' OR filter search 'q'
            const finalQ = searchFilters.q || query;
            if (finalQ) params.append("q", finalQ);

            if (searchFilters.type && searchFilters.type !== "all") params.append("type", searchFilters.type);
            if (searchFilters.district && searchFilters.district !== "Everywhere") params.append("district", searchFilters.district);
            if (searchFilters.maxPrice) params.append("maxPrice", searchFilters.maxPrice);
            if (searchFilters.verifiedOnly) params.append("verified", "true");

            const res = await fetch(`${API_BASE}/api/discovery/listings?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const markers = data.map(listingToMarker);
            setAllMarkers(markers);
            setResults(markers);
        } catch (err) {
            console.error("Failed to load listings:", err);
        } finally {
            setLoading(false);
        }
    }, [query]);

    // On mount or query change: seed and fetch
    useEffect(() => {
        (async () => {
            try {
                // Trigger seeding if DB is empty
                await fetch(`${API_BASE}/api/discovery/seed`);
            } catch (_) { }
            await fetchListings();
        })();
    }, [fetchListings, query]);

    const handleSearch = (query) => {
        if (!query) {
            setResults(allMarkers);
            return;
        }
        const q = query.toLowerCase();
        setResults(
            allMarkers.filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.crop.toLowerCase().includes(q) ||
                    m.district.toLowerCase().includes(q)
            )
        );
    };

    const handleFilterChange = (f) => {
        setFilters((prev) => ({ ...prev, ...f }));
        fetchListings({ ...filters, ...f });
    };

    const handleLayerChange = (layer) => {
        setActiveLayer(layer);
        if (layer === "all") {
            setResults(allMarkers);
        } else {
            setResults(allMarkers.filter((m) => m.type === layer));
        }
    };

    const handleSelectResult = (item) => {
        setSelectedId(item.id);
    };

    const handleChatRedirect = (item) => {
        navigate("/dashboard/messages", { state: { startChatWith: item } });
    };

    const handleViewDetails = (item) => {
        setDetailItem(item);
    };

    return (
        <div className="sm-page">
            {/* Top Header */}
            <header className="sm-topbar">
                <div className="sm-topbar__title-row">
                    <div className="sm-topbar__brand">
                        <div className="sm-topbar__icon">🗺️</div>
                        <div>
                            <div className="sm-topbar__heading">AgriDiscovery Map</div>
                            <div className="sm-topbar__sub">Find nearby farmers, vendors &amp; markets</div>
                        </div>
                    </div>

                    <div className="sm-topbar__stats">
                        <div className="sm-stat-pill">
                            <span className="sm-stat-pill__dot" />
                            {allMarkers.length} Live Listings
                        </div>
                        <div className="sm-stat-pill">⭐ 4.8 Top Rated</div>
                    </div>
                </div>
            </header>

      {/* Main Body */}
      <main className="sm-body">
        {/* Left: Filters + List */}
        <aside className={`sm-left ${viewMode === "map" ? "mob-hidden" : ""}`}>
          <FilterPanel onFilterChange={handleFilterChange} />
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
              🔄 Loading listings...
            </div>
          ) : (
            <ResultsList
              results={results}
              selectedId={selectedId}
              onSelectResult={handleSelectResult}
              onChat={handleChatRedirect}
              onViewDetails={handleViewDetails}
            />
          )}
        </aside>

        {/* Right: Map */}
        <section className={`sm-map-panel ${viewMode === "list" ? "mob-hidden" : ""}`}>
          {/* Map Layer Controls */}
          <div className="sm-map-layer-btn">
            {["all", "farmer", "vendor", "market"].map((layer) => (
              <button
                key={layer}
                className={`sm-map-layer-pill ${activeLayer === layer ? "active" : ""}`}
                onClick={() => handleLayerChange(layer)}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}s
              </button>
            ))}
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
              Markets
            </div>
          </div>

          <div className="sm-map-info">🟢 Found {results.length} results</div>

          <MapView
            markers={results}
            selectedId={selectedId}
            onSelectMarker={handleSelectResult}
            activeLayer={activeLayer}
          />
        </section>
      </main>

      {/* Profile Detail Modal */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onChat={handleChatRedirect}
        />
      )}

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
