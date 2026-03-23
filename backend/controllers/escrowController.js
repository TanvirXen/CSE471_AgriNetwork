const Escrow = require('../models/Escrow');

/* GET /api/escrow/my  — All escrows where current user is buyer or seller */
exports.getMyEscrows = async (req, res) => {
  try {
    const userId = req.user?.id;
    const escrows = await Escrow.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('orderId', 'status')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(escrows);
  } catch (err) {
    console.error('getMyEscrows error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* GET /api/escrow/:id */
exports.getEscrowById = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .lean();

    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    const userId = req.user?.id?.toString();
    if (
      escrow.buyerId?._id?.toString() !== userId &&
      escrow.sellerId?._id?.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(escrow);
  } catch (err) {
    console.error('getEscrowById error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* POST /api/escrow  — Create escrow record after order placed */
exports.createEscrow = async (req, res) => {
  try {
    const { orderId, buyerId, sellerId, amountHeld, feeAmount, releaseCondition } = req.body;

    if (!orderId || !buyerId || !sellerId || !amountHeld) {
      return res.status(400).json({ message: 'Missing required fields: orderId, buyerId, sellerId, amountHeld' });
    }

    const existing = await Escrow.findOne({ orderId });
    if (existing) {
      return res.status(409).json({ message: 'Escrow already exists for this order', escrow: existing });
    }

    const escrow = new Escrow({
      orderId,
      buyerId,
      sellerId,
      amountHeld: parseFloat(amountHeld),
      feeAmount: parseFloat(feeAmount) || parseFloat(amountHeld) * 0.01,
      status: 'PendingFunding',
      releaseCondition: releaseCondition || 'DeliveryConfirmed',
    });

    await escrow.save();
    return res.status(201).json({ success: true, escrow });
  } catch (err) {
    console.error('createEscrow error:', err.message);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* PUT /api/escrow/:id/fund  — Mark as funded (payment gateway calls this) */
exports.fundEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
    if (escrow.status !== 'PendingFunding') {
      return res.status(400).json({ message: `Cannot fund escrow in status: ${escrow.status}` });
    }

    escrow.status = 'Funded';
    escrow.fundedAt = new Date();
    await escrow.save();

    return res.json({ success: true, escrow });
  } catch (err) {
    console.error('fundEscrow error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* PUT /api/escrow/:id/confirm  — Buyer confirms delivery → Release funds */
exports.confirmDelivery = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    const userId = req.user?.id?.toString();
    if (escrow.buyerId?.toString() !== userId) {
      return res.status(403).json({ message: 'Only the buyer can confirm delivery' });
    }

    if (escrow.status !== 'Funded' && escrow.status !== 'PartiallyReleased') {
      return res.status(400).json({ message: `Cannot confirm from status: ${escrow.status}` });
    }

    if (escrow.disputeOpened) {
      return res.status(400).json({ message: 'Cannot confirm delivery while dispute is open' });
    }

    escrow.status = 'Released';
    escrow.releaseAmount = escrow.amountHeld;
    escrow.releasedAt = new Date();
    await escrow.save();

    return res.json({ success: true, message: 'Delivery confirmed. Funds released to seller.', escrow });
  } catch (err) {
    console.error('confirmDelivery error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* PUT /api/escrow/:id/dispute  — Buyer raises dispute */
exports.raiseDispute = async (req, res) => {
  try {
    const { disputeReason } = req.body;
    if (!disputeReason || !disputeReason.trim()) {
      return res.status(400).json({ message: 'Please provide a dispute reason' });
    }

    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    const userId = req.user?.id?.toString();
    const isBuyer = escrow.buyerId?.toString() === userId;
    const isSeller = escrow.sellerId?.toString() === userId;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (escrow.status !== 'Funded' && escrow.status !== 'PartiallyReleased') {
      return res.status(400).json({ message: `Cannot raise dispute from status: ${escrow.status}` });
    }

    escrow.status = 'Disputed';
    escrow.disputeOpened = true;
    escrow.disputeReason = disputeReason.trim();
    await escrow.save();

    return res.json({ success: true, message: 'Dispute raised. Our team will review within 24 hours.', escrow });
  } catch (err) {
    console.error('raiseDispute error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* PUT /api/escrow/:id/resolve  — Admin resolves dispute */
exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, releaseToSeller } = req.body;
    // resolution: 'Release' | 'Refund'

    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
    if (escrow.status !== 'Disputed') {
      return res.status(400).json({ message: 'Escrow is not in Disputed status' });
    }

    if (releaseToSeller || resolution === 'Release') {
      escrow.status = 'Released';
      escrow.releaseAmount = escrow.amountHeld;
      escrow.releasedAt = new Date();
    } else {
      escrow.status = 'Refunded';
      escrow.refundAmount = escrow.amountHeld;
      escrow.refundedAt = new Date();
    }

    escrow.disputeResolvedAt = new Date();
    await escrow.save();

    return res.json({ success: true, message: `Dispute resolved: ${escrow.status}`, escrow });
  } catch (err) {
    console.error('resolveDispute error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* PUT /api/escrow/:id/cancel */
exports.cancelEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id);
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
    if (escrow.status !== 'PendingFunding') {
      return res.status(400).json({ message: 'Only PendingFunding escrows can be cancelled' });
    }

    escrow.status = 'Cancelled';
    await escrow.save();
    return res.json({ success: true, escrow });
  } catch (err) {
    console.error('cancelEscrow error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
