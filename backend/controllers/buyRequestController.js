const { BuyRequest } = require('../models');

// @desc    Create a new Buy Request (Procurement Demand)
// @route   POST /api/buy-requests
// @access  Private
exports.createBuyRequest = async (req, res) => {
  try {
    const {
      productName,
      category,
      qualityGrade,
      quantity,
      unit,
      budget,
      deadline,
      urgency
    } = req.body;

    const newBuyRequest = new BuyRequest({
      vendorId: req.user ? req.user.id : "640a1b2c3d4e5f6a7b8c9d1a", // Fallback for testing
      title: `${quantity}${unit} of ${productName} needed`,
      productName,
      categoryType: ["Fish", "Poultry", "Livestock"].includes(category) ? category : "Crop",
      categoryId: "640a1b2c3d4e5f6a7b8c9d0f", // Placeholder category ID
      preferredGrade: qualityGrade || 'A',
      quantityNeeded: parseFloat(quantity) || 0,
      quantityUnit: unit || 'kg',
      budgetMax: parseFloat(budget) || 0,
      deliveryTimelineEnd: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "Open"
    });

    const savedRequest = await newBuyRequest.save();
    res.status(201).json({ success: true, data: savedRequest });
  } catch (error) {
    console.error("Error creating buy request:", error);
    res.status(500).json({ success: false, message: 'Failed to broadcast procurement demand' });
  }
};

// @desc    Get buy requests belonging to the current user
// @route   GET /api/buy-requests
// @access  Private
exports.getMyBuyRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user) {
      filter.vendorId = req.user.id;
    }
    
    const requests = await BuyRequest.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch buy requests' });
  }
};

// @desc    Delete a buy request
// @route   DELETE /api/buy-requests/:id
// @access  Private
exports.deleteBuyRequest = async (req, res) => {
  try {
    const buyRequest = await BuyRequest.findById(req.params.id);

    if (!buyRequest) {
      return res.status(404).json({ success: false, message: 'Buy request not found' });
    }

    // Check if user owns the request
    if (req.user && buyRequest.vendorId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await buyRequest.deleteOne();
    res.status(200).json({ success: true, message: 'Request removed' });
  } catch (error) {
    console.error("Error deleting buy request:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
