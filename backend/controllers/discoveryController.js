const MarketListing = require("../models/MarketListing");

// @route   GET /api/discovery/listings
// @desc    Get all active market listings (with optional text/filter search)
// @access  Public
exports.getListings = async (req, res) => {
  try {
    const { q, type, district, maxPrice, minRating, verified } = req.query;

    const filter = { isActive: true };

    // Filter by type
    if (type && type !== "all") filter.type = type;

    // Filter by district
    if (district && district !== "Everywhere") {
      filter.district = { $regex: district, $options: "i" };
    }

    // Filter by price
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };

    // Filter by rating
    if (minRating) filter.rating = { $gte: Number(minRating) };

    // Filter verified only
    if (verified === "true") filter.isVerified = true;

    // Full-text search
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { crops: { $in: [new RegExp(q, "i")] } },
        { district: { $regex: q, $options: "i" } },
      ];
    }

    let listings = await MarketListing.find(filter)
      .populate("user", "fullName phone profile.avatar role")
      .sort({ rating: -1, createdAt: -1 })
      .limit(50);

    // Dynamically include Users who don't have MarketListings so they appear on the Map
    const User = require("../models/User");
    const userFilter = { 
      role: { $in: ["Farmer", "Vendor", "farmer", "vendor"] },
      status: { $in: ["Active", "Pending"] }
    };
    if (type && type !== "all") {
      userFilter.role = { $regex: new RegExp(`^${type}$`, "i") };
    }
    if (q) {
      userFilter.fullName = { $regex: q, $options: "i" };
    }

    const availableUsers = await User.find(userFilter).limit(50);
    const existingUserIds = listings.map(l => l.user && l.user._id ? l.user._id.toString() : "");

    const pseudoListings = availableUsers
      .filter(u => !existingUserIds.includes(u._id.toString()))
      .map((u, index) => ({
        _id: `user-${u._id}`,
        user: {
          _id: u._id,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          profile: u.profile
        },
        title: `${u.fullName} - ${u.role}`,
        crops: ["Various Products"],
        price: 0,
        unit: "Contact",
        stockStatus: "in-stock",
        type: u.role ? u.role.toLowerCase() : "farmer",
        district: "BD",
        rating: 4.0,
        isVerified: u.isVerified || false,
        location: {
          type: "Point",
          // assign a pseudo-location around BD center
          coordinates: [90.0 + (index * 0.1) % 1, 23.5 + (index * 0.1) % 1]
        }
      }));

    res.json([...listings, ...pseudoListings]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/discovery/listings/:id
// @desc    Get a single listing by ID
// @access  Public
exports.getListing = async (req, res) => {
  try {
    const listing = await MarketListing.findById(req.params.id).populate(
      "user",
      "fullName phone profile.avatar profile.bio role"
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/discovery/listings
// @desc    Create a new market listing
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const { title, crops, price, unit, stockStatus, type, district, division, description, contactPhone, location } =
      req.body;

    const listing = new MarketListing({
      user: req.user.id,
      title,
      crops: crops || [],
      price: price || 0,
      unit: unit || "৳/kg",
      stockStatus: stockStatus || "in-stock",
      type,
      district,
      division,
      description,
      contactPhone,
      location: location || {
        type: "Point",
        coordinates: [90.4125, 23.8103],
      },
    });

    await listing.save();
    await listing.populate("user", "fullName profile.avatar role");

    res.status(201).json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PATCH /api/discovery/listings/:id
// @desc    Update a listing
// @access  Private
exports.updateListing = async (req, res) => {
  try {
    const listing = await MarketListing.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found or unauthorized" });
    }

    Object.assign(listing, req.body);
    await listing.save();

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   DELETE /api/discovery/listings/:id
// @desc    Delete a listing
// @access  Private
exports.deleteListing = async (req, res) => {
  try {
    const listing = await MarketListing.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found or unauthorized" });
    }

    res.json({ message: "Listing removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/discovery/seed
// @desc    Seed database with sample Bangladeshi farmers/vendors
// @access  Public (for development/demo only)
exports.seedListings = async (req, res) => {
  try {
    const User = require("../models/User");

    // Clear existing
    await MarketListing.deleteMany({});
    
    // Create/Update Seed Users
    const seedUsersData = [
      { fullName: "Mojibur Rahman", phone: "01711223344", password: "password123", role: "Farmer" },
      { fullName: "Billal Hossain", phone: "01811223344", password: "password123", role: "Vendor" },
      { fullName: "Mokhlesh Ahmed", phone: "01911223344", password: "password123", role: "Farmer" }
    ];

    const users = [];
    for (const uData of seedUsersData) {
      let user = await User.findOne({ phone: uData.phone });
      if (!user) {
        user = new User({
          fullName: uData.fullName,
          phone: uData.phone,
          passwordHash: uData.password, // Pre-save handles hashing
          role: uData.role,
          status: "Active"
        });
        await user.save();
      }
      users.push(user);
    }

    const [mojibur, billal, mokhlesh] = users;

    const sampleListings = [
      {
        user: mojibur._id,
        title: "Mojibur Rahman - Tomato & Vegetable Farm",
        crops: ["Tomato", "Brinjal", "Capsicum"],
        price: 38,
        unit: "৳/kg",
        stockStatus: "limited",
        type: "farmer",
        district: "Comilla",
        division: "Chittagong",
        rating: 4.4,
        isVerified: true,
        location: { type: "Point", coordinates: [91.1842, 23.4607] },
        description: "Fresh vegetables from Comilla. Direct from Mojibur's farm.",
      },
      {
        user: billal._id,
        title: "Billal Hossain - Bulk Grain Seller",
        crops: ["Rice", "Wheat", "Lentil"],
        price: 65,
        unit: "৳/kg",
        stockStatus: "in-stock",
        type: "vendor",
        district: "Dhaka",
        division: "Dhaka",
        rating: 4.6,
        isVerified: true,
        location: { type: "Point", coordinates: [90.4125, 23.8103] },
        description: "Wholesale grain supplier in Dhaka city.",
      },
      {
        user: mokhlesh._id,
        title: "Mokhlesh Ahmed - Premium Fruit Farm",
        crops: ["Mango", "Litchi", "Guava"],
        price: 120,
        unit: "৳/kg",
        stockStatus: "in-stock",
        type: "farmer",
        district: "Rajshahi",
        division: "Rajshahi",
        rating: 4.9,
        isVerified: true,
        location: { type: "Point", coordinates: [88.6042, 24.3636] },
        description: "Famed Rajshahi fruits from Mokhlesh's orchard.",
      },
      {
        title: "Rahim Uddin - Premium Rice Farmer",
        crops: ["Rice", "Miniket", "Boro Dhan"],
        price: 62,
        unit: "৳/kg",
        stockStatus: "in-stock",
        type: "farmer",
        district: "Mymensingh",
        division: "Mymensingh",
        rating: 4.8,
        isVerified: true,
        location: { type: "Point", coordinates: [90.4017, 24.7471] },
        description: "Premium quality rice farmer from Mymensingh.",
      }
    ];

    await MarketListing.insertMany(sampleListings);

    res.json({ 
      message: "Database seeded with linked Users and Listings!", 
      testUsers: seedUsersData 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
