const mongoose = require("mongoose");

const NegotiationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: String,
      trim: true,
    },
    offerPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    marketPrice: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "৳/kg",
    },
    note: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["offer", "counter", "accepted", "rejected"],
      default: "offer",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Countered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Negotiation", NegotiationSchema);
