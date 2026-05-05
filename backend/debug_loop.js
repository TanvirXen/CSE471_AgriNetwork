const mongoose = require("mongoose");
const Order = require("./models/Order");

mongoose.connect("mongodb+srv://tanvirishtiaq5:ahVBHv1yDNWMbW3v@cluster0.e2bw5nd.mongodb.net/AgriNetwork?appName=Cluster0");

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  try {
     const order = await Order.findOne({ status: "Pending" }).sort({ createdAt: -1 });
     if (!order) {
       console.log("No Pending orders found to simulate.");
       return process.exit(0);
     }
     console.log("Testing progression natively on:", order._id);
     
     const progression = [
        { status: "Confirmed", note: "Demo: Seller confirmed order", delay: 2000 },
        { status: "Shipped", note: "Demo: Order dispatched", delay: 2000 },
     ];

     for (const step of progression) {
        await delay(step.delay);
        const refetched = await Order.findById(order._id);
        
        const orderStages = ["Pending", "Confirmed", "Shipped", "OutForDelivery", "Delivered"];
        const currentIdx = orderStages.indexOf(refetched.status);
        const stepIdx = orderStages.indexOf(step.status);
        
        console.log(`Current: ${refetched.status} (${currentIdx}), Step: ${step.status} (${stepIdx})`);
        
        if (stepIdx > currentIdx) {
            refetched.status = step.status;
            refetched.timeline.push({ status: step.status, note: step.note, timestamp: new Date() });
            await refetched.save();
            console.log("Updated to:", step.status);
        } else {
            console.log("Skipped step", step.status);
        }
     }
  } catch (err) {
     console.error(err);
  }
  process.exit(0);
}
run();
