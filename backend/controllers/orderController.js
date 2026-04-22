const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const User = require("../models/User");
const FarmerListing = require("../models/FarmerListing");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    // Set buyerId from auth
    orderData.buyerId = req.user.id;

    // Map addressText to fullAddress
    if (orderData.deliveryAddress && orderData.deliveryAddress.addressText) {
       orderData.deliveryAddress.fullAddress = orderData.deliveryAddress.addressText;
    }

    // Validate customer coordinates
    if (!orderData.deliveryAddress || !orderData.deliveryAddress.coordinates || !orderData.deliveryAddress.coordinates.coordinates) {
       return res.status(400).json({ message: "Delivery coordinates are missing." });
    }
    const [lng, lat] = orderData.deliveryAddress.coordinates.coordinates;
    if (lng === 0 && lat === 0) {
       return res.status(400).json({ message: "Please select your delivery location on the map." });
    }

    orderData.orderNumber = "ORD-" + Date.now();
    orderData.otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP

    if (orderData.items && orderData.items.length > 0) {
      const product = await FarmerListing.findById(orderData.items[0].listingId);
      if (product && product.farmerId) {
         orderData.sellerId = product.farmerId;
         // Ensure vendorId is also set if it's used in the system
         orderData.vendorId = product.farmerId;
      }
    }

    const newOrder = await Order.create(orderData);

    // Automatically create a Delivery entry
    const newDelivery = await Delivery.create({
      orderId: newOrder._id,
      pickupDate: orderData.pickupDate || new Date(),
      pickupSlotStart: orderData.pickupTimeSlot || "09:00 AM",
      routePolyline: orderData.routePolyline || null,
      logisticsStatus: "Pending",
      timeline: [{ status: "Assigned", note: "Delivery partner assigned" }]
    });

    newOrder.deliveryId = newDelivery._id;
    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("[orderController.createOrder]", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get all orders 
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user; // assuming role is in token

    const filters = {};
    if (role === "Farmer" || role === "Vendor") {
        filters.sellerId = userId;
    } else {
        filters.buyerId = userId;
    }

    if (req.query.status) filters.status = req.query.status;

    let orders = await Order.find(filters).sort({ createdAt: -1 });

    // Hide OTP from vendors/farmers until needed
    if (role === "Farmer" || role === "Vendor") {
      orders = orders.map(order => {
        const orderObj = order.toObject();
        // Keep OTP hidden unless customer has submitted their proof, allowing vendor to verify
        if (!orderObj.customerSubmittedOTP) {
           delete orderObj.otp;
        }
        return orderObj;
      });
    }

    res.json(orders);
  } catch (err) {
    console.error("[orderController.getOrders]", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Update order status 
exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updates = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update order status specifically with logic for Rider, OSRM, OTP
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    let { status, otp, deliveryProofUrl } = req.body;

    if (status === "Out for Delivery") status = "OutForDelivery";

    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "OutForDelivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // "Shipped" -> Assign rider via OSRM
    if (status === "Shipped" && order.status !== "Shipped") {
      const { riderId } = req.body;
      const targetVendorId = order.vendorId || order.sellerId;
      const vendorUser = await User.findById(targetVendorId);
      
      if (!vendorUser || !vendorUser.currentLocation || !vendorUser.currentLocation.coordinates || vendorUser.currentLocation.coordinates.length < 2) {
          // Fallback or error
          console.warn("Vendor location missing, skipping OSRM routing");
      } else {
          const vendorLng = vendorUser.currentLocation.coordinates[0];
          const vendorLat = vendorUser.currentLocation.coordinates[1];

          if (vendorLng !== 0 || vendorLat !== 0) {
              const destLng = order.deliveryAddress.coordinates.coordinates[0];
              const destLat = order.deliveryAddress.coordinates.coordinates[1];

              try {
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${vendorLng},${vendorLat};${destLng},${destLat}?overview=full&geometries=geojson`;
                const response = await fetch(osrmUrl);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                  const distanceKm = data.routes[0].distance / 1000;
                  order.rider = {
                    id: riderId || "RIDER-" + Math.floor(Math.random() * 10000),
                    name: "AgriNetwork Rider",
                    distance: distanceKm
                  };
                  
                  if (!order.pricing) order.pricing = {};
                  order.pricing.deliveryFee = Math.round(distanceKm * 15 + 50);

                  const delivery = await Delivery.findOne({ orderId: order._id });
                  if (delivery) {
                      delivery.routePolyline = JSON.stringify(data.routes[0].geometry);
                      await delivery.save();
                  }
                }
              } catch (err) {
                console.error("OSRM routing service failed:", err.message);
              }
          }
      }
    }

    // "Delivered" -> Require and verify OTP
    if (status === "Delivered" && order.status !== "Delivered") {
      const submittedOtp = otp || order.customerSubmittedOTP;

      if (!submittedOtp) return res.status(400).json({ message: "OTP is required to mark as Delivered" });
      if (order.otp !== submittedOtp) {
          return res.status(400).json({ message: "Invalid OTP! Verification failed." });
      }

      const proofUrl = deliveryProofUrl || order.customerSubmittedPhoto;
      if (proofUrl) {
         order.deliveryProof = {
            url: proofUrl,
            uploadedAt: new Date()
         };
      }
      order.deliveredAt = new Date();
      order.completedAt = new Date();
    }

    order.status = status;
    order.timeline.push({ status, note: `Status updated to ${status}` });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error("[orderController.updateOrderStatus]", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.submitCustomerProof = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { otp } = req.body;
    const file = req.file;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!otp) return res.status(400).json({ message: "OTP is required" });
    if (!file) return res.status(400).json({ message: "Photo proof is required" });

    if (order.otp && order.otp !== otp) {
        return res.status(400).json({ message: "The OTP entered does not match." });
    }

    // Assuming cloudinaryUpload handles the upload and attaches secure_url to req.file.path or similar
    const photoUrl = file.path; 

    order.customerSubmittedOTP = otp;
    order.customerSubmittedPhoto = photoUrl;
    order.timeline.push({ status: order.status, note: "Customer submitted delivery proof." });

    await order.save();
    res.json({ message: "Proof submitted successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "Cancelled";
    order.cancellationRequested = true;
    order.cancellationReason = reason || "No reason provided";
    order.timeline.push({ status: "Cancelled", note: reason });

    await order.save();
    res.json({ message: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    await Order.findByIdAndDelete(orderId);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
