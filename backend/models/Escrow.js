const mongoose = require("mongoose");

const EscrowSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amountHeld: { type: Number, required: true, min: 0 },
    feeAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["PendingFunding", "Funded", "PartiallyReleased", "Released", "Refunded", "Disputed", "Cancelled"],
      default: "PendingFunding",
      index: true,
    },

    fundedAt: { type: Date },
    releaseCondition: {
      type: String,
      enum: ["DeliveryConfirmed", "OTPConfirmed", "AdminApproved"],
      default: "DeliveryConfirmed",
    },

    releaseAmount: { type: Number, min: 0, default: 0 },
    releasedAt: { type: Date },

    refundAmount: { type: Number, min: 0, default: 0 },
    refundedAt: { type: Date },

    disputeOpened: { type: Boolean, default: false },
    disputeReason: { type: String, trim: true },
    disputeResolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Escrow", EscrowSchema);
