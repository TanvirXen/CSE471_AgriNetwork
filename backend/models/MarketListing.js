const mongoose = require("mongoose");

const MarketListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    crops: [{ type: String, trim: true }],
    price: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "৳/kg",
    },
    stockStatus: {
      type: String,
      enum: ["in-stock", "limited", "out-of-stock"],
      default: "in-stock",
    },
    type: {
      type: String,
      enum: ["farmer", "vendor", "market"],
      required: true,
    },
    district: {
      type: String,
      trim: true,
    },
    division: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [90.4125, 23.8103], // Default: Dhaka
      },
    },
    description: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: true,
    collection: 'farmerlistings'
  }
);

MarketListingSchema.index({ location: "2dsphere" });
MarketListingSchema.index({ crops: "text", title: "text", district: "text" });

module.exports = mongoose.model("MarketListing", MarketListingSchema);
