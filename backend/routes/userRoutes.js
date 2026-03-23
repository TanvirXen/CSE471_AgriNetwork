const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

// @route   POST api/users/profile
router.post("/profile", auth, userController.createProfile);

// @route   PUT api/users/profile
router.put("/profile", auth, userController.updateProfile);

// @route   POST api/users/verify-nid
router.post("/verify-nid", auth, userController.verifyNID);

module.exports = router;
