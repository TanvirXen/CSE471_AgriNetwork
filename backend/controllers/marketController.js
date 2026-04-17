const CropPlan = require("../models/CropPlan");
const MarketInsight = require("../models/MarketInsight");

// @route   GET /api/market/insights
// @desc    Get market insights and trends
// @access  Public
exports.getMarketInsights = async (req, res) => {
  try {
    const { region, category } = req.query;
    const filter = {};
    if (region) filter.region = region;
    if (category) filter.categoryId = category;

    const insights = await MarketInsight.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    res.json(insights);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/market/crop-plans
// @desc    Get all crop plans for the user
// @access  Private
exports.getCropPlans = async (req, res) => {
  try {
    const plans = await CropPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/market/crop-plans
// @desc    Create a new AI-based crop plan
// @access  Private
exports.createCropPlan = async (req, res) => {
  try {
    const { landArea, landUnit, region, district, season, soilType, budget } = req.body;

    // Simulation of AI Recommendation Logic
    const recommendations = [
      {
        cropName: "Boro Rice",
        variety: "BRRI dhan28",
        recommendationScore: 92,
        expectedYield: landArea * 2.5, // 2.5 tons per acre
        expectedMarketPrice: 28000,
        profitabilityScore: 85,
        reason: "Ideal soil and upcoming favorable monsoon season in " + district,
      },
      {
        cropName: "Mustard",
        variety: "BARI Sarisha-14",
        recommendationScore: 78,
        expectedYield: landArea * 0.8,
        expectedMarketPrice: 45000,
        profitabilityScore: 72,
        reason: "Low water consumption and high market demand predicted for " + season,
      }
    ];

    const newPlan = new CropPlan({
      userId: req.user.id,
      landArea,
      landUnit,
      region,
      district,
      season,
      soilType,
      budget,
      recommendations,
      generatedBy: "AI",
      modelVersion: "AgriBrain-v1.2",
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/market/seed
// @desc    Seed market insights data
// @access  Public (Dev only)
exports.seedMarketData = async (req, res) => {
  try {
    const sampleInsights = [
      {
        productName: "Tomato",
        variety: "Premium",
        region: "Rajshahi",
        season: "Winter",
        demandLevel: "High",
        supplyLevel: "Medium",
        priceTrend: "Up",
        forecastSummary: "Due to unseasonal rain, supply is expected to dip, driving prices higher.",
        recommendation: "Hold stock for 2 weeks or harvest early to capture peak prices.",
        confidenceScore: 88,
        priceHistory: [
          { date: new Date(Date.now() - 86400000 * 7), averagePrice: 45 },
          { date: new Date(Date.now() - 86400000 * 1), averagePrice: 52 }
        ]
      },
      {
        productName: "Potato",
        variety: "Diamond",
        region: "Bogura",
        season: "Winter",
        demandLevel: "Medium",
        supplyLevel: "High",
        priceTrend: "Stable",
        forecastSummary: "Bumper harvest expected in Northern regions.",
        recommendation: "Focus on cold storage to avoid glut prices.",
        confidenceScore: 94,
        priceHistory: [
          { date: new Date(Date.now() - 86400000 * 7), averagePrice: 22 },
          { date: new Date(Date.now() - 86400000 * 1), averagePrice: 23 }
        ]
      }
    ];

    await MarketInsight.deleteMany({});
    const created = await MarketInsight.insertMany(sampleInsights);

    res.json({ message: "Market insights seeded", count: created.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
