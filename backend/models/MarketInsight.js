const mongoose = require("mongoose");

const PricePointSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    averagePrice: { type: Number, min: 0, required: true },
    minPrice: { type: Number, min: 0 },
    maxPrice: { type: Number, min: 0 },
    region: { type: String, trim: true },
  },
  { _id: false }
);

const MarketInsightSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    productName: { type: String, required: true, trim: true, index: true },
    variety: { type: String, trim: true, index: true },
    region: { type: String, trim: true, index: true },
    season: { type: String, trim: true },

    demandLevel: { type: String, enum: ["Low", "Medium", "High"], index: true },
    supplyLevel: { type: String, enum: ["Low", "Medium", "High"], index: true },
    priceTrend: { type: String, enum: ["Down", "Stable", "Up"], index: true },

    forecastSummary: { type: String, trim: true },
    recommendation: { type: String, trim: true },

    priceHistory: { type: [PricePointSchema], default: [] },

    source: { type: String, trim: true, default: "InternalAI" },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketInsight", MarketInsightSchema);
