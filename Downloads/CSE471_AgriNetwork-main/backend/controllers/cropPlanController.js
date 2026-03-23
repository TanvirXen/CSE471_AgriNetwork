const CropPlan = require('../models/CropPlan');

/* ─── Rule-Based AI Recommendation Engine ─── */
const CROP_DB = [
  {
    cropName: 'Boro Rice', variety: 'BR-28 / BRRI dhan28',
    seasons: ['Rabi'], soils: ['Clay', 'Loam', 'Silt'],
    regions: ['Dhaka', 'Rajshahi', 'Mymensingh', 'Barishal'],
    minBudgetPerAcre: 8000, needsIrrigation: true,
    baseScore: 88, yieldPerAcre: 55, pricePerMon: 900,
    reason: 'High-yield irrigated rice. Best for Rabi season with assured water supply.',
  },
  {
    cropName: 'Wheat', variety: 'BARI Gom-26',
    seasons: ['Rabi'], soils: ['Loam', 'Silt', 'Sandy'],
    regions: ['Rajshahi', 'Khulna', 'Dhaka'],
    minBudgetPerAcre: 6000, needsIrrigation: false,
    baseScore: 82, yieldPerAcre: 30, pricePerMon: 1100,
    reason: 'Cool-weather crop ideal for Rabi. Good market price and moderate input cost.',
  },
  {
    cropName: 'Mustard', variety: 'BARI Sarisha-14',
    seasons: ['Rabi'], soils: ['Loam', 'Clay', 'Silt'],
    regions: ['Rajshahi', 'Khulna', 'Barishal', 'Dhaka'],
    minBudgetPerAcre: 4500, needsIrrigation: false,
    baseScore: 79, yieldPerAcre: 12, pricePerMon: 2400,
    reason: 'High-value oilseed with strong demand. Low input cost, great profit margin.',
  },
  {
    cropName: 'Aus Rice', variety: 'BRRI dhan48',
    seasons: ['Kharif'], soils: ['Clay', 'Loam'],
    regions: ['Sylhet', 'Chittagong', 'Dhaka', 'Mymensingh'],
    minBudgetPerAcre: 7500, needsIrrigation: false,
    baseScore: 74, yieldPerAcre: 40, pricePerMon: 800,
    reason: 'Flood-tolerant Kharif variety for monsoon season. Suitable for low-lying areas.',
  },
  {
    cropName: 'Jute', variety: 'CVE-3',
    seasons: ['Kharif'], soils: ['Loam', 'Silt', 'Sandy'],
    regions: ['Rajshahi', 'Mymensingh', 'Dhaka'],
    minBudgetPerAcre: 5500, needsIrrigation: false,
    baseScore: 71, yieldPerAcre: 25, pricePerMon: 1800,
    reason: 'Golden fiber with industrial demand. Suitable for Kharif on flood plains.',
  },
  {
    cropName: 'Tomato', variety: 'BARI Tomato-14',
    seasons: ['Rabi'], soils: ['Sandy', 'Loam'],
    regions: ['Rajshahi', 'Dhaka', 'Chittagong', 'Mymensingh'],
    minBudgetPerAcre: 12000, needsIrrigation: true,
    baseScore: 86, yieldPerAcre: 180, pricePerMon: 600,
    reason: 'High-value vegetable with excellent market demand. Requires irrigation and good soil preparation.',
  },
  {
    cropName: 'Potato', variety: 'Cardinal / Granola',
    seasons: ['Rabi'], soils: ['Sandy', 'Loam'],
    regions: ['Rajshahi', 'Rangpur', 'Dhaka'],
    minBudgetPerAcre: 14000, needsIrrigation: true,
    baseScore: 84, yieldPerAcre: 280, pricePerMon: 350,
    reason: 'Staple vegetable with mass market demand. High production cost but consistent pricing.',
  },
  {
    cropName: 'Onion', variety: 'BARI Piaz-1',
    seasons: ['Rabi'], soils: ['Loam', 'Clay'],
    regions: ['Rajshahi', 'Pabna', 'Dhaka'],
    minBudgetPerAcre: 11000, needsIrrigation: true,
    baseScore: 83, yieldPerAcre: 100, pricePerMon: 950,
    reason: 'Essential ingredient with persistent high demand and strong market price.',
  },
  {
    cropName: 'Lentil (Masur Dal)', variety: 'BARI Masur-4',
    seasons: ['Rabi'], soils: ['Loam', 'Silt', 'Clay'],
    regions: ['Rajshahi', 'Dhaka', 'Khulna'],
    minBudgetPerAcre: 4000, needsIrrigation: false,
    baseScore: 77, yieldPerAcre: 14, pricePerMon: 3500,
    reason: 'High-protein pulse with rising market value. Low water requirement and good gross profit.',
  },
  {
    cropName: 'Watermelon', variety: 'Syngenta Kiran',
    seasons: ['Zaid', 'Kharif'], soils: ['Sandy', 'Loam'],
    regions: ['Khulna', 'Barishal', 'Chittagong', 'Rajshahi'],
    minBudgetPerAcre: 15000, needsIrrigation: true,
    baseScore: 80, yieldPerAcre: 280, pricePerMon: 280,
    reason: 'High-demand summer fruit. Sandy loam soil required. Good wholesale market potential.',
  },
  {
    cropName: 'Maize', variety: 'BARI Corn-9',
    seasons: ['Rabi', 'Kharif'], soils: ['Loam', 'Sandy', 'Silt'],
    regions: ['Rangpur', 'Rajshahi', 'Chittagong'],
    minBudgetPerAcre: 7000, needsIrrigation: false,
    baseScore: 78, yieldPerAcre: 55, pricePerMon: 1000,
    reason: 'Versatile feed grain with growing poultry sector demand. Suitable for diverse soil types.',
  },
  {
    cropName: 'Bitter Gourd', variety: 'BARI Karala-1',
    seasons: ['Kharif', 'Zaid'], soils: ['Loam', 'Sandy'],
    regions: ['Khulna', 'Dhaka', 'Mymensingh', 'Chittagong'],
    minBudgetPerAcre: 9000, needsIrrigation: true,
    baseScore: 76, yieldPerAcre: 120, pricePerMon: 700,
    reason: 'Popular summer vegetable with reliable local demand. Multiple harvests per season.',
  },
];

function computeScore(crop, input) {
  let score = crop.baseScore;

  if (!crop.seasons.includes(input.season)) score -= 30;
  if (!crop.soils.includes(input.soilType)) score -= 15;

  const regionMatch = crop.regions.some(r =>
    r.toLowerCase().includes((input.region || '').toLowerCase()) ||
    (input.region || '').toLowerCase().includes(r.toLowerCase())
  );
  if (!regionMatch) score -= 10;

  const budgetNeeded = crop.minBudgetPerAcre * (input.landArea || 1);
  if (input.budget < budgetNeeded * 0.7) score -= 20;
  else if (input.budget >= budgetNeeded * 1.5) score += 5;

  if (crop.needsIrrigation && !input.irrigationAvailable) score -= 18;
  if (!crop.needsIrrigation && !input.irrigationAvailable) score += 5;

  const grossRevenue = crop.yieldPerAcre * crop.pricePerMon * (input.landArea || 1);
  const cost = crop.minBudgetPerAcre * (input.landArea || 1);
  const profit = grossRevenue - cost;
  const profitabilityScore = Math.min(100, Math.max(0, Math.round((profit / grossRevenue) * 100)));

  return {
    cropName: crop.cropName,
    variety: crop.variety,
    recommendationScore: Math.min(100, Math.max(0, Math.round(score))),
    expectedYield: Math.round(crop.yieldPerAcre * (input.landArea || 1)),
    expectedMarketPrice: crop.pricePerMon,
    profitabilityScore,
    reason: crop.reason,
    grossRevenue,
    estimatedProfit: profit,
  };
}

/* POST /api/crop-plan/analyze */
exports.analyzeCrops = async (req, res) => {
  try {
    const { landArea, landUnit, region, season, soilType, irrigationAvailable, budget, notes } = req.body;

    if (!landArea || !region || !season || !soilType || budget === undefined) {
      return res.status(400).json({ message: 'Missing required fields: landArea, region, season, soilType, budget' });
    }

    const input = {
      landArea: parseFloat(landArea) || 1,
      region: region.trim(),
      season: season.trim(),
      soilType: soilType.trim(),
      irrigationAvailable: Boolean(irrigationAvailable),
      budget: parseFloat(budget) || 0,
    };

    // Run rule engine
    const recommendations = CROP_DB
      .map(crop => computeScore(crop, input))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);

    // Save plan to DB
    let savedPlan = null;
    try {
      const plan = new CropPlan({
        userId: req.user?.id,
        landArea: input.landArea,
        landUnit: landUnit || 'acre',
        region: input.region,
        season: input.season,
        soilType: input.soilType,
        irrigationAvailable: input.irrigationAvailable,
        budget: input.budget,
        recommendations: recommendations.map(r => ({
          cropName: r.cropName,
          variety: r.variety,
          recommendationScore: r.recommendationScore,
          expectedYield: r.expectedYield,
          expectedMarketPrice: r.expectedMarketPrice,
          profitabilityScore: r.profitabilityScore,
          reason: r.reason,
        })),
        generatedBy: 'AI',
        modelVersion: '1.0.0',
        notes: notes || '',
      });
      savedPlan = await plan.save();
    } catch (dbErr) {
      console.warn('CropPlan DB save warning:', dbErr.message);
    }

    return res.json({
      success: true,
      planId: savedPlan?._id,
      input,
      recommendations,
      totalCropsEvaluated: CROP_DB.length,
    });
  } catch (err) {
    console.error('analyzeCrops error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* GET /api/crop-plan/history */
exports.getCropPlanHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const plans = await CropPlan.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    return res.json(plans);
  } catch (err) {
    console.error('getCropPlanHistory error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
