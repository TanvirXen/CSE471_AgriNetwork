const mongoose = require("mongoose");

const RoutePointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String, trim: true },
  },
  { _id: false }
);

const DeliveryTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Assigned", "PickupScheduled", "PickedUp", "InTransit", "ReachedDestination", "Delivered", "Failed"],
      required: true,
    },
    note: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DeliverySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
    assignedPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    thirdPartyProvider: {
      type: String,
      enum: ["Pathao", "Steadfast", "Paperfly", "Internal", "Other"],
      default: "Pathao",
    },
    thirdPartyTrackingId: { type: String, trim: true, index: true },

    pickupDate: { type: Date },
    pickupSlotStart: { type: String, trim: true },
    pickupSlotEnd: { type: String, trim: true },

    pickupLocation: {
      address: { type: String, trim: true },
      point: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    dropLocation: {
      address: { type: String, trim: true },
      point: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    distanceKm: { type: Number, min: 0, default: 0 },
    estimatedDurationMinutes: { type: Number, min: 0, default: 0 },
    routePolyline: { type: String, trim: true },
    routePreviewPoints: { type: [RoutePointSchema], default: [] },

    deliveryFee: { type: Number, min: 0, default: 0 },

    otpCodeHash: { type: String, trim: true },
    otpVerified: { type: Boolean, default: false },
    otpVerifiedAt: { type: Date },

    proofOfDeliveryPhotos: [{ type: String, trim: true }],
    proofOfDeliveryNote: { type: String, trim: true },

    logisticsStatus: {
      type: String,
      enum: ["Pending", "Assigned", "PickedUp", "InTransit", "Delivered", "Failed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    adminUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminUpdatedAt: { type: Date },

    timeline: { type: [DeliveryTimelineSchema], default: [] },
  },
  { timestamps: true }
);

DeliverySchema.index({ "pickupLocation.point": "2dsphere" });
DeliverySchema.index({ "dropLocation.point": "2dsphere" });

module.exports = mongoose.model("Delivery", DeliverySchema);
