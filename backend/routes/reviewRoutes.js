const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const auth = require("../middleware/auth");

// Post a review
router.post("/", auth, reviewController.createReview);

// Get reviews for a vendor
router.get("/vendor/:vendorId", reviewController.getVendorReviews);

// Report a review
router.post("/:id/report", auth, reviewController.reportReview);

// Get reviews for a product
router.get("/product/:productId", reviewController.getProductReviews);

module.exports = router;
