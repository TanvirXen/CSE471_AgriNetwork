const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },

    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    invoicePdfUrl: { type: String, trim: true },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date },

    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "PartiallyPaid", "Refunded"],
      default: "Unpaid",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", InvoiceSchema);
