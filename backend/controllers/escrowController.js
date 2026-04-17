const Escrow = require("../models/Escrow");
const Order = require("../models/Order");

// @route   GET /api/escrow/my
// @desc    Get all escrows where user is buyer or seller
// @access  Private
exports.getMyEscrows = async (req, res) => {
  try {
    const userId = req.user.id;
    const escrows = await Escrow.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("buyerId", "fullName email profile.avatar")
      .populate("sellerId", "fullName email profile.avatar")
      .sort({ createdAt: -1 });

    res.json(escrows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/escrow/:id
// @desc    Get escrow by ID
// @access  Private
exports.getEscrowById = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate("buyerId", "fullName email")
      .populate("sellerId", "fullName email")
      .populate("orderId");

    if (!escrow) {
      return res.status(404).json({ message: "Escrow not found" });
    }

    // Verify ownership
    if (
      escrow.buyerId._id.toString() !== req.user.id &&
      escrow.sellerId._id.toString() !== req.user.id
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(escrow);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/escrow/:id/confirm
// @desc    Confirm delivery and release funds
// @access  Private (Buyer only)
exports.confirmDelivery = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id);

    if (!escrow) {
      return res.status(404).json({ message: "Escrow not found" });
    }

    // Only buyer can confirm delivery
    if (escrow.buyerId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Only the buyer can confirm delivery" });
    }

    if (escrow.status !== "Funded") {
      return res.status(400).json({ message: `Cannot confirm delivery in current status: ${escrow.status}` });
    }

    escrow.status = "Released";
    escrow.releasedAt = Date.now();
    escrow.releaseAmount = escrow.amountHeld;
    await escrow.save();

    // Update corresponding order if exists
    if (escrow.orderId) {
      await Order.findByIdAndUpdate(escrow.orderId, {
        status: "Delivered",
        completedAt: Date.now(),
      });
    }

    res.json(escrow);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/escrow/:id/dispute
// @desc    Raise a dispute for an escrow
// @access  Private
exports.raiseDispute = async (req, res) => {
  try {
    const { disputeReason } = req.body;
    const escrow = await Escrow.findById(req.params.id);

    if (!escrow) {
      return res.status(404).json({ message: "Escrow not found" });
    }

    if (
      escrow.buyerId.toString() !== req.user.id &&
      escrow.sellerId.toString() !== req.user.id
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    escrow.status = "Disputed";
    escrow.disputeOpened = true;
    escrow.disputeReason = disputeReason;
    await escrow.save();

    res.json(escrow);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/escrow/seed
// @desc    Seed demo escrows
// @access  Public (Dev only)
exports.seedEscrows = async (req, res) => {
  try {
    const User = require("../models/User");
    const buyer = await User.findOne({ role: "Vendor" }) || await User.findOne();
    const seller = await User.findOne({ role: "Farmer" }) || await User.findOne();

    if (!buyer || !seller) {
      return res.status(400).json({ message: "Need at least two users to seed escrows" });
    }

    const demoEscrows = [
      {
        orderId: new require("mongoose").Types.ObjectId(),
        buyerId: buyer._id,
        sellerId: seller._id,
        amountHeld: 15000,
        feeAmount: 150,
        status: "Funded",
        releaseCondition: "DeliveryConfirmed",
        fundedAt: new Date(),
      },
      {
        orderId: new require("mongoose").Types.ObjectId(),
        buyerId: buyer._id,
        sellerId: seller._id,
        amountHeld: 8000,
        feeAmount: 80,
        status: "Released",
        releaseCondition: "DeliveryConfirmed",
        fundedAt: new Date(Date.now() - 86400000 * 5),
        releasedAt: new Date(),
        releaseAmount: 8000,
      }
    ];

    await Escrow.deleteMany({});
    const created = await Escrow.insertMany(demoEscrows);

    res.json({ message: "Escrows seeded", count: created.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
