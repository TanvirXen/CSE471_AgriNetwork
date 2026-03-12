const mongoose = require("mongoose");

const SeasonalWindowSchema = new mongoose.Schema(
  {
    region: { type: String, trim: true, required: true },
    startMonth: { type: Number, min: 1, max: 12, required: true },
    endMonth: { type: Number, min: 1, max: 12, required: true },
    peakMonths: [{ type: Number, min: 1, max: 12 }],
  },
  { _id: false }
);

const PricingTierSchema = new mongoose.Schema(
  {
    minQuantity: { type: Number, required: true, min: 0 },
    maxQuantity: { type: Number, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    categoryType: {
      type: String,
      required: true,
      enum: ["Crop", "Fish", "Poultry", "Livestock"],
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true },

    variety: [{ type: String, trim: true }],
    qualityGrades: [{ type: String, trim: true }],
    sackTypes: [{ type: String, trim: true }],
    moistureRange: {
      min: { type: Number, min: 0, max: 100 },
      max: { type: Number, min: 0, max: 100 },
    },

    seasonalWindows: { type: [SeasonalWindowSchema], default: [] },

    bulkPricingTiers: { type: [PricingTierSchema], default: [] },

    regionSpotlight: {
      enabled: { type: Boolean, default: false },
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      regions: [{ type: String, trim: true }],
      highDemand: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
    image: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
