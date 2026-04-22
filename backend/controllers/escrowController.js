const Escrow = require("../models/Escrow");
const Order  = require("../models/Order");


// ─────────────────────────────────────────────
// GET /api/escrow/my
// ─────────────────────────────────────────────
exports.getMyEscrows = async (req, res) => {
  try {
    const userId = req.user.id;
    const escrows = await Escrow.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("buyerId",  "fullName email profile.avatar")
      .populate("sellerId", "fullName email profile.avatar")
      .sort({ createdAt: -1 });

    res.json(escrows);
  } catch (err) {
    console.error("[escrowController.getMyEscrows]", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/escrow/:id
// ─────────────────────────────────────────────
exports.getEscrowById = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate("buyerId",  "fullName email")
      .populate("sellerId", "fullName email")
      .populate("orderId");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    if (
      escrow.buyerId._id.toString()  !== req.user.id &&
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

// ─────────────────────────────────────────────
// POST /api/escrow   ← NEW: Create an escrow
// ─────────────────────────────────────────────
exports.createEscrow = async (req, res) => {
  try {
    const {
      sellerId,
      amountHeld,
      product,
      releaseCondition = "DeliveryConfirmed",
      note,
    } = req.body;

    if (!sellerId || !amountHeld || !product) {
      return res.status(400).json({
        message: "sellerId, amountHeld, and product are required.",
      });
    }

    if (sellerId === req.user.id) {
      return res.status(400).json({ message: "Buyer and seller cannot be the same user." });
    }

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid Seller User ID format." });
    }

    const amount  = parseFloat(amountHeld);
    const feeAmt  = Math.round(amount * 0.01); // 1% platform fee

    const newEscrow = new Escrow({
      buyerId:          req.user.id,
      sellerId,
      amountHeld:       amount,
      feeAmount:        feeAmt,
      status:           "Funded",
      releaseCondition,
      product,
      note:             note || "",
      fundedAt:         new Date(),
    });

    console.log("[escrowController] Saving new escrow:", newEscrow);
    await newEscrow.save();

    // Use query populate for consistency
    const savedEscrow = await Escrow.findById(newEscrow._id)
      .populate("buyerId",  "fullName email profile.avatar")
      .populate("sellerId", "fullName email profile.avatar");

    res.status(201).json(savedEscrow);
  } catch (err) {
    console.error("[escrowController.createEscrow]", err.message);
    if (err.name === 'CastError' || err.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({ message: "Invalid ID format provided." });
    }
    res.status(500).json({ message: "Server error creating escrow" });
  }
};



// ─────────────────────────────────────────────
// PUT /api/escrow/:id/confirm
// ─────────────────────────────────────────────
exports.confirmDelivery = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    if (escrow.buyerId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Only the buyer can confirm delivery" });
    }
    if (escrow.status !== "Funded") {
      return res.status(400).json({ message: `Cannot confirm in status: ${escrow.status}` });
    }

    escrow.status        = "Released";
    escrow.releasedAt    = new Date();
    escrow.releaseAmount = escrow.amountHeld;
    await escrow.save();

    if (escrow.orderId) {
      await Order.findByIdAndUpdate(escrow.orderId, {
        status: "Delivered", completedAt: new Date(),
      });
    }

    res.json(escrow);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/escrow/:id/dispute
// ─────────────────────────────────────────────
exports.raiseDispute = async (req, res) => {
  try {
    const { disputeReason } = req.body;
    const escrow = await Escrow.findById(req.params.id);

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    if (
      escrow.buyerId.toString()  !== req.user.id &&
      escrow.sellerId.toString() !== req.user.id
    ) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    escrow.status         = "Disputed";
    escrow.disputeOpened  = true;
    escrow.disputeReason  = disputeReason;
    await escrow.save();

    res.json(escrow);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/escrow/seed  ← kept for compatibility
// ─────────────────────────────────────────────
exports.seedEscrows = async (req, res) => {
  try {
    const User   = require("../models/User");
    const buyer  = await User.findOne({ role: "Vendor" }) || await User.findOne();
    const seller = await User.findOne({ role: "Farmer" }) || await User.findOne();

    if (!buyer || !seller) {
      return res.status(400).json({ message: "Need at least two users to seed escrows" });
    }

    const demoEscrows = [
      {
        buyerId:          buyer._id,
        sellerId:         seller._id,
        amountHeld:       15000,
        feeAmount:        150,
        status:           "Funded",
        product:          "Boro Rice (25 Bags)",
        releaseCondition: "DeliveryConfirmed",
        fundedAt:         new Date(),
      },
      {
        buyerId:          buyer._id,
        sellerId:         seller._id,
        amountHeld:       8000,
        feeAmount:        80,
        status:           "Released",
        product:          "Tomato (100 kg)",
        releaseCondition: "DeliveryConfirmed",
        fundedAt:         new Date(Date.now() - 86400000 * 5),
        releasedAt:       new Date(),
        releaseAmount:    8000,
      },
    ];

    await Escrow.deleteMany({});
    const created = await Escrow.insertMany(demoEscrows);
    res.json({ message: "Escrows seeded", count: created.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
