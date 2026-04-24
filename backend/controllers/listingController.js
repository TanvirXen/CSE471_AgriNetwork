const { FarmerListing, MarketProduct, Category } = require('../models');

// @desc    Create a new Farmer Listing and bridge it to the Marketplace
// @route   POST /api/listings
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const {
      productName,
      category,
      description,
      pricingType,
      price,
      harvestOrigin,
      currentStock,
      availabilityDate,
      variety,
      grade,
      productImage 
    } = req.body;

    const categoryMap = {
      'crops': 'Crop',
      'fish': 'Fish',
      'poultry': 'Poultry',
      'livestock': 'Livestock',
      'fruits': 'Crop'
    };

    const finalCategoryType = categoryMap[category?.toLowerCase()] || 'Crop';
    
    // Find category ID from database
    let categoryDoc = await Category.findOne({ categoryType: finalCategoryType });
    if (!categoryDoc) {
      // Fallback or create default if not found
      categoryDoc = await Category.findOne(); 
    }

    const finalPrice = parseFloat(price) || 0;
    
    // Check if an image was uploaded via Multer
    let finalImageUrl = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500";
    if (req.file) {
      // Ensure the URL is accessible from the frontend
      finalImageUrl = `/uploads/${req.file.filename}`;
    } else if (productImage) {
      finalImageUrl = productImage;
    }

    // 1. Create the detailed FarmerListing
    const newFarmerListing = new FarmerListing({
      sellerId: req.user ? (req.user.id || req.user._id) : "640a1b2c3d4e5f6a7b8c9d0e", 
      categoryId: categoryDoc ? categoryDoc._id : undefined, // Now optional
      title: productName,
      productName,
      variety: variety || 'Standard',
      grade: grade || 'A',
      categoryType: finalCategoryType,
      description,
      quantity: parseFloat(currentStock) || 0,
      pricing: {
        mode: pricingType || "Fixed",
        unitPrice: finalPrice,
        unit: currentStock ? (currentStock.includes(' ') ? currentStock.split(' ')[1] : 'kg') : 'kg'
      },
      region: harvestOrigin,
      district: harvestOrigin,
      media: [{ type: "image", url: finalImageUrl }], 
      availabilitySchedule: [{ date: availabilityDate ? new Date(availabilityDate) : new Date() }]
    });

    const savedFarmerListing = await newFarmerListing.save();

    // 2. BRIDGE: Create the public MarketProduct entry
    const marketCategoryMap = {
      'crops': 'crops',
      'fish': 'fish',
      'fruits': 'fruits',
      'livestock': 'livestock',
      'poultry': 'poultry'
    };

    const finalMarketCategory = marketCategoryMap[category?.toLowerCase()] || 'crops';

    const marketProduct = new MarketProduct({
      name: productName,
      category: finalMarketCategory,
      segment: 'direct farm',
      price: finalPrice,
      quality: grade || 'A',
      image: finalImageUrl, 
      sellerId: req.user ? req.user.id : null
    });

    await marketProduct.save();

    res.status(201).json({ 
      success: true, 
      listing: savedFarmerListing, 
      marketNode: marketProduct 
    });
  } catch (error) {
    console.error("Error creating listing bridge:", error);
    res.status(500).json({ success: false, message: 'Failed to create listing', error: error.message });
  }
};

// @desc    Get listings belonging to the current user
// @route   GET /api/listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const filter = {};
    if (req.user) {
      filter.sellerId = req.user.id || req.user._id;
    }
    
    // Fetch from the advanced model
    const listings = await FarmerListing.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch listings' });
  }
};

// @desc    Delete a listing and its marketplace bridge
// @route   DELETE /api/listings/:id
// @access  Private
exports.deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const sellerId = req.user ? (req.user.id || req.user._id) : null;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // 1. Find the listing first to get details for marketplace deletion
    const listing = await FarmerListing.findOne({ _id: listingId, sellerId });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    // 2. Delete from Marketplace (Bridge Sync)
    // We search by name and sellerId to remove the corresponding marketplace card
    await MarketProduct.deleteMany({ 
      name: listing.productName, 
      sellerId: sellerId,
      price: listing.pricing.unitPrice 
    });

    // 3. Delete the FarmerListing
    await listing.deleteOne();

    res.status(200).json({ success: true, message: 'Listing and marketplace entries removed successfully' });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({ success: false, message: 'Failed to delete listing', error: error.message });
  }
};
