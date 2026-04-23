const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const User = require("../models/User");
const FarmerListing = require("../models/FarmerListing");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;

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
      if (product && product.vendorId) {
         orderData.vendorId = product.vendorId;
         orderData.sellerId = product.vendorId;
      }
    }

    const newOrder = await Order.create(orderData);

    // Automatically create a Delivery entry
    const newDelivery = await Delivery.create({
      orderId: newOrder._id,
      pickupDate: orderData.pickupDate,
      pickupSlotStart: orderData.pickupTimeSlot,
      routePolyline: orderData.routePolyline || null,
      logisticsStatus: "Pending",
      timeline: [{ status: "Assigned", note: "Delivery partner assigned" }]
    });

    newOrder.deliveryId = newDelivery._id;
    await newOrder.save();

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all orders 
exports.getOrders = async (req, res) => {
  try {
    const filters = {};
    if (req.query.buyerId) filters.buyerId = req.query.buyerId;
    if (req.query.sellerId) filters.sellerId = req.query.sellerId;
    if (req.query.vendorId) filters.vendorId = req.query.vendorId;
    if (req.query.status) filters.status = req.query.status;

    let orders = await Order.find(filters);
    
    // Hide OTP from vendors
    if (req.query.sellerId || req.query.vendorId || req.query.role === "Vendor") {
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
         return res.status(400).json({ message: "Vendor physical location is strictly required for routing" });
      }

      const vendorLng = vendorUser.currentLocation.coordinates[0];
      const vendorLat = vendorUser.currentLocation.coordinates[1];
      
      if (vendorLng === 0 && vendorLat === 0) {
          return res.status(400).json({ message: "Vendor physical location is strictly required (cannot be 0,0)" });
      }

      if (!order.deliveryAddress || !order.deliveryAddress.coordinates || !order.deliveryAddress.coordinates.coordinates) {
          return res.status(400).json({ message: "Customer delivery coordinates are missing." });
      }

      const destLng = order.deliveryAddress.coordinates.coordinates[0];
      const destLat = order.deliveryAddress.coordinates.coordinates[1];

      if (destLng === 0 && destLat === 0) {
          return res.status(400).json({ message: "Invalid customer delivery coordinates." });
      }

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${vendorLng},${vendorLat};${destLng},${destLat}?overview=false`;
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const distanceKm = data.routes[0].distance / 1000;
          
          let riderName = "AgriNetwork Logistics";
          if (riderId) {
             const Rider = require("../models/Rider");
             const assignedRider = await Rider.findById(riderId);
             if (assignedRider) {
                riderName = assignedRider.name;
                assignedRider.status = "Busy";
                await assignedRider.save();
             }
          }

          order.rider = {
            id: riderId || Math.floor(Math.random() * 10000),
            name: riderName,
            distance: distanceKm
          };
          
          // Re-verify the pricing is mapped dynamically
          if (!order.pricing) order.pricing = {};
          order.pricing.deliveryFee = Math.round((order.pricing.deliveryFee > 0 ? order.pricing.deliveryFee : (distanceKm * 15 + 50)));

          // Additionally, update the route polyline in the associated delivery object to ensure map previews have the latest full geometry
          try {
             const osrmFullUrl = `https://router.project-osrm.org/route/v1/driving/${vendorLng},${vendorLat};${destLng},${destLat}?overview=full&geometries=geojson`;
             const responseFull = await fetch(osrmFullUrl);
             const dataFull = await responseFull.json();
             if (dataFull.routes && dataFull.routes.length > 0) {
                 const delivery = await Delivery.findOne({ orderId: order._id });
                 if (delivery) {
                     delivery.routePolyline = JSON.stringify(dataFull.routes[0].geometry);
                     await delivery.save();
                 }
             }
          } catch(e) {
             console.error("OSRM Geometry Fetch Error:", e);
          }

        } else {
          return res.status(500).json({ message: "Failed to map route between Vendor and Customer." });
        }
      } catch (err) {
        console.error("OSRM error:", err);
        return res.status(500).json({ message: "OSRM routing service failed." });
      }
    }

    // "Delivered" -> Require and verify OTP, apply delivery proof
    if (status === "Delivered" && order.status !== "Delivered") {
      const submittedOtp = otp || order.customerSubmittedOTP;
      
      if (!submittedOtp) return res.status(400).json({ message: "OTP is required to mark as Delivered" });
      if (order.otp !== submittedOtp) {
          order.customerSubmittedOTP = null;
          order.customerSubmittedPhoto = null;
          order.timeline.push({ status: order.status, note: "Vendor rejected mismatched OTP. Customer must resubmit." });
          await order.save();
          return res.status(400).json({ message: "Invalid OTP! The request has been erased so the customer can try again." });
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

    order.status = status;
    order.timeline.push({ status, note: `Status updated to ${status}` });

    await order.save();
    
    const orderObj = order.toObject();
    if (req.query.role === "Vendor") {
      delete orderObj.otp;
    }
    
    res.json(orderObj);
  } catch (err) {
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
        return res.status(400).json({ message: "The OTP entered does not match our records. Please try again." });
    }

    const cloudinary = require("cloudinary").v2;
    let photoUrl = "";
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
       photoUrl = await new Promise((resolve, reject) => {
         const uploadStream = cloudinary.uploader.upload_stream({ folder: "customer_proofs" }, (error, result) => {
           if (result) {
             resolve(result.secure_url);
           } else {
             reject(error);
           }
         });
         const { Readable } = require('stream');
         const stream = Readable.from(file.buffer);
         stream.pipe(uploadStream);
       });
    } else {
       const fs = require('fs');
       const path = require('path');
       const uniqueName = Date.now() + "-" + file.originalname;
       const destPath = path.join(__dirname, '..', 'uploads', uniqueName);
       fs.writeFileSync(destPath, file.buffer);
       photoUrl = `/uploads/${uniqueName}`;
    }

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

// Delete order (optional)
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
