const User = require("../models/User");

// @route   PATCH api/admin/verify/:userId
// @desc    Verify a user's NID
// @access  Private (Admin Role)
exports.verifyUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationStatus === "none") {
        return res.status(400).json({ message: "User has not submitted NID yet" });
    }

    user.verificationStatus = "verified";
    user.isVerified = true;
    
    // Add "Verified" badge if not already present
    if (!user.profile.badges.includes("Verified")) {
      user.profile.badges.push("Verified");
    }

    await user.save();

    res.json({ 
        message: `User ${user.fullName} has been verified`,
        verificationStatus: user.verificationStatus,
        badges: user.profile.badges
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @route   GET api/admin/pending-verifications
// @desc    Get all users with pending verification
// @access  Private (Admin Role)
exports.getPendingVerifications = async (req, res) => {
    try {
        const users = await User.find({ verificationStatus: "pending" }).select("-passwordHash");
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};
