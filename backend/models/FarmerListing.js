const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "liveStream"], required: true },
    url: { type: String, required: true, trim: true },
    thumbnail: { type: String, trim: true },
  },
  { _id: false }
);

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    quantityAvailable: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const ListingPricingSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["Fixed", "Negotiable", "Auction"],
      default: "Fixed",
      index: true,
    },
    unit: { type: String, trim: true, default: "kg" },
    unitPrice: { type: Number, min: 0, required: true },
    minimumOrderQty: { type: Number, min: 0, default: 0 },
    bulkPricingTiers: [
      {
        minQty: { type: Number, min: 0, required: true },
        pricePerUnit: { type: Number, min: 0, required: true },
      },
    ],
    auctionStartAt: { type: Date },
    auctionEndAt: { type: Date },
    reservePrice: { type: Number, min: 0 },
  },
  { _id: false }
);

const FarmerListingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },

    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 3000 },

    categoryType: {
      type: String,
      enum: ["Crop", "Fish", "Poultry", "Livestock"],
      required: true,
      index: true,
    },

    productName: { type: String, required: true, trim: true },
    variety: { type: String, trim: true, index: true },
    grade: { type: String, trim: true, index: true },
    moisturePercentage: { type: Number, min: 0, max: 100, index: true },
    sackType: { type: String, trim: true, index: true },

    diseaseNotes: { type: String, trim: true },
    qualityNotes: { type: String, trim: true },

    quantity: { type: Number, required: true, min: 0 },
    quantityUnit: { type: String, trim: true, default: "kg" },

    pricing: { type: ListingPricingSchema, required: true },

    media: { type: [MediaSchema], default: [] },
    liveStreamEnabled: { type: Boolean, default: false },

    availabilitySchedule: { type: [AvailabilitySlotSchema], default: [] },

    visibility: {
      type: String,
      enum: ["Public", "Private", "Hidden", "Boosted"],
      default: "Public",
      index: true,
    },

    boostedUntil: { type: Date },

    farmLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    district: { type: String, trim: true, index: true },
    division: { type: String, trim: true, index: true },
    region: { type: String, trim: true, index: true },

    moderationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Suspended"],
      default: "Pending",
      index: true,
    },
    moderationReason: { type: String, trim: true },

    status: {
      type: String,
      enum: ["Draft", "Active", "Reserved", "SoldOut", "Archived"],
      default: "Draft",
      index: true,
    },

    viewCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    trustScore: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "CropMarketplace" }
);

FarmerListingSchema.index({ farmLocation: "2dsphere" });
FarmerListingSchema.index({
  title: "text",
  productName: "text",
  variety: "text",
  grade: "text",
  district: "text",
  region: "text",
});

module.exports = mongoose.model("FarmerListing", FarmerListingSchema);
