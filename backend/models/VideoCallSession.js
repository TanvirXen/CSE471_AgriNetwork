const mongoose = require("mongoose");

const ParticipantJoinSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { _id: false }
);

const VideoCallSessionSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    participants: { type: [ParticipantJoinSchema], default: [] },

    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing", index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true },
    conversationId: { type: String, trim: true, index: true },

    provider: {
      type: String,
      enum: ["Agora", "Twilio", "WebRTC", "GoogleMeet"],
      default: "WebRTC",
    },

    roomId: { type: String, required: true, unique: true, index: true },
    callToken: { type: String, trim: true },

    purpose: {
      type: String,
      enum: ["CropInspection", "Negotiation", "Support", "Dispute"],
      default: "CropInspection",
    },

    scheduledAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },

    callStatus: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled", "Missed"],
      default: "Scheduled",
      index: true,
    },

    recordingUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoCallSession", VideoCallSessionSchema);
