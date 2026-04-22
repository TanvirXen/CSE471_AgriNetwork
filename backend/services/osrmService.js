const axios = require('axios');

// Haversine fallback calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getRouteAndDistance = async (startCoords, endCoords) => {
  // startCoords, endCoords = array [lng, lat]
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?overview=full&geometries=geojson`;
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distanceKm: route.distance / 1000, 
        durationMinutes: route.duration / 60,
        geometry: route.geometry, // GeoJSON
        success: true
      };
    }
    throw new Error('OSRM API returned no routes');
  } catch (error) {
    console.warn("OSRM routing failed, falling back to Haversine:", error.message);
    
    // Fallback: Haversine distance
    // Coords are [lng, lat]
    const distanceKm = calculateHaversineDistance(startCoords[1], startCoords[0], endCoords[1], endCoords[0]);
    
    return {
      distanceKm: distanceKm,
      durationMinutes: distanceKm * 2, // rough estimate: 1 km = 2 mins in city traffic
      geometry: {
        type: "LineString",
        coordinates: [
          [startCoords[0], startCoords[1]],
          [endCoords[0], endCoords[1]]
        ]
      },
      success: false // indicates fallback was used
    };
  }
};
