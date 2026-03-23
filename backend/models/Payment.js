const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    escrowId: { type: mongoose.Schema.Types.ObjectId, ref: "Escrow", index: true },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    transactionType: {
      type: String,
      enum: ["OrderPayment", "EscrowFunding", "EscrowRelease", "Refund", "Withdrawal", "Payout"],
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["SSLCommerz", "Manual", "Bank", "Wallet"],
      default: "SSLCommerz",
      index: true,
    },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },

    sslStoreAmount: { type: Number, min: 0 },
    sslTranId: { type: String, trim: true, index: true },
    sslValId: { type: String, trim: true },
    sslSessionKey: { type: String, trim: true },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Initiated", "Paid", "Failed", "Cancelled", "Refunded"],
      default: "Pending",
      index: true,
    },

    adminChecked: { type: Boolean, default: false },
    adminCheckedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminCheckedAt: { type: Date },

    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
