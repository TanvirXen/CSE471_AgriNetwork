const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["Farmer", "Vendor", "Admin", "Moderator"] },
    lastSeenAt: { type: Date },
    unreadCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [ParticipantSchema],
      validate: [(v) => v.length >= 2, "At least 2 participants required"],
    },

    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing", index: true },
    buyRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "BuyRequest", index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },

    conversationType: {
      type: String,
      enum: ["DirectTrade", "OrderSupport", "AdminReview"],
      default: "DirectTrade",
    },

    lastMessageAt: { type: Date, default: Date.now, index: true },
    isNegotiationEnabled: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
