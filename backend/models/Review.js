const mongoose = require("mongoose");

const RatingBreakdownSchema = new mongoose.Schema(
  {
    productQuality: { type: Number, min: 1, max: 5, required: true },
    timeliness: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false }
);

const AbuseReportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, trim: true, required: true },
    reportedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    verifiedPurchase: { type: Boolean, default: true, index: true },

    starRating: { type: Number, min: 1, max: 5, required: true },
    ratingBreakdown: { type: RatingBreakdownSchema, required: true },

    reviewText: { type: String, trim: true, maxlength: 2000 },

    isVisible: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    abuseReports: { type: [AbuseReportSchema], default: [] },

    moderationStatus: {
      type: String,
      enum: ["Published", "UnderReview", "Removed"],
      default: "Published",
      index: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
