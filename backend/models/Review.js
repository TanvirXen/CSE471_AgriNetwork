const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    rating: {
      quality: { type: Number, required: true, min: 1, max: 5 },
      timeliness: { type: Number, required: true, min: 1, max: 5 },
      communication: { type: Number, required: true, min: 1, max: 5 },
    },

    averageRating: { type: Number, required: true },
    reviewText: { type: String, trim: true, maxlength: 1000 },

    isVerifiedPurchase: { type: Boolean, default: true },

    isReported: { type: Boolean, default: false },
    reportReason: { type: String, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    moderationStatus: {
      type: String,
      enum: ["pending", "ignored", "deleted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ orderId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
