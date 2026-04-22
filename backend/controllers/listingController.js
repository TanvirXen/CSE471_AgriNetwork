const { FarmerListing, MarketProduct } = require('../models');

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
    const finalPrice = parseFloat(price) || 0;
    const finalImageUrl = productImage || "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500";

    // 1. Create the detailed FarmerListing
    const newFarmerListing = new FarmerListing({
      sellerId: req.user.id, 
      title: productName,
      productName,
      variety: variety || 'Standard',
      grade: grade || 'A',
      categoryType: finalCategoryType,
      categoryId: "640a1b2c3d4e5f6a7b8c9d0f", // Placeholder
      description,
      quantity: parseFloat(currentStock) || 0,
      pricing: {
        mode: pricingType || "Fixed",
        unitPrice: finalPrice,
        unit: 'kg'
      },
      region: harvestOrigin,
      district: harvestOrigin,
      media: [{ type: "image", url: finalImageUrl }], 
      availabilitySchedule: [{ date: availabilityDate ? new Date(availabilityDate) : new Date() }]
    });

    const savedFarmerListing = await newFarmerListing.save();

    // 2. BRIDGE: Create the public MarketProduct entry
    const marketCategoryMap = {
      'Grains': 'crops',
      'Vegetables': 'crops',
      'Crops': 'crops',
      'Fish': 'fish',
      'Fruits': 'fruits',
      'Livestock': 'livestock',
      'Poultry': 'poultry'
    };

    const finalMarketCategory = marketCategoryMap[category] || (category ? category.toLowerCase() : 'crops');

    const marketProduct = new MarketProduct({
      name: productName,
      category: ['crops', 'fish', 'fruits', 'livestock', 'poultry'].includes(finalMarketCategory) ? finalMarketCategory : 'crops',
      segment: 'direct farm',
      price: finalPrice,
      quality: grade || 'A',
      image: finalImageUrl,
      sellerId: req.user.id
    });

    await marketProduct.save();

    res.status(201).json({ 
      success: true, 
      listing: savedFarmerListing, 
      marketNode: marketProduct 
    });
  } catch (error) {
    console.error("Error creating listing bridge:", error);
    res.status(500).json({ success: false, message: 'Failed to create listing' });
  }
};

// @desc    Get listings belonging to the current user
// @route   GET /api/listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const filter = { sellerId: req.user.id };

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
    const sellerId = req.user.id;

    // 1. Find the listing first
    const listing = await FarmerListing.findOne({ _id: listingId, sellerId });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    // 2. Delete from Marketplace (Bridge Sync)
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
    res.status(500).json({ success: false, message: 'Failed to delete listing' });
  }
};

// @desc    Get all active listings for the marketplace
// @route   GET /api/listings/all
// @access  Public
exports.getAllListings = async (req, res) => {
  try {
    const listings = await MarketProduct.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, listings });
  } catch (error) {
    console.error("Error fetching all listings:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch marketplace products' });
  }
};
