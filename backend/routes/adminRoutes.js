const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");

// Admin protection middleware
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

router.use(auth);
router.use(restrictToAdmin);

router.get("/reviews/reported", adminController.getReportedReviews);
router.patch("/reviews/:id/ignore", adminController.ignoreReview);
router.patch("/reviews/:id/delete", adminController.deleteReview);

module.exports = router;
