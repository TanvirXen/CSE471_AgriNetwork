const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema(
  {
    cropName:           { type: String, required: true, trim: true },
    variety:            { type: String, trim: true },
    recommendationScore:{ type: Number, min: 0, max: 100, default: 0 },
    expectedYield:      { type: Number, min: 0 },
    expectedMarketPrice:{ type: Number, min: 0 },
    profitabilityScore: { type: Number, min: 0, max: 100 },
    grossRevenue:       { type: Number, min: 0 },
    estimatedProfit:    { type: Number },
    reason:             { type: String, trim: true },
    aiInsight:          { type: String, trim: true },   // HF AI generated text
  },
  { _id: false }
);

const CropPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    landArea:            { type: Number, min: 0 },
    landUnit:            { type: String, enum: ["acre", "bigha", "hectare", "decimal"], default: "acre" },

    region:              { type: String, trim: true, index: true },
    district:            { type: String, trim: true },
    season:              { type: String, trim: true, index: true },
    soilType:            { type: String, trim: true },
    irrigationAvailable: { type: Boolean, default: false },
    budget:              { type: Number, min: 0, default: 0 },

    recommendations: { type: [RecommendationSchema], default: [] },

    weather: { type: mongoose.Schema.Types.Mixed },   // live weather snapshot

    generatedBy:   { type: String, default: "HF-Mistral-7B + Local Scoring Engine" },
    modelVersion:  { type: String, trim: true },
    notes:         { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropPlan", CropPlanSchema);
