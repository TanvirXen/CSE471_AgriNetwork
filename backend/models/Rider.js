const mongoose = require("mongoose");

const RiderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: ["Bike", "Van", "Truck"], default: "Bike" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    status: { type: String, enum: ["Available", "Busy", "Offline"], default: "Available" }
  },
  { timestamps: true }
);

// Create a 2dsphere index for location-based queries
RiderSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Rider", RiderSchema);
