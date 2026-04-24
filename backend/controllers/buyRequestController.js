const { BuyRequest, FarmerListing } = require('../models');

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

    const categoryMap = {
      'crops': 'Crop',
      'fish': 'Fish',
      'poultry': 'Poultry',
      'livestock': 'Livestock',
      'fruits': 'Crop'
    };

    const finalCategoryType = categoryMap[category?.toLowerCase()] || 'Crop';

    const newBuyRequest = new BuyRequest({
      vendorId: req.user ? (req.user.id || req.user._id) : "640a1b2c3d4e5f6a7b8c9d1a", 
      title: `${quantity}${unit} of ${productName} needed`,
      productName,
      categoryType: finalCategoryType,
      categoryId: "640a1b2c3d4e5f6a7b8c9d0f", // Placeholder
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
    res.status(500).json({ success: false, message: 'Failed to broadcast procurement demand', error: error.message });
  }
};

// @desc    Get buy requests belonging to the current user with matches
// @route   GET /api/buy-requests
// @access  Private
exports.getMyBuyRequests = async (req, res) => {
  try {
    const filter = {};
    const userId = req.user ? (req.user.id || req.user._id) : null;
    if (userId) {
      filter.vendorId = userId;
    }
    
    const requests = await BuyRequest.find(filter).sort({ createdAt: -1 });

    // ENHANCEMENT: Populate farmerMatches dynamically if not already set
    const requestsWithMatches = await Promise.all(requests.map(async (reqDoc) => {
      const doc = reqDoc.toObject();
      
      // Find matching farmer listings
      const matches = await FarmerListing.find({
        $or: [
          { productName: { $regex: new RegExp(doc.productName, 'i') } },
          { title: { $regex: new RegExp(doc.productName, 'i') } }
        ],
        categoryType: doc.categoryType,
        status: { $ne: 'Archived' }
      }).limit(5);

      doc.farmerMatches = matches.map(m => ({
        farmerId: m.sellerId,
        listingId: m._id,
        imageUrl: (m.media && m.media[0] && m.media[0].url) ? (m.media[0].url.startsWith('http') ? m.media[0].url : `http://localhost:5000${m.media[0].url}`) : null,
        matchScore: 90, 
        matchedAt: new Date()
      }));
      
      return doc;
    }));

    res.status(200).json({ success: true, data: requestsWithMatches });
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch buy requests', error: error.message });
  }
};

// @desc    Get all public, open buy requests (for Farmer matching)
// @route   GET /api/buy-requests/public
// @access  Private (or Public depending on auth middleware, we'll keep it under auth)
exports.getPublicBuyRequests = async (req, res) => {
  try {
    const requests = await BuyRequest.find({ status: "Open" })
      .populate('vendorId', 'fullName')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Error fetching public buy requests:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch market demands' });
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
