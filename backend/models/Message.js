const mongoose = require("mongoose");

<<<<<<< HEAD
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
=======
const AttachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "file", "audio"], required: true },
    url: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    messageType: {
      type: String,
      enum: ["text", "offer", "counterOffer", "system", "image", "video", "file"],
      default: "text",
      index: true,
    },

    text: { type: String, trim: true, maxlength: 5000 },
    attachments: { type: [AttachmentSchema], default: [] },

    relatedOfferId: { type: mongoose.Schema.Types.ObjectId, ref: "NegotiationOffer" },

    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
>>>>>>> upstream/main
  },
  { timestamps: true }
);

<<<<<<< HEAD
// Helper: generate consistent conversation ID
MessageSchema.statics.getConversationId = (userId1, userId2) => {
  return [userId1.toString(), userId2.toString()].sort().join("_");
};

=======
>>>>>>> upstream/main
module.exports = mongoose.model("Message", MessageSchema);
