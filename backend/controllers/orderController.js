const Order = require("../models/Order");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    orderData.orderNumber = "ORD-" + Date.now();

    const newOrder = await Order.create(orderData);
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
