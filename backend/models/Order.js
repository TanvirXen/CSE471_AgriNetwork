const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "FarmerListing" },
    productName: { type: String, required: true, trim: true },
    variety: { type: String, trim: true },
    grade: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "kg" },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
      ],
      required: true,
    },
    note: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },

    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: "NegotiationOffer" },
    buyRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "BuyRequest" },

    items: { type: [OrderItemSchema], required: true },

    pricing: {
      itemsTotal: { type: Number, required: true, min: 0 },
      deliveryFee: { type: Number, default: 0, min: 0 },
      platformFee: { type: Number, default: 0, min: 0 },
      escrowFee: { type: Number, default: 0, min: 0 },
      discount: { type: Number, default: 0, min: 0 },
      grandTotal: { type: Number, required: true, min: 0 },
    },

    deliveryAddress: {
      contactName: { type: String, trim: true },
      phone: { type: String, trim: true },
      fullAddress: { type: String, trim: true },
      district: { type: String, trim: true },
      division: { type: String, trim: true },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    timeline: { type: [StatusHistorySchema], default: [] },

    cancellationRequested: { type: Boolean, default: false },
    cancellationReason: { type: String, trim: true },

    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery" },
    refundRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "RefundRequest" },

    deliveredAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
