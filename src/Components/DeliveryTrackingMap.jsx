import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CustomMarker = ({ position, label }) => {
  return (
    <Marker position={position}>
      <Popup>{label}</Popup>
    </Marker>
  );
};

const FitBounds = ({ routeCoordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      setTimeout(() => {
        map.invalidateSize();
        const bounds = L.latLngBounds(routeCoordinates);
        map.fitBounds(bounds, { padding: [50, 50] });
      }, 300); // Wait for modal animation to finish
    }
  }, [routeCoordinates, map]);
  return null;
};

const DeliveryTrackingMap = ({ geojsonGeometry }) => {
  if (!geojsonGeometry || !geojsonGeometry.coordinates || geojsonGeometry.coordinates.length < 2) {
    return <div style={{ height: '300px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Map Data Unavailable</div>;
  }

  // OSRM returns coordinates as [lng, lat], Leaflet wants [lat, lng]
  const routeCoordinates = geojsonGeometry.coordinates.map(coord => [coord[1], coord[0]]);
  
  const startPoint = routeCoordinates[0];
  const endPoint = routeCoordinates[routeCoordinates.length - 1];

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={startPoint} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        />
        <Polyline positions={routeCoordinates} color="var(--primary-main)" weight={5} />
        
        {startPoint && <CustomMarker position={startPoint} label="Pickup Location" />}
        {endPoint && <CustomMarker position={endPoint} label="Delivery Destination" />}
        
        <FitBounds routeCoordinates={routeCoordinates} />
      </MapContainer>
    </div>
  );
};

export default DeliveryTrackingMap;
