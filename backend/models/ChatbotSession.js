const mongoose = require("mongoose");

const ChatbotMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true, trim: true },
    relatedCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    relatedListingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing" },
    intent: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatbotSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionTitle: { type: String, trim: true },
    messages: { type: [ChatbotMessageSchema], default: [] },

    dataSource: {
      type: String,
      enum: ["Database", "AI", "Hybrid"],
      default: "Hybrid",
    },

    topicTags: [{ type: String, trim: true }],
    sessionStatus: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatbotSession", ChatbotSessionSchema);
