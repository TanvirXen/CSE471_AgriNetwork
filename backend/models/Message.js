const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
