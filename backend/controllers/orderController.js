const Order = require("../models/Order");

const simulateOrderProgression = async (orderId) => {
  const progression = [
    { status: "Confirmed", note: "Demo: Seller confirmed order", delay: 10000 },
    { status: "Shipped", note: "Demo: Order dispatched", delay: 10000 },
    { status: "OutForDelivery", note: "Demo: Out for delivery", delay: 15000 },
    { status: "Delivered", note: "Demo: Package successfully delivered", delay: 15000 },
  ];

  for (const step of progression) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    try {
      const order = await Order.findById(orderId);
      if (!order || order.status === "Cancelled" || order.status === "Delivered") break;

      const orderStages = ["Pending", "Confirmed", "Shipped", "OutForDelivery", "Delivered"];
      const currentIdx = orderStages.indexOf(order.status);
      const stepIdx = orderStages.indexOf(step.status);
      
      if (stepIdx > currentIdx) {
        order.status = step.status;
        order.timeline.push({ status: step.status, note: step.note, timestamp: new Date() });
        if (step.status === "Delivered") {
          order.deliveredAt = new Date();
          order.completedAt = new Date();
        }
        await order.save();
      }
    } catch (e) {
      console.error("Progression simulation error:", e);
      break;
    }
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    orderData.orderNumber = "ORD-" + Date.now();

    const newOrder = await Order.create(orderData);

    // Trigger demo progression loosely bridging node context
    simulateOrderProgression(newOrder._id).catch(err => console.error(err));

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
    if (req.query.status) filters.status = req.query.status;

    const orders = await Order.find(filters);
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
