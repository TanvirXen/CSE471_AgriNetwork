import React, { useState, useEffect, useCallback } from 'react';
import './SmartAgroMarket.css';

/* ── Open-Meteo (browser-side fallback for weather strip only) */
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

const REGION_COORDS = {
  Dhaka:      { lat: 23.8103, lon: 90.4125 },
  Rajshahi:   { lat: 24.3745, lon: 88.6042 },
  Chittagong: { lat: 22.3569, lon: 91.7832 },
  Sylhet:     { lat: 24.8949, lon: 91.8687 },
  Khulna:     { lat: 22.8456, lon: 89.5403 },
  Barishal:   { lat: 22.7010, lon: 90.3535 },
  Mymensingh: { lat: 24.7471, lon: 90.4203 },
};

/* ───── Helpers ───── */
const getProfitClass  = (s) => s >= 65 ? 'profit-high' : s >= 40 ? 'profit-mid' : 'profit-low';
const getScoreClass   = (s) => s >= 70 ? 'score-high'  : s >= 50 ? 'score-mid'  : 'score-low';
const getRankClass    = (i) => ['rank-1','rank-2','rank-3'][i] || 'rank-other';
const getTrendClass   = (t) => ({ Up:'trend-up', Down:'trend-down', Stable:'trend-stable' }[t] || 'trend-stable');
const getTrendIcon    = (t) => ({ Up:'↑', Down:'↓', Stable:'→' }[t] || '→');
const getDSPercent    = (l) => ({ High:85, Medium:50, Low:20 }[l] || 50);

/* ───────────────────────────────────────────
   COMPONENT
─────────────────────────────────────────── */
export default function SmartAgroMarket() {
  const [activeTab, setActiveTab] = useState('crop');

  /* Crop Planner */
  const [form, setForm] = useState({
    landArea: '', landUnit: 'acre',
    region: 'Dhaka', season: 'Rabi',
    soilType: 'Loam', irrigationAvailable: true,
    budget: '',
  });
  const [weather, setWeather]           = useState(null);
  const [weatherLoading, setWL]         = useState(false);
  const [recommendations, setRecs]      = useState([]);
  const [analyzing, setAnalyzing]       = useState(false);
  const [cropError, setCropError]       = useState('');
  const [aiStatus, setAiStatus]         = useState(''); // live status message

  /* Market */
  const [mktRegion, setMktRegion]       = useState('All');
  const [mktSeason, setMktSeason]       = useState('All');
  const [marketData, setMarketData]     = useState([]);
  const [mktLoading, setMktLoading]     = useState(false);
  const [mktError, setMktError]         = useState('');
  const [isLiveData, setIsLiveData]     = useState(false);
  const [lastRefresh, setLastRefresh]   = useState(null);

  /* ── Fetch browser-side weather for live strip ── */
  const fetchWeather = useCallback(async (region) => {
    const coords = REGION_COORDS[region];
    if (!coords) return;
    setWL(true);
    try {
      const url = `${WEATHER_BASE}?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relative_humidity_2m&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setWeather(await res.json());
    } catch { setWeather(null); }
    finally  { setWL(false); }
  }, []);

  useEffect(() => { fetchWeather(form.region); }, [form.region, fetchWeather]);

  /* ── Load market data from backend ── */
  const loadMarketData = useCallback(async () => {
    setMktLoading(true);
    setMktError('');
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (mktRegion !== 'All') params.append('region', mktRegion);
      if (mktSeason !== 'All') params.append('season', mktSeason);

      const res = await fetch(`/api/market/insights?${params}`, {
        headers: token ? { 'x-auth-token': token } : {},
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setMarketData(data);
      setIsLiveData(data[0]?.isLive === true);
      setLastRefresh(new Date());
    } catch (err) {
      setMktError('Could not load market data. Showing cached data.');
      setIsLiveData(false);
    } finally {
      setMktLoading(false);
    }
  }, [mktRegion, mktSeason]);

  useEffect(() => {
    if (activeTab === 'market') loadMarketData();
  }, [activeTab, loadMarketData]);

  /* Auto-refresh market every 60 seconds */
  useEffect(() => {
    if (activeTab !== 'market') return;
    const id = setInterval(loadMarketData, 60000);
    return () => clearInterval(id);
  }, [activeTab, loadMarketData]);

  /* ── Form change handler ── */
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ── Analyze & Recommend ── */
  const handleAnalyze = async () => {
    if (!form.landArea || !form.budget) {
      setCropError('Please enter land area and budget.');
      return;
    }
    setCropError('');
    setAnalyzing(true);
    setAiStatus('🌤️ Fetching live weather data…');

    const payload = {
      ...form,
      landArea: parseFloat(form.landArea),
      budget:   parseFloat(form.budget),
    };

    try {
      const token = localStorage.getItem('token');
      setAiStatus('🤖 AI engine analyzing your farm profile…');

      const res = await fetch('/api/market/crop-plans/analyze', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.recommendations?.length) {
          setRecs(data.recommendations);
          if (data.weather) setWeather({ current_weather: { temperature: data.weather.temperature, windspeed: data.weather.windspeed } });
          setAiStatus(`✅ Analysis complete – ${data.generatedBy || 'AI Engine'}`);
          setTimeout(() => setAiStatus(''), 4000);
          return;
        }
      }
      throw new Error('Backend returned empty recommendations');
    } catch (err) {
      // Fully local fallback — never crashes
      setAiStatus('⚡ Using local scoring engine (offline mode)…');
      const localRecs = buildLocalRecs(payload);
      setRecs(localRecs);
      setTimeout(() => setAiStatus(''), 3000);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Local scoring fallback (identical to backend logic) ── */
  function buildLocalRecs(input) {
    const CROPS = [
      { cropName:'Boro Rice', variety:'BRRI dhan28', seasons:['Rabi'], soils:['Clay','Loam','Silt'], regions:['Dhaka','Rajshahi','Mymensingh','Barishal'], minBudgetPerAcre:8000, needsIrrigation:true, baseScore:88, expectedYieldPerAcre:55, pricePerMon:900, reason:'High-yield irrigated rice best for Rabi season with assured water supply.' },
      { cropName:'Wheat', variety:'BARI Gom-26', seasons:['Rabi'], soils:['Loam','Silt','Sandy'], regions:['Rajshahi','Khulna','Dhaka'], minBudgetPerAcre:6000, needsIrrigation:false, baseScore:82, expectedYieldPerAcre:30, pricePerMon:1100, reason:'Cool-weather crop ideal for Rabi. Good market price and moderate input cost.' },
      { cropName:'Mustard', variety:'BARI Sarisha-14', seasons:['Rabi'], soils:['Loam','Clay','Silt'], regions:['Rajshahi','Khulna','Barishal','Dhaka'], minBudgetPerAcre:4500, needsIrrigation:false, baseScore:79, expectedYieldPerAcre:12, pricePerMon:2400, reason:'High-value oilseed with strong demand. Low input cost, good profit margin.' },
      { cropName:'Aus Rice', variety:'BRRI dhan48', seasons:['Kharif'], soils:['Clay','Loam'], regions:['Sylhet','Chittagong','Dhaka','Mymensingh'], minBudgetPerAcre:7500, needsIrrigation:false, baseScore:74, expectedYieldPerAcre:40, pricePerMon:800, reason:'Suitable for early Kharif monsoon. Flood-tolerant variety.' },
      { cropName:'Tomato', variety:'BARI Tomato-14', seasons:['Rabi'], soils:['Sandy','Loam'], regions:['Rajshahi','Dhaka','Chittagong','Mymensingh'], minBudgetPerAcre:12000, needsIrrigation:true, baseScore:86, expectedYieldPerAcre:180, pricePerMon:600, reason:'High-value vegetable with excellent market demand. Requires irrigation.' },
      { cropName:'Potato', variety:'Cardinal / Granola', seasons:['Rabi'], soils:['Sandy','Loam'], regions:['Rajshahi','Rangpur','Dhaka'], minBudgetPerAcre:14000, needsIrrigation:true, baseScore:84, expectedYieldPerAcre:280, pricePerMon:350, reason:'Staple vegetable with mass market demand.' },
      { cropName:'Onion', variety:'BARI Piaz-1', seasons:['Rabi'], soils:['Loam','Clay'], regions:['Rajshahi','Pabna','Faridpur','Dhaka'], minBudgetPerAcre:11000, needsIrrigation:true, baseScore:83, expectedYieldPerAcre:100, pricePerMon:950, reason:'Essential cooking ingredient with persistent high demand.' },
      { cropName:'Lentil (Masur Dal)', variety:'BARI Masur-4', seasons:['Rabi'], soils:['Loam','Silt','Clay'], regions:['Rajshahi','Dhaka','Khulna'], minBudgetPerAcre:4000, needsIrrigation:false, baseScore:77, expectedYieldPerAcre:14, pricePerMon:3500, reason:'High-protein pulse with rising market value. Low water requirement.' },
      { cropName:'Watermelon', variety:'Syngenta Kiran', seasons:['Zaid','Kharif'], soils:['Sandy','Loam'], regions:['Khulna','Barishal','Chittagong','Rajshahi'], minBudgetPerAcre:15000, needsIrrigation:true, baseScore:80, expectedYieldPerAcre:280, pricePerMon:280, reason:'High-demand summer fruit. Good export potential.' },
      { cropName:'Maize', variety:'BARI Corn-9', seasons:['Rabi','Kharif'], soils:['Loam','Sandy','Silt'], regions:['Rangpur','Rajshahi','Chittagong'], minBudgetPerAcre:7000, needsIrrigation:false, baseScore:78, expectedYieldPerAcre:55, pricePerMon:1000, reason:'Versatile feed grain with growing poultry sector demand.' },
    ];
    return CROPS.map(crop => {
      let score = crop.baseScore;
      if (!crop.seasons.includes(input.season))    score -= 30;
      if (!crop.soils.includes(input.soilType))    score -= 15;
      const regionMatch = crop.regions.some(r => r.toLowerCase().includes(input.region.toLowerCase()) || input.region.toLowerCase().includes(r.toLowerCase()));
      if (!regionMatch) score -= 10;
      const budgetNeeded = crop.minBudgetPerAcre * (input.landArea || 1);
      if (input.budget < budgetNeeded * 0.7) score -= 20;
      if (crop.needsIrrigation && !input.irrigationAvailable) score -= 18;
      const grossRevenue = crop.expectedYieldPerAcre * crop.pricePerMon * (input.landArea || 1);
      const profit = grossRevenue - budgetNeeded;
      return {
        ...crop,
        recommendationScore: Math.min(100, Math.max(0, Math.round(score))),
        expectedYield: Math.round(crop.expectedYieldPerAcre * (input.landArea || 1)),
        expectedMarketPrice: crop.pricePerMon,
        profitabilityScore: Math.min(100, Math.max(0, Math.round(profit / grossRevenue * 100))),
        grossRevenue, estimatedProfit: profit, aiInsight: null,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, 6);
  }

  const filteredMarket = marketData.filter(m => {
    if (mktRegion !== 'All' && !m.region?.toLowerCase().includes(mktRegion.toLowerCase())) return false;
    if (mktSeason !== 'All' && m.season !== mktSeason) return false;
    return true;
  });

  /* ── RENDER ── */
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
            <p>AI-powered crop recommendations and live market intelligence</p>
            <span className="sam-badge">🤖 HF Mistral-7B AI + Live Weather</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sam-tabs">
        <button className={`sam-tab ${activeTab==='crop'   ? 'active':''}`} onClick={()=>setActiveTab('crop')}>
          🌾 Crop Planner
        </button>
        <button className={`sam-tab ${activeTab==='market' ? 'active':''}`} onClick={()=>setActiveTab('market')}>
          📊 Market Analysis
        </button>
      </div>

      {/* ══ TAB 1: CROP PLANNER ══ */}
      {activeTab === 'crop' && (
        <div className="sam-layout">
          {/* Form card */}
          <div className="sam-form-card">
            <h3>🔬 Farm Details</h3>

            {/* Live weather strip */}
            {weather?.current_weather && (
              <div className="sam-weather-info">
                <span>🌤️</span>
                <div>
                  <strong>{form.region}:</strong> {weather.current_weather.temperature}°C, {weather.current_weather.windspeed} km/h wind
                  <br/><small style={{color:'#588157'}}>Live via Open-Meteo API (free)</small>
                </div>
              </div>
            )}
            {weatherLoading && (
              <div className="sam-weather-info"><span>⏳</span> <span>Fetching live weather…</span></div>
            )}

            {/* AI status bar */}
            {aiStatus && (
              <div className="sam-weather-info" style={{background:'linear-gradient(135deg,#e8f5f0,#d4edda)',borderLeftColor:'#344e41'}}>
                <span>⚡</span><span>{aiStatus}</span>
              </div>
            )}

            {cropError && <div className="sam-error">⚠️ {cropError}</div>}

            <div className="sam-form-group">
              <label>Land Area</label>
              <div className="sam-input-row">
                <input type="number" min="0.1" step="0.1" name="landArea" placeholder="e.g. 2.5"
                  value={form.landArea} onChange={handleFormChange}/>
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
                {Object.keys(REGION_COORDS).map(r => <option key={r} value={r}>{r}</option>)}
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
              <input type="number" min="0" step="500" name="budget" placeholder="Total budget in BDT"
                value={form.budget} onChange={handleFormChange}/>
            </div>

            <div className="sam-form-group">
              <label>Irrigation</label>
              <div className="sam-toggle-group">
                <span className="sam-toggle-label">
                  {form.irrigationAvailable ? '✅ Irrigation Available' : '❌ No Irrigation'}
                </span>
                <label className="sam-toggle">
                  <input type="checkbox" name="irrigationAvailable"
                    checked={form.irrigationAvailable} onChange={handleFormChange}/>
                  <span className="sam-toggle-slider"/>
                </label>
              </div>
            </div>

            <button className="sam-btn-analyze" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing
                ? <><span style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/> Analyzing…</>
                : <>🤖 Analyze &amp; Recommend</>
              }
            </button>
          </div>

          {/* Results */}
          <div className="sam-results">
            {recommendations.length > 0 && (
              <div className="sam-results-header">
                <h3>🏆 AI Recommendations</h3>
                <span className="sam-results-count">{recommendations.length} crops ranked</span>
              </div>
            )}

            {recommendations.length === 0 && !analyzing && (
              <div className="sam-empty">
                <span className="sam-empty-icon">🌱</span>
                <h4>Ready to Analyze</h4>
                <p>Fill in your farm details and click <strong>Analyze &amp; Recommend</strong> to get AI crop suggestions based on your region, season, soil, and budget.</p>
              </div>
            )}

            {analyzing && (
              <div className="sam-empty" style={{border:'2px solid rgba(88,129,87,0.2)'}}>
                <div className="sam-loading">
                  <div className="sam-spinner"/>
                  <p>🤖 HF AI + weather engine processing your farm data…</p>
                </div>
              </div>
            )}

            {recommendations.map((crop, i) => (
              <div key={crop.cropName+i} className="sam-crop-card" style={{animationDelay:`${i*0.07}s`}}>
                <div className={`sam-crop-rank ${getRankClass(i)}`}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </div>
                <div className="sam-crop-info">
                  <h4>{crop.cropName}</h4>
                  <div className="sam-crop-variety">{crop.variety}</div>

                  {/* HF AI insight (if available) */}
                  {crop.aiInsight && (
                    <div className="sam-crop-reason" style={{
                      background:'linear-gradient(135deg,#f0faf0,#e8f5e9)',
                      borderLeft:'3px solid #4caf50', padding:'8px 12px',
                      borderRadius:'6px', marginBottom:'8px', fontSize:'0.83rem'
                    }}>
                      🤖 <strong>AI Insight:</strong> {crop.aiInsight}
                    </div>
                  )}

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
                      <span className={`sam-profit-badge ${getProfitClass(crop.profitabilityScore)}`}>
                        {crop.profitabilityScore>=65?'📈':crop.profitabilityScore>=40?'➡️':'📉'} {crop.profitabilityScore}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sam-score-circle">
                  <div className={`sam-score-ring ${getScoreClass(crop.recommendationScore)}`}>
                    {crop.recommendationScore}
                  </div>
                  <span className="sam-score-text">AI Score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 2: MARKET ANALYSIS ══ */}
      {activeTab === 'market' && (
        <div className="sam-market-layout">
          <div className="sam-market-filters">
            <div className="sam-filter-group">
              <label>Region</label>
              <select value={mktRegion} onChange={e=>setMktRegion(e.target.value)}>
                <option value="All">All Regions</option>
                {Object.keys(REGION_COORDS).map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sam-filter-group">
              <label>Season</label>
              <select value={mktSeason} onChange={e=>setMktSeason(e.target.value)}>
                <option value="All">All Seasons</option>
                <option value="Rabi">Rabi</option>
                <option value="Kharif">Kharif</option>
                <option value="Zaid">Zaid</option>
              </select>
            </div>
            <button className="sam-btn-fetch" onClick={loadMarketData}>🔄 Refresh</button>
            {isLiveData && (
              <span style={{fontSize:'0.78rem',color:'#2d6a4f',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}>
                ⚡ Live Data {lastRefresh && `· ${lastRefresh.toLocaleTimeString()}`}
              </span>
            )}
          </div>

          {mktLoading && (
            <div className="sam-loading"><div className="sam-spinner"/><p>Loading live market intelligence…</p></div>
          )}
          {mktError && <div className="sam-error">⚠️ {mktError}</div>}

          {!mktLoading && (
            <div className="sam-market-grid">
              {filteredMarket.map((item, i) => {
                const maxPrice = Math.max(...(item.priceHistory || [1]));
                return (
                  <div key={item.productName+i} className="sam-market-card" style={{animationDelay:`${i*0.06}s`}}>
                    <div className="sam-market-card-header">
                      <h4>🌾 {item.productName}</h4>
                      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                        {item.isLive && <span style={{fontSize:'0.7rem',background:'#d4edda',color:'#155724',padding:'2px 6px',borderRadius:'8px',fontWeight:700}}>⚡ Live</span>}
                        <span className={`sam-trend-badge ${getTrendClass(item.priceTrend)}`}>
                          {getTrendIcon(item.priceTrend)} {item.priceTrend}
                        </span>
                      </div>
                    </div>

                    <div className="sam-market-meta">
                      {item.region  && <span className="sam-meta-chip">📍 {item.region}</span>}
                      {item.season  && <span className="sam-meta-chip">📅 {item.season}</span>}
                      {item.currentPrice && <span className="sam-meta-chip" style={{background:'#fff3cd',color:'#856404'}}>৳{item.currentPrice}/Mon</span>}
                    </div>

                    <div className="sam-ds-row">
                      <div className={`sam-ds-item sam-level-${item.demandLevel?.toLowerCase()}`}>
                        <label>
                          <span>Demand</span>
                          <span style={{fontWeight:700,color:item.demandLevel==='High'?'#155724':item.demandLevel==='Low'?'#721c24':'#856404'}}>{item.demandLevel}</span>
                        </label>
                        <div className="sam-ds-bar"><div className="sam-ds-fill fill-demand" style={{width:`${getDSPercent(item.demandLevel)}%`}}/></div>
                      </div>
                      <div className={`sam-ds-item sam-level-${item.supplyLevel?.toLowerCase()}`}>
                        <label>
                          <span>Supply</span>
                          <span style={{fontWeight:700,color:item.supplyLevel==='Low'?'#155724':item.supplyLevel==='High'?'#721c24':'#856404'}}>{item.supplyLevel}</span>
                        </label>
                        <div className="sam-ds-bar"><div className="sam-ds-fill fill-supply" style={{width:`${getDSPercent(item.supplyLevel)}%`}}/></div>
                      </div>
                    </div>

                    {item.priceHistory?.length > 0 && (
                      <div className="sam-price-section">
                        <h5>Price Trend (BDT/Mon) — Last {item.priceHistory.length} weeks</h5>
                        <div className="sam-price-chart">
                          {item.priceHistory.map((p, j) => (
                            <div key={j} className="sam-price-bar"
                              style={{height:`${Math.round((p/maxPrice)*100)}%`}}
                              data-price={`৳${p}`}/>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.forecastSummary && (
                      <div className="sam-market-forecast">💡 {item.forecastSummary}</div>
                    )}
                    {item.recommendation && (
                      <div className="sam-market-forecast" style={{borderLeftColor:'#344e41',background:'linear-gradient(135deg,#f0faf0,#e8f5e9)',marginTop:8}}>
                        ✅ <strong>Action:</strong> {item.recommendation}
                      </div>
                    )}

                    <div className="sam-confidence">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      AI Confidence: <span className="conf-val">{item.confidenceScore}%</span>
                    </div>
                  </div>
                );
              })}
              {filteredMarket.length === 0 && !mktLoading && (
                <div className="sam-empty" style={{gridColumn:'1/-1'}}>
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
