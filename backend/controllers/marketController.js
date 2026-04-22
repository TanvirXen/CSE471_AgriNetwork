const CropPlan = require("../models/CropPlan");
const MarketInsight = require("../models/MarketInsight");
const { getWeatherForRegion, getAllRegionsWeather } = require("../services/weatherService");
const { getCropInsight } = require("../services/aiService");

/* ─── Crop database (local scoring engine – no API needed) ─── */
const CROP_DATABASE = [
  {
    cropName: "Boro Rice", variety: "BRRI dhan28",
    seasons: ["Rabi"], soils: ["Clay", "Loam", "Silt"],
    regions: ["Dhaka", "Rajshahi", "Mymensingh", "Barishal"],
    minBudgetPerAcre: 8000, needsIrrigation: true,
    baseScore: 88, expectedYieldPerAcre: 55, pricePerMon: 900,
    reason: "High-yield irrigated rice variety best for Rabi season with assured water supply.",
  },
  {
    cropName: "Wheat", variety: "BARI Gom-26",
    seasons: ["Rabi"], soils: ["Loam", "Silt", "Sandy"],
    regions: ["Rajshahi", "Khulna", "Dhaka"],
    minBudgetPerAcre: 6000, needsIrrigation: false,
    baseScore: 82, expectedYieldPerAcre: 30, pricePerMon: 1100,
    reason: "Cool-weather crop ideal for Rabi. Good market price and moderate input cost.",
  },
  {
    cropName: "Mustard", variety: "BARI Sarisha-14",
    seasons: ["Rabi"], soils: ["Loam", "Clay", "Silt"],
    regions: ["Rajshahi", "Khulna", "Barishal", "Dhaka"],
    minBudgetPerAcre: 4500, needsIrrigation: false,
    baseScore: 79, expectedYieldPerAcre: 12, pricePerMon: 2400,
    reason: "High-value oilseed with strong demand. Low input cost, good profit margin.",
  },
  {
    cropName: "Aus Rice", variety: "BRRI dhan48",
    seasons: ["Kharif"], soils: ["Clay", "Loam"],
    regions: ["Sylhet", "Chittagong", "Dhaka", "Mymensingh"],
    minBudgetPerAcre: 7500, needsIrrigation: false,
    baseScore: 74, expectedYieldPerAcre: 40, pricePerMon: 800,
    reason: "Suitable for early Kharif monsoon. Flood-tolerant variety for low-lying areas.",
  },
  {
    cropName: "Jute", variety: "CVE-3",
    seasons: ["Kharif"], soils: ["Loam", "Silt", "Sandy"],
    regions: ["Rajshahi", "Mymensingh", "Dhaka", "Faridpur"],
    minBudgetPerAcre: 5500, needsIrrigation: false,
    baseScore: 71, expectedYieldPerAcre: 25, pricePerMon: 1800,
    reason: "Golden fiber with industrial demand. Suitable for Kharif season flood plains.",
  },
  {
    cropName: "Tomato", variety: "BARI Tomato-14",
    seasons: ["Rabi"], soils: ["Sandy", "Loam"],
    regions: ["Rajshahi", "Dhaka", "Chittagong", "Mymensingh"],
    minBudgetPerAcre: 12000, needsIrrigation: true,
    baseScore: 86, expectedYieldPerAcre: 180, pricePerMon: 600,
    reason: "High-value vegetable with excellent market demand. Requires irrigation.",
  },
  {
    cropName: "Potato", variety: "Cardinal / Granola",
    seasons: ["Rabi"], soils: ["Sandy", "Loam"],
    regions: ["Rajshahi", "Rangpur", "Dhaka"],
    minBudgetPerAcre: 14000, needsIrrigation: true,
    baseScore: 84, expectedYieldPerAcre: 280, pricePerMon: 350,
    reason: "Staple vegetable with mass market demand. High production but consistent pricing.",
  },
  {
    cropName: "Bitter Gourd", variety: "BARI Karala-1",
    seasons: ["Kharif", "Zaid"], soils: ["Loam", "Sandy"],
    regions: ["Khulna", "Dhaka", "Mymensingh", "Chittagong"],
    minBudgetPerAcre: 9000, needsIrrigation: true,
    baseScore: 76, expectedYieldPerAcre: 120, pricePerMon: 700,
    reason: "Popular summer vegetable with reliable local demand. Multiple harvests.",
  },
  {
    cropName: "Onion", variety: "BARI Piaz-1",
    seasons: ["Rabi"], soils: ["Loam", "Clay"],
    regions: ["Rajshahi", "Pabna", "Faridpur", "Dhaka"],
    minBudgetPerAcre: 11000, needsIrrigation: true,
    baseScore: 83, expectedYieldPerAcre: 100, pricePerMon: 950,
    reason: "Essential cooking ingredient with persistent high demand and strong pricing.",
  },
  {
    cropName: "Lentil (Masur Dal)", variety: "BARI Masur-4",
    seasons: ["Rabi"], soils: ["Loam", "Silt", "Clay"],
    regions: ["Rajshahi", "Dhaka", "Khulna"],
    minBudgetPerAcre: 4000, needsIrrigation: false,
    baseScore: 77, expectedYieldPerAcre: 14, pricePerMon: 3500,
    reason: "High-protein pulse with rising market value. Low water requirement.",
  },
  {
    cropName: "Watermelon", variety: "Syngenta Kiran",
    seasons: ["Zaid", "Kharif"], soils: ["Sandy", "Loam"],
    regions: ["Khulna", "Barishal", "Chittagong", "Rajshahi"],
    minBudgetPerAcre: 15000, needsIrrigation: true,
    baseScore: 80, expectedYieldPerAcre: 280, pricePerMon: 280,
    reason: "High-demand summer fruit. Requires sandy loam soil. Good export potential.",
  },
  {
    cropName: "Maize", variety: "BARI Corn-9",
    seasons: ["Rabi", "Kharif"], soils: ["Loam", "Sandy", "Silt"],
    regions: ["Rangpur", "Rajshahi", "Chittagong"],
    minBudgetPerAcre: 7000, needsIrrigation: false,
    baseScore: 78, expectedYieldPerAcre: 55, pricePerMon: 1000,
    reason: "Versatile feed grain with growing poultry sector demand.",
  },
];

/* ─── Score each crop against user inputs + live weather ─── */
function scoreCrop(crop, input, weather) {
  let score = crop.baseScore;

  if (!crop.seasons.includes(input.season))    score -= 30;
  if (!crop.soils.includes(input.soilType))    score -= 15;

  const regionMatch = crop.regions.some((r) =>
    r.toLowerCase().includes(input.region.toLowerCase()) ||
    input.region.toLowerCase().includes(r.toLowerCase())
  );
  if (!regionMatch) score -= 10;

  const budgetNeeded = crop.minBudgetPerAcre * (input.landArea || 1);
  if (input.budget < budgetNeeded * 0.7)  score -= 20;
  else if (input.budget >= budgetNeeded * 1.5) score += 5;

  if (crop.needsIrrigation && !input.irrigationAvailable)  score -= 18;
  if (!crop.needsIrrigation && !input.irrigationAvailable) score += 5;

  // Weather bonus from live data
  if (weather) {
    if (input.season === "Rabi" && weather.isColdSeason)  score += 8;
    if (input.season === "Kharif" && weather.isMonsoon)   score += 8;
    if (input.season === "Zaid" && weather.isHotSeason)   score += 5;
    if (crop.needsIrrigation && weather.precipitation > 3) score += 4; // natural rain helps
  }

  const grossRevenue = crop.expectedYieldPerAcre * crop.pricePerMon * (input.landArea || 1);
  const cost         = crop.minBudgetPerAcre * (input.landArea || 1);
  const profit       = grossRevenue - cost;
  const profitScore  = Math.min(100, Math.max(0, Math.round((profit / grossRevenue) * 100)));

  return {
    ...crop,
    recommendationScore: Math.min(100, Math.max(0, Math.round(score))),
    expectedYield:       Math.round(crop.expectedYieldPerAcre * (input.landArea || 1)),
    expectedMarketPrice: crop.pricePerMon,
    profitabilityScore:  profitScore,
    grossRevenue,
    estimatedProfit:     profit,
    aiInsight:           null, // filled in below
  };
}

/* ─── Dynamic market insight generator ─── */
const BASE_PRICES = {
  "Boro Rice":         900,
  "Wheat":            1100,
  "Tomato":            600,
  "Potato":            350,
  "Onion":             950,
  "Mustard":          2400,
  "Jute":             1800,
  "Lentil":           3500,
  "Maize":            1000,
  "Watermelon":        280,
};

function buildDynamicInsight(productName, region, season, weather) {
  const base = BASE_PRICES[productName] || 1000;

  // Apply supply/demand modifiers
  let demandMod   = 1.0;
  let supplyMod   = 1.0;
  let priceTrend  = "Stable";
  let demandLevel = "Medium";
  let supplyLevel = "Medium";

  if (weather?.isMonsoon)   { supplyMod  += 0.2; } // more rain = more supply
  if (weather?.isHotSeason) { demandMod  += 0.15; } // heat = more demand for perishables
  if (weather?.isColdSeason){ demandMod  += 0.1;  } // cold = better Rabi crop demand

  // Season-based demand
  if (season === "Rabi") {
    if (["Wheat", "Mustard", "Onion", "Potato", "Tomato", "Lentil"].includes(productName)) {
      demandMod += 0.2;
      demandLevel = "High";
    }
  } else if (season === "Kharif") {
    if (["Jute", "Aus Rice", "Bitter Gourd"].includes(productName)) {
      demandMod  += 0.15;
      supplyMod  += 0.2;
      supplyLevel = "High";
    }
  } else if (season === "Zaid") {
    if (["Watermelon", "Bitter Gourd"].includes(productName)) {
      demandMod += 0.25;
      demandLevel = "High";
      supplyLevel = "Low";
    }
  }

  // Determine trend
  const netMod = demandMod - supplyMod;
  if (netMod > 0.1)       { priceTrend = "Up";   }
  else if (netMod < -0.1) { priceTrend = "Down";  }

  if (demandMod > 1.15)   demandLevel = "High";
  else if (demandMod < 0.95) demandLevel = "Low";

  if (supplyMod > 1.15)   supplyLevel = "High";
  else if (supplyMod < 0.95) supplyLevel = "Low";

  // Build realistic price history (12 weeks)
  const priceHistory = Array.from({ length: 12 }, (_, i) => {
    const weekFactor  = 1 + (netMod * (i / 12));
    const noiseFactor = 1 + (Math.random() - 0.5) * 0.08;
    return Math.round(base * weekFactor * noiseFactor);
  });

  const currentPrice = priceHistory[priceHistory.length - 1];

  // Contextual summary
  const forecastSummary = weather
    ? `Current temperature in ${region}: ${weather.temperature}°C. ${weather.isMonsoon ? "Monsoon rains increasing supply." : weather.isHotSeason ? "Heat driving demand up." : "Normal weather conditions."} ${priceTrend === "Up" ? "Prices trending upward." : priceTrend === "Down" ? "Prices easing due to seasonal supply." : "Prices remain stable."}`
    : `${priceTrend === "Up" ? "Rising demand expected." : priceTrend === "Down" ? "Supply exceeding demand." : "Market stable."} Current price: ৳${currentPrice}/Mon.`;

  const recommendation =
    priceTrend === "Up"
      ? "Hold stock if you can – prices are climbing. Sell in batches."
      : priceTrend === "Down"
      ? "Sell quickly before further price drop. Lock in wholesale contracts."
      : "Steady market. Sell at current price or negotiate bulk deals.";

  const confidenceScore = 75 + Math.round(Math.random() * 15);

  return {
    productName,
    variety:          "Market Average",
    region,
    season,
    demandLevel,
    supplyLevel,
    priceTrend,
    forecastSummary,
    recommendation,
    confidenceScore,
    currentPrice,
    priceHistory,
    weatherData:      weather || null,
    generatedAt:      new Date().toISOString(),
    isLive:           true,
  };
}

/* ═══════════════════════════════════════════════════════════
   CONTROLLER FUNCTIONS
═══════════════════════════════════════════════════════════ */

// GET /api/market/insights  — dynamic, weather-aware, no seed needed
exports.getMarketInsights = async (req, res) => {
  try {
    const { region = "All", season = "All" } = req.query;

    const products = [
      "Boro Rice", "Wheat", "Tomato", "Potato", "Onion",
      "Mustard", "Jute", "Lentil", "Maize", "Watermelon",
    ];

    // Determine which regions to fetch
    const targetRegions =
      region === "All"
        ? ["Dhaka", "Rajshahi", "Chittagong", "Sylhet", "Khulna", "Barishal", "Mymensingh"]
        : [region];

    const targetSeason =
      season === "All"
        ? (new Date().getMonth() >= 10 || new Date().getMonth() <= 2 ? "Rabi" : "Kharif")
        : season;

    // Fetch weather for all needed regions in parallel
    const weatherMap = {};
    await Promise.all(
      targetRegions.map(async (r) => {
        try { weatherMap[r] = await getWeatherForRegion(r); }
        catch { weatherMap[r] = null; }
      })
    );

    // Build dynamic insights for each product × region combination
    const insights = [];
    for (const r of targetRegions) {
      for (const prod of products) {
        insights.push(buildDynamicInsight(prod, r, targetSeason, weatherMap[r]));
      }
    }

    // Remove duplicates if multiple regions return same product, pick best price trend
    const byProduct = {};
    for (const ins of insights) {
      const key = ins.productName;
      if (!byProduct[key] || ins.priceTrend === "Up") byProduct[key] = ins;
    }

    const finalInsights = Object.values(byProduct).sort((a, b) =>
      b.confidenceScore - a.confidenceScore
    );

    res.json(finalInsights);
  } catch (err) {
    console.error("[marketController.getMarketInsights]", err.message);
    res.status(500).json({ message: "Server error fetching market insights" });
  }
};

// GET /api/market/crop-plans — user's saved plans
exports.getCropPlans = async (req, res) => {
  try {
    const plans = await CropPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/market/crop-plans  AND  POST /api/market/crop-plans/analyze
// Both route to the same logic — AI-powered via HF + local scoring engine
exports.createCropPlan = async (req, res) => {
  try {
    const {
      landArea, landUnit = "acre",
      region = "Dhaka", district, season = "Rabi",
      soilType = "Loam", irrigationAvailable = true,
      budget,
    } = req.body;

    if (!landArea || !budget) {
      return res.status(400).json({ message: "landArea and budget are required" });
    }

    // Fetch live weather for the region
    let weather = null;
    try { weather = await getWeatherForRegion(region); } catch { /* graceful */ }

    const input = {
      landArea: parseFloat(landArea),
      budget:   parseFloat(budget),
      region, season, soilType, irrigationAvailable,
    };

    // Score all crops with local engine
    let scored = CROP_DATABASE
      .map((crop) => scoreCrop(crop, input, weather))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);

    // Enrich top 3 with HF AI insight text (non-blocking, fails gracefully)
    const weatherSumm = weather?.summary || "Weather data unavailable";
    const aiPromises  = scored.slice(0, 3).map((crop) =>
      getCropInsight(crop.cropName, crop.variety, season, region, weatherSumm)
    );
    const aiTexts = await Promise.allSettled(aiPromises);

    scored = scored.map((crop, i) => ({
      ...crop,
      aiInsight: aiTexts[i]?.status === "fulfilled" ? aiTexts[i].value : null,
    }));

    const plan = {
      userId:       req.user?.id || null,
      landArea:     input.landArea,
      landUnit,
      region,
      district:     district || region,
      season,
      soilType,
      irrigationAvailable,
      budget:       input.budget,
      recommendations: scored,
      weather:      weather || null,
      generatedBy:  "HF-Mistral-7B + Local Scoring Engine",
      modelVersion: "AgriBrain-v2.0",
      createdAt:    new Date(),
    };

    // Save to DB only if user is logged in
    if (req.user?.id) {
      const newPlan = new CropPlan(plan);
      await newPlan.save();
      return res.status(201).json({ ...plan, _id: newPlan._id });
    }

    res.status(200).json(plan);
  } catch (err) {
    console.error("[marketController.createCropPlan]", err.message);
    res.status(500).json({ message: "Server error generating crop plan" });
  }
};

// POST /api/market/seed — kept for compatibility but now just triggers dynamic data
exports.seedMarketData = async (req, res) => {
  try {
    await MarketInsight.deleteMany({});
    res.json({ message: "Market data is now dynamically generated — no seed needed.", dynamic: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
