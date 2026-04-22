/**
 * weatherService.js
 * Server-side Open-Meteo calls — completely free, no API key needed.
 */

const REGION_COORDS = {
  Dhaka:      { lat: 23.8103, lon: 90.4125 },
  Rajshahi:   { lat: 24.3745, lon: 88.6042 },
  Chittagong: { lat: 22.3569, lon: 91.7832 },
  Sylhet:     { lat: 24.8949, lon: 91.8687 },
  Khulna:     { lat: 22.8456, lon: 89.5403 },
  Barishal:   { lat: 22.7010, lon: 90.3535 },
  Mymensingh: { lat: 24.7471, lon: 90.4203 },
  Rangpur:    { lat: 25.7468, lon: 89.2752 },
  Faridpur:   { lat: 23.6070, lon: 89.8429 },
  Pabna:      { lat: 24.0064, lon: 89.2372 },
};

// In-memory cache: { region: { data, fetchedAt } }
const cache = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getWeatherForRegion(region) {
  const key = region || "Dhaka";
  const coords = REGION_COORDS[key] || REGION_COORDS["Dhaka"];

  // Return cached if fresh
  if (cache[key] && Date.now() - cache[key].fetchedAt < CACHE_TTL_MS) {
    return cache[key].data;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current_weather=true` +
      `&hourly=relative_humidity_2m,precipitation` +
      `&forecast_days=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Weather API status ${res.status}`);

    const json = await res.json();

    const temp        = json.current_weather?.temperature ?? 28;
    const windspeed   = json.current_weather?.windspeed ?? 12;
    const humidity    = json.hourly?.relative_humidity_2m?.[0] ?? 70;
    const precip      = json.hourly?.precipitation?.[0] ?? 0;
    const isMonsoon   = precip > 2 || humidity > 85;
    const isColdSeason = temp < 20;
    const isHotSeason  = temp > 32;

    const weatherData = {
      region:       key,
      temperature:  temp,
      windspeed,
      humidity,
      precipitation: precip,
      isMonsoon,
      isColdSeason,
      isHotSeason,
      summary: `${temp}°C, ${humidity}% humidity${isMonsoon ? ", rainy" : ""}`,
      fetchedAt: new Date().toISOString(),
    };

    cache[key] = { data: weatherData, fetchedAt: Date.now() };
    return weatherData;
  } catch (err) {
    console.warn("[weatherService] Fetch failed for", key, "–", err.message);
    // Return safe fallback — never crashes
    return {
      region:        key,
      temperature:   28,
      windspeed:     12,
      humidity:      70,
      precipitation: 0,
      isMonsoon:     false,
      isColdSeason:  false,
      isHotSeason:   false,
      summary:       "28°C, 70% humidity (cached fallback)",
      fetchedAt:     new Date().toISOString(),
    };
  }
}

// Fetch weather for ALL regions (used in market insights)
async function getAllRegionsWeather() {
  const regions = Object.keys(REGION_COORDS);
  const results = await Promise.allSettled(regions.map((r) => getWeatherForRegion(r)));
  const out = {};
  results.forEach((r, i) => {
    out[regions[i]] = r.status === "fulfilled" ? r.value : null;
  });
  return out;
}

module.exports = { getWeatherForRegion, getAllRegionsWeather, REGION_COORDS };
