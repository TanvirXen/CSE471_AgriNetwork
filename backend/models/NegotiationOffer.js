const mongoose = require("mongoose");

const NegotiationOfferSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing", index: true },
    buyRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "BuyRequest", index: true },

    offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    offeredTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, default: "kg" },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    deliveryTerms: { type: String, trim: true },
    paymentTerms: { type: String, trim: true },
    note: { type: String, trim: true, maxlength: 2000 },

    offerType: {
      type: String,
      enum: ["Offer", "CounterOffer"],
      default: "Offer",
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Expired", "Cancelled"],
      default: "Pending",
      index: true,
    },

    expiresAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NegotiationOffer", NegotiationOfferSchema);
