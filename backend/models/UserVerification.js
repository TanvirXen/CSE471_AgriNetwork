const mongoose = require("mongoose");

const VerificationReviewSchema = new mongoose.Schema(
  {
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewType: { type: String, enum: ["Automated", "Manual"], required: true },
    decision: { type: String, enum: ["Approved", "Rejected", "NeedsMoreInfo"], required: true },
    notes: { type: String, trim: true },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FraudSignalSchema = new mongoose.Schema(
  {
    signalType: {
      type: String,
      enum: [
        "DuplicateNID",
        "DuplicatePhone",
        "DuplicateFace",
        "DuplicateDevice",
        "MismatchedName",
        "SuspiciousDocument",
        "HighRiskBehavior",
      ],
      required: true,
    },
    score: { type: Number, min: 0, max: 100, default: 0 },
    description: { type: String, trim: true },
    flaggedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    verificationType: {
      type: String,
      enum: ["NID", "TradeLicense", "FarmerCertificate", "VendorCertificate"],
      default: "NID",
    },

    nidFullName: { type: String, trim: true },
    nidNumberHash: { type: String, trim: true, index: true },
    nidFrontImage: { type: String, trim: true },
    nidBackImage: { type: String, trim: true },
    selfieImage: { type: String, trim: true },

    automatedCheckStatus: {
      type: String,
      enum: ["Pending", "Passed", "Failed", "ReviewRequired"],
      default: "Pending",
      index: true,
    },

    manualReviewStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "NeedsMoreInfo"],
      default: "Pending",
      index: true,
    },

    badgeGranted: { type: Boolean, default: false },
    badgeType: {
      type: String,
      enum: ["Verified", "Trusted Seller", "Trusted Buyer", "Premium"],
      default: null,
    },

    fraudRiskScore: { type: Number, min: 0, max: 100, default: 0 },
    fraudSignals: { type: [FraudSignalSchema], default: [] },

    reviews: { type: [VerificationReviewSchema], default: [] },

    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserVerification", UserVerificationSchema);
