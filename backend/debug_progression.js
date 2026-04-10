const mongoose = require("mongoose");
const Order = require("./models/Order");

mongoose.connect("mongodb+srv://tanvirishtiaq5:ahVBHv1yDNWMbW3v@cluster0.e2bw5nd.mongodb.net/AgriTest?appName=Cluster0");

async function run() {
  try {
     const order = await Order.findOne().sort({ createdAt: -1 });
     if (!order) {
       console.log("No orders found.");
       return process.exit(0);
     }
     console.log("Latest order:", order._id, "Current Status:", order.status);
     
     // Test transition
     order.status = "Confirmed";
     order.timeline.push({ status: "Confirmed", note: "Demo tests", timestamp: new Date() });
     await order.save();
     console.log("Save successful!");
  } catch (err) {
     console.error("Validation Save ERROR:", err);
  }
  process.exit(0);
}
run();
