// MapView.jsx — AgriNetwork Bangladesh
// Barikoi API real map with markers, popups, zoom & geolocation

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BARIKOI_API_KEY = (import.meta.env.VITE_BARIKOI_API_KEY || "").trim();
const BARIKOI_STYLE = `https://map.barikoi.com/styles/barikoi-light/style.json?key=${BARIKOI_API_KEY}`;

// Bangladesh center
const BD_CENTER = [90.3563, 23.685];

// Type → color mapping
const TYPE_COLORS = {
  farmer: "#4a804e",
  vendor: "#c4556a",
  market: "#2e6fa3",
};

const TYPE_ICONS = {
  farmer: "🌾",
  vendor: "🏪",
  market: "🏬",
};

// Static fallback markers if no props given
export const MAP_MARKERS = [
  { id: 1, type: "farmer", name: "Rahim Uddin", crop: "Rice", price: 55, unit: "৳/kg", district: "Mymensingh", rating: 4.8, stock: "in-stock", isVerified: true, lat: 24.75, lng: 90.4 },
  { id: 2, type: "vendor", name: "Dhaka Fresh Ltd.", crop: "Potato, Onion", price: 22, unit: "৳/kg", district: "Dhaka", rating: 4.5, stock: "in-stock", isVerified: true, lat: 23.81, lng: 90.41 },
  { id: 3, type: "farmer", name: "Nasreen Begum", crop: "Mustard", price: 115, unit: "৳/kg", district: "Rajshahi", rating: 4.6, stock: "limited", isVerified: true, lat: 24.37, lng: 88.6 },
  { id: 4, type: "market", name: "Sylhet Agro Market", crop: "Lemon, Tea, Fish", price: 0, unit: "", district: "Sylhet", rating: 4.3, stock: "in-stock", isVerified: false, lat: 24.89, lng: 91.87 },
  { id: 5, type: "farmer", name: "Mojibur Rahman", crop: "Tomato", price: 35, unit: "৳/kg", district: "Comilla", rating: 4.4, stock: "limited", isVerified: true, lat: 23.46, lng: 91.19 },
  { id: 6, type: "vendor", name: "Karim Agro House", crop: "Onion, Garlic", price: 72, unit: "৳/kg", district: "Chittagong", rating: 4.7, stock: "in-stock", isVerified: true, lat: 22.33, lng: 91.83 },
  { id: 7, type: "farmer", name: "Shafiq Molla", crop: "Wheat, Rice", price: 32, unit: "৳/kg", district: "Khulna", rating: 4.2, stock: "in-stock", isVerified: true, lat: 22.84, lng: 89.55 },
  { id: 8, type: "market", name: "Bogura Haat", crop: "All vegetables", price: 0, unit: "", district: "Bogura", rating: 4.0, stock: "in-stock", isVerified: false, lat: 24.85, lng: 89.37 },
];

function MapView({ markers = MAP_MARKERS, selectedId, onSelectMarker, onViewDetails, activeLayer = "all" }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const visibleMarkers = markers.filter(m => activeLayer === "all" || m.type === activeLayer);

  // Handle delegated clicks for the popup button
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest(".popup-action-btn");
      if (btn) {
        const markerId = btn.getAttribute("data-id");
        const marker = markers.find(m => String(m.id) === markerId);
        if (marker && onViewDetails) {
            onViewDetails(marker);
        }
      }
    };
    
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [markers, onViewDetails]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: BARIKOI_STYLE,
        center: BD_CENTER,
        zoom: 6.5,
        maxBounds: [[85, 19], [95, 28]],
        attributionControl: true,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserHeading: true,
        }),
        "top-right"
      );
      map.addControl(new maplibregl.FullscreenControl(), "top-right");
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");

      map.on("load", () => {
        setMapReady(true);
      });

      map.on("error", (e) => {
        const errorMsg = e.error?.message || e.message || "Failed to load map style";
        setMapError(errorMsg);
      });

      mapRef.current = map;
    } catch (err) {
      setMapError(err.message || true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visibleMarkers.forEach((marker) => {
      const color = TYPE_COLORS[marker.type] || "#4a804e";
      const icon = TYPE_ICONS[marker.type] || "📍";

      const el = document.createElement("div");
      el.className = "custom-marker-wrapper";
      
      const pin = document.createElement("div");
      pin.className = `custom-pin ${String(selectedId) === String(marker.id) ? "is-selected" : ""}`;
      pin.style.cssText = `
        width: 36px; height: 36px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;
      
      const inner = document.createElement("span");
      inner.style.cssText = "transform: rotate(45deg); font-size: 16px; line-height: 1;";
      inner.textContent = icon;
      pin.appendChild(inner);
      el.appendChild(pin);

      const popupHTML = `
        <div class="premium-popup-card">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
             <div style="width: 44px; height: 44px; background: ${color}22; color: ${color}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                ${icon}
             </div>
             <div>
                <div style="font-weight: 800; color: #1a1a2e; line-height: 1.2; font-size: 1rem;">${marker.name}</div>
                <div style="font-size: 0.75rem; color: #777;">Verified ${marker.type}</div>
             </div>
          </div>
          
          <div class="premium-popup-stats">
             <div class="stat-row">
                <span class="stat-label">Price List</span>
                <span class="stat-value" style="color: ${color}">৳${marker.price} ${marker.unit}</span>
             </div>
             <div class="stat-row">
                <span class="stat-label">Core Crop</span>
                <span class="stat-value">${marker.crop}</span>
             </div>
             <div class="stat-row">
                <span class="stat-label">Region</span>
                <span class="stat-value">📍 ${marker.district}</span>
             </div>
             <div class="stat-row">
                <span class="stat-label">Rating</span>
                <span class="stat-value">⭐ ${marker.rating}</span>
             </div>
          </div>

          <button class="popup-action-btn" data-id="${marker.id}" style="background: ${color}">
            View Market Rate Details
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 40,
        closeButton: false,
        className: "premium-barikoi-popup",
      }).setHTML(popupHTML);

      const glMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([marker.lng || 90.41, marker.lat || 23.81])
        .setPopup(popup)
        .addTo(mapRef.current);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectMarker && onSelectMarker(marker);
        glMarker.togglePopup();
      });

      markersRef.current.push(glMarker);
    });
  }, [visibleMarkers, mapReady, selectedId]);

  useEffect(() => {
    if (!mapRef.current || !mapReady || !selectedId) return;
    const marker = markers.find(m => String(m.id) === String(selectedId));
    if (marker) {
      mapRef.current.flyTo({
        center: [marker.lng || 90.41, marker.lat || 23.81],
        zoom: 12,
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedId, mapReady]);

  const isKeyMissing = !BARIKOI_API_KEY || BARIKOI_API_KEY === "your_barikoi_api_key_here";

  if (mapError || isKeyMissing) {
    return (
      <div style={{
        width: "100%", height: "100%", minHeight: 400,
        background: "linear-gradient(135deg, #e8f5e9, #f0f7f0)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        borderRadius: "12px", gap: 12, padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "3rem" }}>{mapError ? "❌" : "🗺️"}</div>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#344e41" }}>
          {mapError ? "Barikoi API Loading Error" : "Barikoi Map Setup Required"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666", maxWidth: 400, lineHeight: 1.6 }}>
           {isKeyMissing ? "Please add your VITE_BARIKOI_API_KEY to the .env file and restart the server." : `Error: ${mapError}`}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 400, position: "relative", borderRadius: "24px", overflow: "hidden", boxShadow: "0 12px 60px rgba(0,0,0,0.15)" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {!mapReady && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(240,247,240,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12,
        }}>
          <div className="cn-loader" />
          <div style={{ color: "#4a804e", fontWeight: 600, fontSize: "0.9rem" }}>Initializing Agri discovery...</div>
        </div>
      )}
      <style>{`
        .custom-pin:hover {
          transform: rotate(-45deg) scale(1.3) translateY(-4px) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.4) !important;
          z-index: 100 !important;
        }
        .premium-barikoi-popup .maplibregl-popup-content {
          background: none;
          box-shadow: none;
          padding: 0;
          border: none;
        }
        .premium-popup-card {
           width: 240px;
           background: #ffffff;
           border-radius: 20px;
           padding: 20px;
           box-shadow: 0 20px 40px rgba(0,0,0,0.2);
           transform: rotate(-3deg); /* The "slanted" premium look */
           transition: transform 0.3s ease;
           border: 1px solid rgba(0,0,0,0.05);
           position: relative;
        }
        .premium-popup-card:hover {
            transform: rotate(0deg) scale(1.02);
        }
        .premium-popup-stats {
           background: #f8faf9;
           border-radius: 12px;
           padding: 12px;
           margin-bottom: 16px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 0.75rem;
        }
        .stat-label { color: #888; }
        .stat-value { font-weight: 700; color: #1a1a2e; }
        .popup-action-btn {
            width: 100%;
            border: none;
            color: #fff;
            padding: 12px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        .popup-action-btn:hover {
            filter: brightness(1.1);
            transform: translateY(-2px);
        }
        .cn-loader {
          width: 40px; height: 40px; border: 3px solid #4a804e22; border-top-color: #4a804e; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default MapView;
