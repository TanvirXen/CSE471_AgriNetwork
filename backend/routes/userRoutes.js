const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const uploadNidImages = (req, res, next) => {
  upload.fields([
    { name: "nidFront", maxCount: 1 },
    { name: "nidBack", maxCount: 1 },
  ])(req, res, (err) => {
    if (!err) return next();
    return res.status(400).json({
      message:
        err.message === "Unexpected end of form"
          ? "Upload was interrupted. Please try again."
          : err.message,
    });
  });
};

// @route   POST api/users/profile
router.post("/profile", auth, userController.createProfile);

// @route   PUT api/users/profile
router.put("/profile", auth, userController.updateProfile);

// @route   POST api/users/verify-nid
router.post(
  "/verify-nid",
  auth,
  uploadNidImages,
  userController.verifyNID
);

module.exports = router;
