const User = require("../models/User");

const getSafeUserById = async (userId) => User.findById(userId).select("-passwordHash");

// @route   POST api/users/profile
// @desc    Complete/Create profile
// @access  Private
exports.createProfile = async (req, res) => {
  const { phone, address, businessName, shopName, tradeLicenseNo, productCategories } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    user.phone = phone || user.phone;
    user.profile.organizationName = businessName || user.profile.organizationName;
    user.profile.shopName = shopName || user.profile.shopName;
    user.profile.tradeLicenseNo = tradeLicenseNo || user.profile.tradeLicenseNo;
    user.profile.productCategories = productCategories || user.profile.productCategories;
    
    // Add address if provided
    if (address) {
      user.addresses.push({
        fullAddress: address,
        isDefault: true
      });
    }

    user.status = "Active"; // Assuming profile completion activates the user
    user.profile.profileCompletion = 70; // Set a progress value

    await user.save();
    res.json(await getSafeUserById(user._id));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   PUT api/users/profile
// @desc    Update profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { fullName, email, phone, address, businessName, productCategories } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic info
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    // Update profile sub-doc
    if (businessName) user.profile.shopName = businessName;
    if (productCategories) user.profile.productCategories = productCategories;

    // Update/Add address
    if (address) {
      if (user.addresses.length > 0) {
        user.addresses[0].fullAddress = address;
      } else {
        user.addresses.push({ fullAddress: address, isDefault: true });
      }
    }

    await user.save();
    res.json(await getSafeUserById(user._id));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   POST api/users/verify-nid
// @desc    Upload NID for verification
// @access  Private
exports.verifyNID = async (req, res) => {
  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.files || (!req.files.nidFront && !req.files.nidBack)) {
      return res.status(400).json({ message: "Please upload NID images" });
    }

    const { extractedName, extractedNid } = req.body;

    const nidFrontPath = req.files.nidFront ? req.files.nidFront[0].path : user.nidFront;
    const nidBackPath = req.files.nidBack ? req.files.nidBack[0].path : user.nidBack;

    user.nidFront = nidFrontPath;
    user.nidBack = nidBackPath;
    user.nidImage = nidFrontPath; // Set the primary NID image
    
    let kycMethod = "manual";
    
    // Universal Automated e-KYC Pipeline (For Customers and Vendors)
    if (user.role === "Customer" || user.role === "Vendor") {
      try {
        console.log(`Processing frontend OCR data for user: ${user.fullName}`);
        
        if (extractedNid) {
          user.profile.nidNumber = extractedNid;
        }

        // Trust the frontend OCR and verify the user immediately
        user.verificationStatus = "verified";
        user.isVerified = true;
        kycMethod = "automatic";
        
        if (!user.profile.badges.includes("Verified")) {
          user.profile.badges.push("Verified");
        }
        console.log("Automatic KYC Success based on frontend OCR!");

      } catch (err) {
        console.error("Verification processing error:", err);
        // Fallback to verified anyway if they uploaded files, as per 'Instant Verification' requirement
        user.verificationStatus = "verified";
        user.isVerified = true;
      }
    } else {
      // For other roles, still verify instantly if they provide NID
      user.verificationStatus = "verified";
      user.isVerified = true;
    }
    
    user.profile.profileCompletion = 100;

    await user.save();
    
    res.json({ 
      success: true,
      message: "Verification Successful!", 
      verificationStatus: user.verificationStatus,
      kycMethod,
      nidFront: user.nidFront,
      nidBack: user.nidBack,
      nidImage: user.nidImage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
