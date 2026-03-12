const User = require("../models/User");

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
    res.json(user);
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
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   POST api/users/verify-nid
// @desc    Upload NID for verification
// @access  Private
exports.verifyNID = async (req, res) => {
  const { frontImage, backImage } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile.nidPhotos = {
      front: frontImage,
      back: backImage
    };
    
    user.profile.profileCompletion = 100;

    await user.save();
    res.json({ message: "NID uploaded successfully for verification", profile: user.profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
