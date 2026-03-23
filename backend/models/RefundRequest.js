const mongoose = require("mongoose");

const RefundApprovalStepSchema = new mongoose.Schema(
  {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decision: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    notes: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const RefundRequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amountRequested: { type: Number, min: 0, required: true },
    reason: { type: String, required: true, trim: true },
    evidence: [{ type: String, trim: true }],

    status: {
      type: String,
      enum: ["Pending", "UnderReview", "Approved", "Rejected", "Processed"],
      default: "Pending",
      index: true,
    },

    approvalWorkflow: { type: [RefundApprovalStepSchema], default: [] },

    finalApprovedAmount: { type: Number, min: 0 },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefundRequest", RefundRequestSchema);
