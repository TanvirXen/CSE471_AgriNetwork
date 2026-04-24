const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const User = require("../models/User");

// Middleware to check for Admin role
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user && user.role === "Admin") {
            return next();
        }
        return res.status(403).json({ message: "Access denied. Admin role required." });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};

// @route   PATCH api/admin/verify/:userId
router.patch("/verify/:userId", auth, isAdmin, adminController.verifyUser);

// @route   GET api/admin/pending-verifications
router.get("/pending-verifications", auth, isAdmin, adminController.getPendingVerifications);

module.exports = router;
