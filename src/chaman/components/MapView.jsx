// MapView.jsx — AgriNetwork Bangladesh
// Interactive map with zoom, fullscreen, and working marker popups

import { useState, useRef } from "react";

// Static fallback markers used only if no markers prop passed  
export const MAP_MARKERS = [
  { id: 1, type: "farmer", name: "Rahim Uddin", crop: "Rice", price: 55, unit: "৳/kg", district: "Mymensingh", x: 47, y: 28, rating: 4.8, stock: "in-stock", isVerified: true },
  { id: 2, type: "vendor", name: "Dhaka Fresh Ltd.", crop: "Potato, Onion", price: 22, unit: "৳/kg", district: "Dhaka", x: 44, y: 44, rating: 4.5, stock: "in-stock", isVerified: true },
  { id: 3, type: "farmer", name: "Nasreen Begum", crop: "Mustard", price: 115, unit: "৳/kg", district: "Rajshahi", x: 22, y: 35, rating: 4.6, stock: "limited", isVerified: true },
  { id: 4, type: "market", name: "Sylhet Agro Market", crop: "Lemon, Tea, Fish", price: 0, unit: "", district: "Sylhet", x: 72, y: 26, rating: 4.3, stock: "in-stock", isVerified: false },
  { id: 5, type: "farmer", name: "Mojibur Rahman", crop: "Tomato", price: 35, unit: "৳/kg", district: "Comilla", x: 62, y: 54, rating: 4.4, stock: "limited", isVerified: true },
  { id: 6, type: "vendor", name: "Karim Agro House", crop: "Onion, Garlic", price: 72, unit: "৳/kg", district: "Chittagong", x: 68, y: 70, rating: 4.7, stock: "in-stock", isVerified: true },
  { id: 7, type: "farmer", name: "Shafiq Molla", crop: "Wheat, Rice", price: 32, unit: "৳/kg", district: "Khulna", x: 28, y: 68, rating: 4.2, stock: "in-stock", isVerified: true },
  { id: 8, type: "market", name: "Bogura Haat", crop: "All vegetables", price: 0, unit: "", district: "Bogura", x: 34, y: 25, rating: 4.0, stock: "in-stock", isVerified: false },
  { id: 9, type: "farmer", name: "Halim Sheikh", crop: "Jute", price: 3200, unit: "৳/q", district: "Faridpur", x: 38, y: 55, rating: 4.5, stock: "in-stock", isVerified: true },
  { id: 10, type: "vendor", name: "Bay Spice Co.", crop: "Garlic, Ginger", price: 180, unit: "৳/kg", district: "Barisal", x: 42, y: 72, rating: 4.6, stock: "limited", isVerified: true },
  { id: 11, type: "farmer", name: "Rubina Khanam", crop: "Potato", price: 21, unit: "৳/kg", district: "Rangpur", x: 28, y: 14, rating: 4.1, stock: "in-stock", isVerified: true },
  { id: 12, type: "market", name: "Cox's Bazar Market", crop: "Fish, Shrimp", price: 0, unit: "", district: "Cox's Bazar", x: 76, y: 83, rating: 4.8, stock: "in-stock", isVerified: false },
];

// Map district name positions
const DISTRICT_LABELS = [
  { name: "Dhaka", x: 42, y: 48 },
  { name: "Chittagong", x: 70, y: 66 },
  { name: "Rajshahi", x: 18, y: 38 },
  { name: "Sylhet", x: 73, y: 24 },
  { name: "Khulna", x: 26, y: 64 },
  { name: "Barisal", x: 41, y: 75 },
  { name: "Rangpur", x: 25, y: 12 },
  { name: "Mymensingh", x: 49, y: 26 },
];

const RIVERS = [
  { top: "50%", left: "30%", width: "180px", height: "80px", rotate: "-20deg" },
  { top: "35%", left: "42%", width: "100px", height: "60px", rotate: "30deg" },
  { top: "60%", left: "20%", width: "120px", height: "50px", rotate: "-10deg" },
];

function MarkerPopup({ marker }) {
  return (
    <div className="sm-marker-popup">
      <div className="sm-marker-popup__name">{marker.name}</div>
      <div className="sm-marker-popup__crop">
        {marker.type === "farmer" ? "🌾" : marker.type === "vendor" ? "🏪" : "🏬"} {marker.crop}
      </div>
      {marker.price > 0 && (
        <div className="sm-marker-popup__price">{marker.price} {marker.unit}</div>
      )}
      <div style={{ fontSize: "0.7rem", color: "#7a7770", marginTop: 4 }}>
        📍 {marker.district} &nbsp;·&nbsp; ⭐ {marker.rating}
      </div>
    </div>
  );
}

function MapView({ markers = MAP_MARKERS, selectedId, onSelectMarker, activeLayer = "all" }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef(null);

  const visibleMarkers = markers.filter((m) => activeLayer === "all" || m.type === activeLayer);

  // Compute map-relative positions from lat/lng if available, otherwise use x/y 
  const getPosition = (marker) => {
    if (marker.lng && marker.lat) {
      // Bangladesh roughly spans: lng 88-92.7, lat 20.7-26.6
      const x = ((marker.lng - 88) / (92.7 - 88)) * 90 + 5;
      const y = ((26.6 - marker.lat) / (26.6 - 20.7)) * 86 + 7;
      return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }
    return { x: marker.x || 50, y: marker.y || 50 };
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.3, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.3, 0.6));

  const handleFullscreen = () => {
    if (!isFullscreen) {
      mapRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => alert("📍 Location detected! Centering map to your position."),
      () => alert("📍 Cannot access your location. Showing Bangladesh by default.")
    );
  };

  return (
    <div ref={mapRef} className="sm-map-svg-wrap" style={{ position: "relative" }}>
      {/* Zoom controls overlay */}
      <div className="sm-map-controls" style={{ position: "absolute", top: 16, right: 16, zIndex: 20 }}>
        <button className="sm-map-btn" title="Zoom in" onClick={handleZoomIn}>+</button>
        <button className="sm-map-btn" title="Zoom out" onClick={handleZoomOut}>−</button>
        <button className="sm-map-btn" title="My Location" onClick={handleMyLocation}>🧭</button>
        <button className="sm-map-btn" title="Fullscreen" onClick={handleFullscreen}>⛶</button>
      </div>

      {/* Zoomable inner map */}
      <div style={{ width: "100%", height: "100%", transformOrigin: "center center", transform: `scale(${zoomLevel})`, transition: "transform 0.25s ease" }}>
        {/* Map background */}
        <div className="sm-map-bg" />

        {/* Land areas */}
        <div className="sm-map-land" style={{ top: "8%", left: "5%", width: "82%", height: "78%", opacity: 0.6 }} />
        <div className="sm-map-land" style={{ top: "12%", left: "8%", width: "74%", height: "70%", opacity: 0.45, borderRadius: "38% 42% 36% 40%" }} />

        {/* Hill Tracts */}
        <div style={{
          position: "absolute", bottom: "12%", right: "8%",
          width: "25%", height: "30%",
          background: "linear-gradient(150deg, #b0c9ae, #9ab89a)",
          borderRadius: "50% 40% 45% 50%", opacity: 0.55,
        }} />

        {/* Bay of Bengal */}
        <div className="sm-map-water" />

        {/* Rivers */}
        {RIVERS.map((r, i) => (
          <div key={i} className="sm-river" style={{ top: r.top, left: r.left, width: r.width, height: r.height, transform: `rotate(${r.rotate})` }} />
        ))}

        {/* Roads */}
        <div className="sm-map-road" style={{ top: "44%", left: "5%", width: "88%", height: "2px", opacity: 0.6 }} />
        <div className="sm-map-road" style={{ top: "15%", left: "43%", width: "2px", height: "65%", opacity: 0.5 }} />
        <div className="sm-map-road" style={{ top: "30%", left: "20%", width: "50%", height: "2px", transform: "rotate(-5deg)", opacity: 0.4 }} />

        {/* District Labels */}
        {DISTRICT_LABELS.map((d) => (
          <div key={d.name} className="sm-district-label" style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%, -50%)" }}>
            {d.name}
          </div>
        ))}

        {/* Markers */}
        {visibleMarkers.map((marker) => {
          const pos = getPosition(marker);
          return (
            <div
              key={marker.id}
              className={`sm-marker${selectedId === marker.id ? " selected" : ""}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => onSelectMarker && onSelectMarker(marker)}
              onMouseEnter={() => setHoveredId(marker.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              aria-label={`${marker.name} — ${marker.crop}`}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectMarker && onSelectMarker(marker)}
            >
              <div className={`sm-marker__pin ${marker.type}`}>
                <div className="sm-marker__ring" />
                <span className="sm-marker__icon">
                  {marker.type === "farmer" ? "🌾" : marker.type === "vendor" ? "🏪" : "🏬"}
                </span>
              </div>
              <div className="sm-marker__label">
                {marker.name.split(" ")[0]}
              </div>

              {(hoveredId === marker.id || selectedId === marker.id) && (
                <MarkerPopup marker={marker} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MapView;
