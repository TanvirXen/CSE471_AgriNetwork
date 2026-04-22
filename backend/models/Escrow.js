const mongoose = require("mongoose");

const EscrowSchema = new mongoose.Schema(
  {
    // orderId is now optional so users can create escrows without a prior Order doc
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: { sparse: true } },
    buyerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Human-readable product description
    product: { type: String, trim: true, default: "" },
    note:    { type: String, trim: true, default: "" },

    amountHeld: { type: Number, required: true, min: 0 },
    feeAmount:  { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["PendingFunding", "Funded", "PartiallyReleased", "Released", "Refunded", "Disputed", "Cancelled"],
      default: "PendingFunding",
      index: true,
    },

    fundedAt: { type: Date },
    releaseCondition: {
      type: String,
      enum: ["DeliveryConfirmed", "OTPConfirmed", "AdminApproved", "ManualRelease"],
      default: "DeliveryConfirmed",
    },

    releaseAmount: { type: Number, min: 0, default: 0 },
    releasedAt:    { type: Date },

    refundAmount: { type: Number, min: 0, default: 0 },
    refundedAt:   { type: Date },

    disputeOpened:     { type: Boolean, default: false },
    disputeReason:     { type: String, trim: true },
    disputeResolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Escrow", EscrowSchema);
