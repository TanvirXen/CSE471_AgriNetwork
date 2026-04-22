import React, { useState, useEffect, useCallback } from 'react';
import './SmartAgroMarket.css';

/* ─── Free API: Open-Meteo (no key required) ─── */
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

/* Region → lat/lon mapping (Bangladesh districts) */
const REGION_COORDS = {
  Dhaka:      { lat: 23.8103, lon: 90.4125 },
  Rajshahi:   { lat: 24.3745, lon: 88.6042 },
  Chittagong: { lat: 22.3569, lon: 91.7832 },
  Sylhet:     { lat: 24.8949, lon: 91.8687 },
  Khulna:     { lat: 22.8456, lon: 89.5403 },
  Barishal:   { lat: 22.7010, lon: 90.3535 },
  Mymensingh: { lat: 24.7471, lon: 90.4203 },
};

/* ─── Rule-Based AI Engine (no paid API) ─── */
const CROP_DATABASE = [
  {
    cropName: 'Boro Rice', variety: 'BR-28 / BRRI dhan28',
    seasons: ['Rabi'], soils: ['Clay', 'Loam', 'Silt'],
    regions: ['Dhaka', 'Rajshahi', 'Mymensingh', 'Barishal'],
    minBudgetPerAcre: 8000, needsIrrigation: true,
    baseScore: 88, expectedYieldPerAcre: 55, pricePerMon: 900,
    reason: 'High-yield irrigated rice variety. Best for Rabi season with assured water supply.',
  },
  {
    cropName: 'Wheat', variety: 'BARI Gom-26',
    seasons: ['Rabi'], soils: ['Loam', 'Silt', 'Sandy'],
    regions: ['Rajshahi', 'Khulna', 'Dhaka'],
    minBudgetPerAcre: 6000, needsIrrigation: false,
    baseScore: 82, expectedYieldPerAcre: 30, pricePerMon: 1100,
    reason: 'Cool-weather crop ideal for Rabi. Good market price and moderate input cost.',
  },
  {
    cropName: 'Mustard', variety: 'BARI Sarisha-14',
    seasons: ['Rabi'], soils: ['Loam', 'Clay', 'Silt'],
    regions: ['Rajshahi', 'Khulna', 'Barishal', 'Dhaka'],
    minBudgetPerAcre: 4500, needsIrrigation: false,
    baseScore: 79, expectedYieldPerAcre: 12, pricePerMon: 2400,
    reason: 'High-value oilseed with strong demand. Low input cost, good profit margin.',
  },
  {
    cropName: 'Aus Rice', variety: 'BRRI dhan48',
    seasons: ['Kharif'], soils: ['Clay', 'Loam'],
    regions: ['Sylhet', 'Chittagong', 'Dhaka', 'Mymensingh'],
    minBudgetPerAcre: 7500, needsIrrigation: false,
    baseScore: 74, expectedYieldPerAcre: 40, pricePerMon: 800,
    reason: 'Suitable for early Kharif monsoon. Flood-tolerant variety for low-lying areas.',
  },
  {
    cropName: 'Jute', variety: 'CVE-3',
    seasons: ['Kharif'], soils: ['Loam', 'Silt', 'Sandy'],
    regions: ['Rajshahi', 'Mymensingh', 'Dhaka', 'Faridpur'],
    minBudgetPerAcre: 5500, needsIrrigation: false,
    baseScore: 71, expectedYieldPerAcre: 25, pricePerMon: 1800,
    reason: 'Golden fiber with industrial demand. Suitable for Kharif season flood plains.',
  },
  {
    cropName: 'Tomato', variety: 'BARI Tomato-14',
    seasons: ['Rabi'], soils: ['Sandy', 'Loam'],
    regions: ['Rajshahi', 'Dhaka', 'Chittagong', 'Mymensingh'],
    minBudgetPerAcre: 12000, needsIrrigation: true,
    baseScore: 86, expectedYieldPerAcre: 180, pricePerMon: 600,
    reason: 'High-value vegetable with excellent market demand. Requires irrigation and good soil preparation.',
  },
  {
    cropName: 'Potato', variety: 'Cardinal / Granola',
    seasons: ['Rabi'], soils: ['Sandy', 'Loam'],
    regions: ['Rajshahi', 'Rangpur', 'Dhaka'],
    minBudgetPerAcre: 14000, needsIrrigation: true,
    baseScore: 84, expectedYieldPerAcre: 280, pricePerMon: 350,
    reason: 'Staple vegetable with mass market demand. High production cost but consistent pricing.',
  },
  {
    cropName: 'Bitter Gourd', variety: 'BARI Karala-1',
    seasons: ['Kharif', 'Zaid'], soils: ['Loam', 'Sandy'],
    regions: ['Khulna', 'Dhaka', 'Mymensingh', 'Chittagong'],
    minBudgetPerAcre: 9000, needsIrrigation: true,
    baseScore: 76, expectedYieldPerAcre: 120, pricePerMon: 700,
    reason: 'Popular summer vegetable with reliable local demand. Multiple harvests per season.',
  },
  {
    cropName: 'Onion', variety: 'BARI Piaz-1',
    seasons: ['Rabi'], soils: ['Loam', 'Clay'],
    regions: ['Rajshahi', 'Pabna', 'Faridpur', 'Dhaka'],
    minBudgetPerAcre: 11000, needsIrrigation: true,
    baseScore: 83, expectedYieldPerAcre: 100, pricePerMon: 950,
    reason: 'Essential cooking ingredient with persistent high demand and strong market price.',
  },
  {
    cropName: 'Lentil (Masur Dal)', variety: 'BARI Masur-4',
    seasons: ['Rabi'], soils: ['Loam', 'Silt', 'Clay'],
    regions: ['Rajshahi', 'Dhaka', 'Khulna'],
    minBudgetPerAcre: 4000, needsIrrigation: false,
    baseScore: 77, expectedYieldPerAcre: 14, pricePerMon: 3500,
    reason: 'High-protein pulse with rising market value. Low water requirement and good gross profit.',
  },
  {
    cropName: 'Watermelon', variety: 'Syngenta Kiran',
    seasons: ['Zaid', 'Kharif'], soils: ['Sandy', 'Loam'],
    regions: ['Khulna', 'Barisal', 'Chittagong', 'Rajshahi'],
    minBudgetPerAcre: 15000, needsIrrigation: true,
    baseScore: 80, expectedYieldPerAcre: 280, pricePerMon: 280,
    reason: 'High-demand summer fruit. Requires sandy loam soil and warm temperature. Good export potential.',
  },
  {
    cropName: 'Maize', variety: 'BARI Corn-9',
    seasons: ['Rabi', 'Kharif'], soils: ['Loam', 'Sandy', 'Silt'],
    regions: ['Rangpur', 'Rajshahi', 'Chittagong'],
    minBudgetPerAcre: 7000, needsIrrigation: false,
    baseScore: 78, expectedYieldPerAcre: 55, pricePerMon: 1000,
    reason: 'Versatile feed grain with growing poultry sector demand. Suitable for diverse soil types.',
  },
];

function scoreRecommendation(crop, input, weather) {
  let score = crop.baseScore;

  // Season match
  if (!crop.seasons.includes(input.season)) score -= 30;

  // Soil match
  if (!crop.soils.includes(input.soilType)) score -= 15;

  // Region match
  const regionMatch = crop.regions.some(r =>
    r.toLowerCase().includes(input.region.toLowerCase()) ||
    input.region.toLowerCase().includes(r.toLowerCase())
  );
  if (!regionMatch) score -= 10;

  // Budget check
  const budgetNeeded = crop.minBudgetPerAcre * (input.landArea || 1);
  if (input.budget < budgetNeeded * 0.7) score -= 20;
  else if (input.budget >= budgetNeeded * 1.5) score += 5;

  // Irrigation
  if (crop.needsIrrigation && !input.irrigationAvailable) score -= 18;
  if (!crop.needsIrrigation && !input.irrigationAvailable) score += 5;

  // Weather bonus (if available)
  if (weather) {
    const temp = weather.current_weather?.temperature;
    if (input.season === 'Rabi' && temp && temp < 25) score += 5;
    if (input.season === 'Kharif' && temp && temp > 28) score += 5;
  }

  // Profitability
  const grossRevenue = crop.expectedYieldPerAcre * crop.pricePerMon * (input.landArea || 1);
  const cost = crop.minBudgetPerAcre * (input.landArea || 1);
  const profit = grossRevenue - cost;

  let profitScore = Math.min(100, Math.max(0, Math.round(profit / grossRevenue * 100)));

  return {
    ...crop,
    recommendationScore: Math.min(100, Math.max(0, Math.round(score))),
    expectedYield: Math.round(crop.expectedYieldPerAcre * (input.landArea || 1)),
    expectedMarketPrice: crop.pricePerMon,
    profitabilityScore: profitScore,
    grossRevenue,
    estimatedProfit: profit,
  };
}

/* ─── Market data (seeded from backend, fallback static) ─── */
const STATIC_MARKET = [
  { productName: 'Boro Rice', variety: 'BR-28', region: 'Dhaka', season: 'Rabi', demandLevel: 'High', supplyLevel: 'High', priceTrend: 'Stable', forecastSummary: 'Steady demand from urban markets. Government procurement stabilises pricing.', recommendation: 'Good time to sell. Negotiate bulk contracts.', confidenceScore: 87, priceHistory: [820,840,850,860,850,860,870,880,900,890,900,910] },
  { productName: 'Wheat', variety: 'BARI Gom-26', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Medium', priceTrend: 'Up', forecastSummary: 'Import costs rising, boosting domestic wheat price. Good time to hold stock.', recommendation: 'Hold stock for 2-3 weeks for better price.', confidenceScore: 82, priceHistory: [950,960,980,990,1000,1020,1050,1060,1080,1090,1100,1110] },
  { productName: 'Tomato', variety: 'BARI-14', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Off-season shortage driving prices. Peak demand from restaurant sector.', recommendation: 'Excellent opportunity for greenhouse growers.', confidenceScore: 90, priceHistory: [400,430,480,520,570,610,620,580,600,620,650,700] },
  { productName: 'Potato', variety: 'Cardinal', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'High', priceTrend: 'Stable', forecastSummary: 'Cold storage supply maintaining steady prices. Demand remains constant.', recommendation: 'Sell without delay unless cold storage is available.', confidenceScore: 88, priceHistory: [300,310,320,315,320,330,330,340,345,340,350,350] },
  { productName: 'Onion', variety: 'BARI-1', region: 'Pabna', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Import ban rumours raising local prices. Strong volatility expected.', recommendation: 'Monitor daily. Consider selling 50% now.', confidenceScore: 78, priceHistory: [700,720,800,850,900,950,1000,980,1050,1100,1200,1300] },
  { productName: 'Mustard', variety: 'BARI-14', region: 'Rajshahi', season: 'Rabi', demandLevel: 'Medium', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Rising edible oil prices boosting mustard demand. Domestic production insufficient.', recommendation: 'Strong sell opportunity. Direct to oil mills for better price.', confidenceScore: 84, priceHistory: [2000,2100,2150,2200,2250,2300,2350,2380,2400,2420,2450,2500] },
  { productName: 'Jute', variety: 'CVE-3', region: 'Mymensingh', season: 'Kharif', demandLevel: 'Medium', supplyLevel: 'Medium', priceTrend: 'Stable', forecastSummary: 'Export demand stable. Government jute mill purchases maintaining floor price.', recommendation: 'Sell after retting process at nearest depot.', confidenceScore: 75, priceHistory: [1600,1650,1680,1700,1710,1720,1730,1750,1760,1780,1800,1800] },
  { productName: 'Lentil', variety: 'BARI-4', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Pulse prices climbing due to reduced domestic production. Import gap widening.', recommendation: 'High profit margin. Expand cultivation area.', confidenceScore: 86, priceHistory: [2800,2900,3000,3100,3200,3250,3300,3350,3400,3450,3500,3600] },
  { productName: 'Maize', variety: 'BARI-9', region: 'Rangpur', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Medium', priceTrend: 'Stable', forecastSummary: 'Poultry and fisheries sector fuelling maize demand. Price likely stable.', recommendation: 'Direct supply to feed mills for premium price.', confidenceScore: 81, priceHistory: [880,900,920,930,940,950,960,980,990,1000,1000,1010] },
  { productName: 'Watermelon', variety: 'Kiran', region: 'Khulna', season: 'Zaid', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Summer demand surge. Chars and river islands producing less this year.', recommendation: 'Premium prices at city wholesale markets. Transport quickly.', confidenceScore: 89, priceHistory: [200,220,240,260,280,290,300,280,260,250,260,280] },
];

const getProfitClass = (score) => score >= 65 ? 'profit-high' : score >= 40 ? 'profit-mid' : 'profit-low';
const getScoreClass = (score) => score >= 70 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low';
const getRankClass = (i) => ['rank-1','rank-2','rank-3'][i] || 'rank-other';
const getTrendClass = (t) => ({ Up: 'trend-up', Down: 'trend-down', Stable: 'trend-stable' }[t] || 'trend-stable');
const getTrendIcon = (t) => ({ Up: '↑', Down: '↓', Stable: '→' }[t] || '→');
const getDSPercent = (level) => ({ High: 85, Medium: 50, Low: 20 }[level] || 50);

/* ───────────────── COMPONENT ───────────────── */
export default function SmartAgroMarket() {
  const [activeTab, setActiveTab] = useState('crop');

  /* Crop Planner state */
  const [form, setForm] = useState({
    landArea: '', landUnit: 'acre',
    region: 'Dhaka', season: 'Rabi',
    soilType: 'Loam', irrigationAvailable: true,
    budget: '',
  });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [cropError, setCropError] = useState('');

  /* Market Analysis state */
  const [mktRegion, setMktRegion] = useState('All');
  const [mktSeason, setMktSeason] = useState('All');
  const [marketData, setMarketData] = useState([]);
  const [mktLoading, setMktLoading] = useState(false);
  const [mktError, setMktError] = useState('');

  /* Fetch weather when region changes */
  const fetchWeather = useCallback(async (region) => {
    const coords = REGION_COORDS[region];
    if (!coords) return;
    setWeatherLoading(true);
    try {
      const url = `${WEATHER_BASE}?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relative_humidity_2m&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      setWeather(data);
    } catch {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(form.region);
  }, [form.region, fetchWeather]);

  /* Load market data on tab switch or filter change */
  useEffect(() => {
    if (activeTab !== 'market') return;
    loadMarketData();
    // eslint-disable-next-line
  }, [activeTab]);

  const loadMarketData = async () => {
    setMktLoading(true);
    setMktError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (mktRegion !== 'All') params.append('region', mktRegion);
      if (mktSeason !== 'All') params.append('season', mktSeason);
      const res = await fetch(`/api/market/insights?${params}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMarketData(data.length ? data : STATIC_MARKET);
    } catch {
      // Fallback to static demo data
      setMarketData(STATIC_MARKET);
    } finally {
      setMktLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAnalyze = async () => {
    if (!form.landArea || !form.budget) {
      setCropError('Please enter land area and budget.');
      return;
    }
    setCropError('');
    setAnalyzing(true);

    // Simulate async (also try backend)
    await new Promise(r => setTimeout(r, 600));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/market/crop-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify({
          ...form,
          landArea: parseFloat(form.landArea),
          budget: parseFloat(form.budget),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations?.length) {
          setRecommendations(data.recommendations);
          setAnalyzing(false);
          return;
        }
      }
    } catch { /* fall through to local engine */ }

    // Local AI engine
    const input = { ...form, landArea: parseFloat(form.landArea), budget: parseFloat(form.budget) };
    const results = CROP_DATABASE
      .map(crop => scoreRecommendation(crop, input, weather))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);
    setRecommendations(results);
    setAnalyzing(false);
  };

  const filteredMarket = marketData.filter(m => {
    if (mktRegion !== 'All' && !m.region?.toLowerCase().includes(mktRegion.toLowerCase())) return false;
    if (mktSeason !== 'All' && m.season !== mktSeason) return false;
    return true;
  });

  return (
    <div className="sam-page">
      {/* Header */}
      <div className="sam-header">
        <div className="sam-header-content">
          <div className="sam-header-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,229,236,0.95)" strokeWidth="2">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <h1>🌱 Smart AgroMarket</h1>
            <p>AI-powered crop recommendations and market intelligence for profitable farming</p>
            <span className="sam-badge">🤖 Free AI Engine + Live Weather</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sam-tabs">
        <button
          className={`sam-tab ${activeTab === 'crop' ? 'active' : ''}`}
          onClick={() => setActiveTab('crop')}
        >
          🌾 Crop Planner
        </button>
        <button
          className={`sam-tab ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          📊 Market Analysis
        </button>
      </div>

      {/* ── TAB 1: CROP PLANNER ── */}
      {activeTab === 'crop' && (
        <div className="sam-layout">
          {/* Form */}
          <div className="sam-form-card">
            <h3>🔬 Farm Details</h3>

            {/* Weather strip */}
            {weather?.current_weather && (
              <div className="sam-weather-info">
                <span>🌤️</span>
                <div>
                  <strong>{form.region}:</strong> {weather.current_weather.temperature}°C,{' '}
                  {weather.current_weather.windspeed} km/h wind
                  <br />
                  <small style={{ color: '#588157' }}>Live via Open-Meteo (free)</small>
                </div>
              </div>
            )}
            {weatherLoading && (
              <div className="sam-weather-info">
                <span>⏳</span> <span>Fetching live weather…</span>
              </div>
            )}

            {cropError && <div className="sam-error">⚠️ {cropError}</div>}

            <div className="sam-form-group">
              <label>Land Area</label>
              <div className="sam-input-row">
                <input
                  type="number" min="0.1" step="0.1"
                  name="landArea" placeholder="e.g. 2.5"
                  value={form.landArea} onChange={handleFormChange}
                />
                <select name="landUnit" value={form.landUnit} onChange={handleFormChange}>
                  <option value="acre">Acre</option>
                  <option value="bigha">Bigha</option>
                  <option value="hectare">Hectare</option>
                  <option value="decimal">Decimal</option>
                </select>
              </div>
            </div>

            <div className="sam-form-group">
              <label>Region / District</label>
              <select name="region" value={form.region} onChange={handleFormChange}>
                {Object.keys(REGION_COORDS).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="sam-form-group">
              <label>Season</label>
              <select name="season" value={form.season} onChange={handleFormChange}>
                <option value="Rabi">Rabi (Nov–Mar)</option>
                <option value="Kharif">Kharif (Apr–Oct)</option>
                <option value="Zaid">Zaid (Summer)</option>
              </select>
            </div>

            <div className="sam-form-group">
              <label>Soil Type</label>
              <select name="soilType" value={form.soilType} onChange={handleFormChange}>
                <option value="Loam">Loam (সাম মাটি)</option>
                <option value="Clay">Clay (এঁটেল মাটি)</option>
                <option value="Sandy">Sandy (বেলে মাটি)</option>
                <option value="Silt">Silt (পলি মাটি)</option>
              </select>
            </div>

            <div className="sam-form-group">
              <label>Budget (BDT)</label>
              <input
                type="number" min="0" step="500"
                name="budget" placeholder="Total budget in BDT"
                value={form.budget} onChange={handleFormChange}
              />
            </div>

            <div className="sam-form-group">
              <label>Irrigation</label>
              <div className="sam-toggle-group">
                <span className="sam-toggle-label">
                  {form.irrigationAvailable ? '✅ Irrigation Available' : '❌ No Irrigation'}
                </span>
                <label className="sam-toggle">
                  <input
                    type="checkbox" name="irrigationAvailable"
                    checked={form.irrigationAvailable} onChange={handleFormChange}
                  />
                  <span className="sam-toggle-slider" />
                </label>
              </div>
            </div>

            <button
              className="sam-btn-analyze"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Analyzing…</>
              ) : (
                <> 🤖 Analyze & Recommend</>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="sam-results">
            {recommendations.length > 0 && (
              <div className="sam-results-header">
                <h3>🏆 AI Recommendations</h3>
                <span className="sam-results-count">{recommendations.length} crops found</span>
              </div>
            )}

            {recommendations.length === 0 && !analyzing && (
              <div className="sam-empty">
                <span className="sam-empty-icon">🌱</span>
                <h4>Ready to Analyze</h4>
                <p>Fill in your farm details and click <strong>Analyze & Recommend</strong> to get personalized crop suggestions based on your region, season, soil, and budget.</p>
              </div>
            )}

            {analyzing && (
              <div className="sam-empty" style={{ border: '2px solid rgba(88,129,87,0.2)' }}>
                <div className="sam-loading">
                  <div className="sam-spinner" />
                  <p>🤖 AI engine processing your farm data…</p>
                </div>
              </div>
            )}

            {recommendations.map((crop, i) => {
              const profitClass = getProfitClass(crop.profitabilityScore);
              return (
                <div key={crop.cropName + i} className="sam-crop-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  {/* Rank */}
                  <div className={`sam-crop-rank ${getRankClass(i)}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </div>

                  {/* Info */}
                  <div className="sam-crop-info">
                    <h4>{crop.cropName}</h4>
                    <div className="sam-crop-variety">{crop.variety}</div>
                    <div className="sam-crop-reason">{crop.reason}</div>
                    <div className="sam-crop-stats">
                      <div className="sam-stat-item">
                        <span className="sam-stat-label">Expected Yield</span>
                        <span className="sam-stat-value">{crop.expectedYield} Mon</span>
                      </div>
                      <div className="sam-stat-item">
                        <span className="sam-stat-label">Market Price</span>
                        <span className="sam-stat-value">৳{crop.expectedMarketPrice}/Mon</span>
                      </div>
                      <div className="sam-stat-item">
                        <span className="sam-stat-label">Est. Revenue</span>
                        <span className="sam-stat-value">৳{crop.grossRevenue?.toLocaleString()}</span>
                      </div>
                      <div className="sam-stat-item">
                        <span className="sam-stat-label">Profitability</span>
                        <span className={`sam-profit-badge ${profitClass}`}>
                          {crop.profitabilityScore >= 65 ? '📈' : crop.profitabilityScore >= 40 ? '➡️' : '📉'} {crop.profitabilityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="sam-score-circle">
                    <div className={`sam-score-ring ${getScoreClass(crop.recommendationScore)}`}>
                      {crop.recommendationScore}
                    </div>
                    <span className="sam-score-text">AI Score</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: MARKET ANALYSIS ── */}
      {activeTab === 'market' && (
        <div className="sam-market-layout">
          {/* Filters */}
          <div className="sam-market-filters">
            <div className="sam-filter-group">
              <label>Region</label>
              <select value={mktRegion} onChange={e => setMktRegion(e.target.value)}>
                <option value="All">All Regions</option>
                {Object.keys(REGION_COORDS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sam-filter-group">
              <label>Season</label>
              <select value={mktSeason} onChange={e => setMktSeason(e.target.value)}>
                <option value="All">All Seasons</option>
                <option value="Rabi">Rabi</option>
                <option value="Kharif">Kharif</option>
                <option value="Zaid">Zaid</option>
              </select>
            </div>
            <button className="sam-btn-fetch" onClick={loadMarketData}>
              🔄 Refresh Data
            </button>
          </div>

          {mktLoading && (
            <div className="sam-loading">
              <div className="sam-spinner" />
              <p>Loading market intelligence…</p>
            </div>
          )}

          {mktError && <div className="sam-error">⚠️ {mktError}</div>}

          {/* Cards */}
          {!mktLoading && (
            <div className="sam-market-grid">
              {filteredMarket.map((item, i) => {
                const maxPrice = Math.max(...(item.priceHistory || [1]));
                return (
                  <div key={item.productName + i} className="sam-market-card" style={{ animationDelay: `${i * 0.06}s` }}>
                    {/* Card header */}
                    <div className="sam-market-card-header">
                      <h4>🌾 {item.productName}</h4>
                      <span className={`sam-trend-badge ${getTrendClass(item.priceTrend)}`}>
                        {getTrendIcon(item.priceTrend)} {item.priceTrend}
                      </span>
                    </div>

                    {/* Meta chips */}
                    <div className="sam-market-meta">
                      {item.variety && <span className="sam-meta-chip">{item.variety}</span>}
                      {item.region && <span className="sam-meta-chip">📍 {item.region}</span>}
                      {item.season && <span className="sam-meta-chip">📅 {item.season}</span>}
                    </div>

                    {/* Demand / Supply bars */}
                    <div className="sam-ds-row">
                      <div className={`sam-ds-item sam-level-${item.demandLevel?.toLowerCase()}`}>
                        <label>
                          <span>Demand</span>
                          <span style={{ fontWeight: 700, color: item.demandLevel === 'High' ? '#155724' : item.demandLevel === 'Low' ? '#721c24' : '#856404' }}>
                            {item.demandLevel}
                          </span>
                        </label>
                        <div className="sam-ds-bar">
                          <div className="sam-ds-fill fill-demand" style={{ width: `${getDSPercent(item.demandLevel)}%` }} />
                        </div>
                      </div>
                      <div className={`sam-ds-item sam-level-${item.supplyLevel?.toLowerCase()}`}>
                        <label>
                          <span>Supply</span>
                          <span style={{ fontWeight: 700, color: item.supplyLevel === 'Low' ? '#155724' : item.supplyLevel === 'High' ? '#721c24' : '#856404' }}>
                            {item.supplyLevel}
                          </span>
                        </label>
                        <div className="sam-ds-bar">
                          <div className="sam-ds-fill fill-supply" style={{ width: `${getDSPercent(item.supplyLevel)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Price Chart */}
                    {item.priceHistory?.length > 0 && (
                      <div className="sam-price-section">
                        <h5>Price Trend (BDT/Mon) — Last {item.priceHistory.length} weeks</h5>
                        <div className="sam-price-chart">
                          {item.priceHistory.map((p, j) => (
                            <div
                              key={j}
                              className="sam-price-bar"
                              style={{ height: `${Math.round((p / maxPrice) * 100)}%` }}
                              data-price={`৳${p}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Forecast */}
                    {item.forecastSummary && (
                      <div className="sam-market-forecast">
                        💡 {item.forecastSummary}
                      </div>
                    )}

                    {/* Recommendation */}
                    {item.recommendation && (
                      <div className="sam-market-forecast" style={{ borderLeftColor: '#344e41', background: 'linear-gradient(135deg,#f0faf0,#e8f5e9)', marginTop: 8 }}>
                        ✅ <strong>Action:</strong> {item.recommendation}
                      </div>
                    )}

                    {/* Confidence */}
                    <div className="sam-confidence">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      AI Confidence: <span className="conf-val">{item.confidenceScore}%</span>
                    </div>
                  </div>
                );
              })}
              {filteredMarket.length === 0 && !mktLoading && (
                <div className="sam-empty" style={{ gridColumn: '1/-1' }}>
                  <span className="sam-empty-icon">📊</span>
                  <h4>No Data Found</h4>
                  <p>Try changing region or season filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
