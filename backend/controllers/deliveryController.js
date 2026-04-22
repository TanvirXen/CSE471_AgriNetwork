const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const osrmService = require("../services/osrmService");
const User = require("../models/User");

const BASE_FEE = 50; 
const PER_KM_RATE = 15; 

// Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.quoteDeliveryFee = async (req, res) => {
  try {
    let { pickupCoords, dropCoords, vendorId } = req.body;

    if (vendorId) {
       const user = await User.findById(vendorId);
       if (user && user.currentLocation && user.currentLocation.coordinates) {
          pickupCoords = user.currentLocation.coordinates;
       }
    }

    if (!pickupCoords || pickupCoords.length < 2) {
       pickupCoords = [90.4125, 23.8103]; // Fallback
    }

    if (!dropCoords || dropCoords.length < 2) {
      return res.status(400).json({ message: "Missing delivery drop coordinates." });
    }

    const routingData = await osrmService.getRouteAndDistance(pickupCoords, dropCoords);
    const fee = BASE_FEE + (routingData.distanceKm * PER_KM_RATE);

    res.json({
      distanceKm: routingData.distanceKm,
      durationMinutes: routingData.durationMinutes,
      deliveryFee: Math.round(fee),
      geometry: routingData.geometry
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.startDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    let delivery = await Delivery.findOne({ orderId });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    const otp = generateOTP();

    delivery.otpCodeHash = otp; 
    delivery.logisticsStatus = "InTransit";
    delivery.timeline.push({
      status: "InTransit",
      note: "Vendor started delivery. OTP generated."
    });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.otp = otp; // Sync OTP to order for easier management
      order.status = "OutForDelivery";
      order.timeline.push({ status: "OutForDelivery", note: "Vendor is on the way." });
      await order.save();
    }

    res.json({
      message: "Delivery started successfully",
      simulatedSMS: `Your AgriNetwork delivery code is ${otp}.`,
      delivery
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otpText } = req.body;
    const file = req.file;

    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    // 1. Verify OTP
    if (delivery.otpCodeHash !== otpText) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 2. Proof of delivery
    if (!file) {
      return res.status(400).json({ message: "Delivery photo proof is required" });
    }

    const photoUrl = file.path;

    // 3. Mark as Delivered
    delivery.otpVerified = true;
    delivery.otpVerifiedAt = new Date();
    delivery.proofOfDeliveryPhotos.push(photoUrl);
    delivery.logisticsStatus = "Delivered";
    delivery.timeline.push({ status: "Delivered", note: "OTP matched and photo uploaded." });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.status = "Delivered";
      order.deliveredAt = new Date();
      order.completedAt = new Date();
      order.timeline.push({ status: "Delivered", note: "Package successfully delivered" });
      await order.save();
    }

    res.json({ message: "Order Delivered Successfully", delivery, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeliveryDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const delivery = await Delivery.findOne({ orderId }).populate("assignedPartnerId");
    if (!delivery) return res.status(404).json({ message: "Delivery details not found" });

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
