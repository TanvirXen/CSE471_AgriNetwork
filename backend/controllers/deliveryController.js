const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const osrmService = require("../services/osrmService");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const BASE_FEE = 50; 
const PER_KM_RATE = 15; 

// Mock Helper to generate 4 digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.quoteDeliveryFee = async (req, res) => {
  try {
    let { pickupCoords, dropCoords, vendorId } = req.body;
    
    if (vendorId) {
       const user = await require("../models/User").findById(vendorId);
       if (user && user.currentLocation && user.currentLocation.coordinates) {
          pickupCoords = user.currentLocation.coordinates;
       }
    }

    if (!pickupCoords || pickupCoords.length < 2) {
       pickupCoords = [90.4125, 23.8103]; // Fallback to a default central location if cart lacks vendorId
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
    if (!delivery) return res.status(404).json({ message: "Delivery not found for this order" });
    
    // Generate OTP
    const otp = generateOTP();
    
    delivery.otpCodeHash = otp; // Storing plain text for dummy purposes to easily send back
    delivery.logisticsStatus = "InTransit";
    delivery.timeline.push({
      status: "InTransit",
      note: "Vendor started delivery. OTP generated."
    });
    await delivery.save();

    const order = await Order.findById(orderId);
    if (order) {
      order.status = "OutForDelivery";
      order.timeline.push({ status: "OutForDelivery", note: "Vendor is on the way." });
      await order.save();
    }

    // Simulate sending SMS
    res.json({
      message: "Delivery started successfully",
      simulatedSMS: `Your AgriNetwork delivery code is ${otp}. Please provide this to the vendor upon delivery.`,
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

    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    // 1. Verify OTP
    if (delivery.otpCodeHash !== otpText) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 2. Upload Photo Proof
    let photoUrl = "";
    if (req.files && req.files.photo) {
      const file = req.files.photo;
      
      // Cloudinary setup
      if (process.env.CLOUDINARY_CLOUD_NAME) {
         try {
            // Write temp file since express-fileupload stores in memory or temp
            const tempPath = path.join(__dirname, '..', 'uploads', file.name);
            await file.mv(tempPath);
            const result = await cloudinary.uploader.upload(tempPath, { folder: "delivery_proofs" });
            photoUrl = result.secure_url;
            fs.unlinkSync(tempPath); // cleanup
         } catch(e) {
            console.error("Cloudinary upload failed, falling back to local", e);
         }
      }

      // Fallback local upload
      if (!photoUrl) {
         const uniqueName = Date.now() + "-" + file.name;
         const destPath = path.join(__dirname, '..', 'uploads', uniqueName);
         await file.mv(destPath);
         photoUrl = `/uploads/${uniqueName}`;
      }
    } else {
      return res.status(400).json({ message: "Delivery photo proof is required" });
    }

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
      
      // Free the assigned rider
      if (order.rider && order.rider.id) {
         const Rider = require("../models/Rider");
         try {
             const assignedRider = await Rider.findById(order.rider.id);
             if (assignedRider) {
                 assignedRider.status = "Available";
                 await assignedRider.save();
             }
         } catch (e) {
             console.log("Could not free rider", e);
         }
      }
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
