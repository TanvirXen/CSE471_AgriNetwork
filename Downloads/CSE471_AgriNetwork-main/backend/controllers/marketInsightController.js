const MarketInsight = require('../models/MarketInsight');

/* ─── Seed data for first run ─── */
const SEED_DATA = [
  { productName: 'Boro Rice', variety: 'BR-28', region: 'Dhaka', season: 'Rabi', demandLevel: 'High', supplyLevel: 'High', priceTrend: 'Stable', forecastSummary: 'Steady demand from urban markets. Government procurement stabilises pricing.', recommendation: 'Good time to sell. Negotiate bulk contracts.', confidenceScore: 87, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 820, minPrice: 800, maxPrice: 850, region: 'Dhaka' }, { date: new Date('2024-03-08'), averagePrice: 840, minPrice: 820, maxPrice: 860, region: 'Dhaka' }, { date: new Date('2024-03-15'), averagePrice: 860, minPrice: 840, maxPrice: 880, region: 'Dhaka' }, { date: new Date('2024-03-22'), averagePrice: 900, minPrice: 880, maxPrice: 920, region: 'Dhaka' }] },
  { productName: 'Wheat', variety: 'BARI Gom-26', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Medium', priceTrend: 'Up', forecastSummary: 'Import costs rising, boosting domestic wheat price. Good time to hold stock.', recommendation: 'Hold stock for 2-3 weeks for better price.', confidenceScore: 82, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 950, minPrice: 920, maxPrice: 980, region: 'Rajshahi' }, { date: new Date('2024-03-08'), averagePrice: 1000, minPrice: 970, maxPrice: 1030, region: 'Rajshahi' }, { date: new Date('2024-03-15'), averagePrice: 1060, minPrice: 1030, maxPrice: 1090, region: 'Rajshahi' }, { date: new Date('2024-03-22'), averagePrice: 1110, minPrice: 1080, maxPrice: 1140, region: 'Rajshahi' }] },
  { productName: 'Tomato', variety: 'BARI-14', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Off-season shortage driving prices. Peak demand from restaurant sector.', recommendation: 'Excellent opportunity for greenhouse growers.', confidenceScore: 90, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 400, minPrice: 350, maxPrice: 450, region: 'Rajshahi' }, { date: new Date('2024-03-08'), averagePrice: 520, minPrice: 470, maxPrice: 570, region: 'Rajshahi' }, { date: new Date('2024-03-15'), averagePrice: 620, minPrice: 580, maxPrice: 660, region: 'Rajshahi' }, { date: new Date('2024-03-22'), averagePrice: 700, minPrice: 660, maxPrice: 740, region: 'Rajshahi' }] },
  { productName: 'Potato', variety: 'Cardinal', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'High', priceTrend: 'Stable', forecastSummary: 'Cold storage supply maintaining steady prices. Demand remains constant.', recommendation: 'Sell without delay unless cold storage is available.', confidenceScore: 88, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 310, minPrice: 290, maxPrice: 330, region: 'Rajshahi' }, { date: new Date('2024-03-08'), averagePrice: 320, minPrice: 300, maxPrice: 340, region: 'Rajshahi' }, { date: new Date('2024-03-15'), averagePrice: 340, minPrice: 320, maxPrice: 360, region: 'Rajshahi' }, { date: new Date('2024-03-22'), averagePrice: 350, minPrice: 330, maxPrice: 370, region: 'Rajshahi' }] },
  { productName: 'Onion', variety: 'BARI-1', region: 'Pabna', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Import restrictions raising local prices. Strong volatility expected.', recommendation: 'Monitor daily. Consider selling 50% now.', confidenceScore: 78, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 700, minPrice: 650, maxPrice: 760, region: 'Pabna' }, { date: new Date('2024-03-08'), averagePrice: 900, minPrice: 840, maxPrice: 960, region: 'Pabna' }, { date: new Date('2024-03-15'), averagePrice: 1100, minPrice: 1040, maxPrice: 1160, region: 'Pabna' }, { date: new Date('2024-03-22'), averagePrice: 1300, minPrice: 1240, maxPrice: 1360, region: 'Pabna' }] },
  { productName: 'Mustard', variety: 'BARI-14', region: 'Rajshahi', season: 'Rabi', demandLevel: 'Medium', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Rising edible oil prices boosting mustard demand. Domestic production insufficient.', recommendation: 'Strong sell opportunity. Direct to oil mills for better price.', confidenceScore: 84, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 2000, minPrice: 1900, maxPrice: 2100, region: 'Rajshahi' }, { date: new Date('2024-03-08'), averagePrice: 2200, minPrice: 2100, maxPrice: 2300, region: 'Rajshahi' }, { date: new Date('2024-03-15'), averagePrice: 2380, minPrice: 2260, maxPrice: 2500, region: 'Rajshahi' }, { date: new Date('2024-03-22'), averagePrice: 2500, minPrice: 2380, maxPrice: 2620, region: 'Rajshahi' }] },
  { productName: 'Jute', variety: 'CVE-3', region: 'Mymensingh', season: 'Kharif', demandLevel: 'Medium', supplyLevel: 'Medium', priceTrend: 'Stable', forecastSummary: 'Export demand stable. Government jute mill purchases maintaining floor price.', recommendation: 'Sell after retting process at nearest depot.', confidenceScore: 75, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 1650, minPrice: 1580, maxPrice: 1720, region: 'Mymensingh' }, { date: new Date('2024-03-08'), averagePrice: 1700, minPrice: 1630, maxPrice: 1770, region: 'Mymensingh' }, { date: new Date('2024-03-15'), averagePrice: 1750, minPrice: 1680, maxPrice: 1820, region: 'Mymensingh' }, { date: new Date('2024-03-22'), averagePrice: 1800, minPrice: 1720, maxPrice: 1880, region: 'Mymensingh' }] },
  { productName: 'Lentil', variety: 'BARI-4', region: 'Rajshahi', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Pulse prices climbing due to reduced domestic production. Import gap widening.', recommendation: 'High profit margin. Expand cultivation area next season.', confidenceScore: 86, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 2900, minPrice: 2800, maxPrice: 3000, region: 'Rajshahi' }, { date: new Date('2024-03-08'), averagePrice: 3100, minPrice: 3000, maxPrice: 3200, region: 'Rajshahi' }, { date: new Date('2024-03-15'), averagePrice: 3350, minPrice: 3250, maxPrice: 3450, region: 'Rajshahi' }, { date: new Date('2024-03-22'), averagePrice: 3600, minPrice: 3500, maxPrice: 3700, region: 'Rajshahi' }] },
  { productName: 'Maize', variety: 'BARI-9', region: 'Rangpur', season: 'Rabi', demandLevel: 'High', supplyLevel: 'Medium', priceTrend: 'Stable', forecastSummary: 'Poultry and fisheries sector fuelling maize demand. Price likely stable.', recommendation: 'Direct supply to feed mills for premium price.', confidenceScore: 81, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 900, minPrice: 860, maxPrice: 940, region: 'Rangpur' }, { date: new Date('2024-03-08'), averagePrice: 940, minPrice: 900, maxPrice: 980, region: 'Rangpur' }, { date: new Date('2024-03-15'), averagePrice: 980, minPrice: 940, maxPrice: 1020, region: 'Rangpur' }, { date: new Date('2024-03-22'), averagePrice: 1010, minPrice: 970, maxPrice: 1050, region: 'Rangpur' }] },
  { productName: 'Watermelon', variety: 'Kiran', region: 'Khulna', season: 'Zaid', demandLevel: 'High', supplyLevel: 'Low', priceTrend: 'Up', forecastSummary: 'Summer demand surge. Chars and river islands producing less this year.', recommendation: 'Premium prices at city wholesale markets. Transport quickly.', confidenceScore: 89, priceHistory: [{ date: new Date('2024-03-01'), averagePrice: 200, minPrice: 170, maxPrice: 230, region: 'Khulna' }, { date: new Date('2024-03-08'), averagePrice: 240, minPrice: 210, maxPrice: 270, region: 'Khulna' }, { date: new Date('2024-03-15'), averagePrice: 270, minPrice: 240, maxPrice: 300, region: 'Khulna' }, { date: new Date('2024-03-22'), averagePrice: 290, minPrice: 260, maxPrice: 320, region: 'Khulna' }] },
];

async function seedIfEmpty() {
  try {
    const count = await MarketInsight.countDocuments();
    if (count === 0) {
      await MarketInsight.insertMany(SEED_DATA);
      console.log('✅ Market insights seeded with', SEED_DATA.length, 'records');
    }
  } catch (err) {
    console.warn('Seed warning:', err.message);
  }
}

/* GET /api/market-insights */
exports.getMarketInsights = async (req, res) => {
  try {
    await seedIfEmpty();

    const { region, season, product, trend } = req.query;
    const filter = {};
    if (region && region !== 'All') filter.region = { $regex: region, $options: 'i' };
    if (season && season !== 'All') filter.season = season;
    if (product) filter.productName = { $regex: product, $options: 'i' };
    if (trend) filter.priceTrend = trend;

    const insights = await MarketInsight.find(filter)
      .sort({ confidenceScore: -1 })
      .limit(30)
      .lean();

    // Format priceHistory as array of numbers for frontend bar chart
    const formatted = insights.map(ins => ({
      ...ins,
      priceHistory: ins.priceHistory?.map(p => p.averagePrice) || [],
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('getMarketInsights error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* GET /api/market-insights/:productName */
exports.getProductInsight = async (req, res) => {
  try {
    await seedIfEmpty();
    const { productName } = req.params;
    const insight = await MarketInsight.findOne({
      productName: { $regex: productName, $options: 'i' }
    }).lean();

    if (!insight) {
      return res.status(404).json({ message: 'Product insight not found' });
    }

    return res.json({
      ...insight,
      priceHistory: insight.priceHistory?.map(p => p.averagePrice) || [],
    });
  } catch (err) {
    console.error('getProductInsight error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
