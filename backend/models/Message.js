const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "negotiation", "status", "image", "audio", "file"],
      default: "text",
    },
    text: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Negotiation",
    },
  },
  { timestamps: true }
);

MessageSchema.statics.getConversationId = (userId1, userId2) => {
  return [userId1.toString(), userId2.toString()].sort().join("_");
};

module.exports = mongoose.model("Message", MessageSchema);
