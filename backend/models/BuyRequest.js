const mongoose = require("mongoose");

const FarmerMatchSchema = new mongoose.Schema(
  {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing" },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    matchedAt: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false },
  },
  { _id: false }
);

const OfferSummarySchema = new mongoose.Schema(
  {
    offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, min: 0, required: true },
    message: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BuyRequestSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    title: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true, index: true },
    categoryType: { type: String, enum: ["Crop", "Fish", "Poultry", "Livestock"], required: true },
    variety: { type: String, trim: true },
    preferredGrade: { type: String, trim: true },
    targetMoisturePercentage: { type: Number, min: 0, max: 100 },
    preferredSackType: { type: String, trim: true },

    quantityNeeded: { type: Number, min: 0, required: true },
    quantityUnit: { type: String, trim: true, default: "kg" },
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },

    deliveryTimelineStart: { type: Date },
    deliveryTimelineEnd: { type: Date },

    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], default: [0, 0] },
    },

    district: { type: String, trim: true },
    division: { type: String, trim: true },

    notes: { type: String, trim: true, maxlength: 2000 },

    farmerMatches: { type: [FarmerMatchSchema], default: [] },
    offerDashboard: { type: [OfferSummarySchema], default: [] },

    status: {
      type: String,
      enum: ["Open", "Matched", "Negotiating", "Closed", "Cancelled"],
      default: "Open",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
  },
  { timestamps: true }
);

BuyRequestSchema.index({ pickupLocation: "2dsphere" });

module.exports = mongoose.model("BuyRequest", BuyRequestSchema);
