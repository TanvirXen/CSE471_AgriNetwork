const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");
const FarmerListing = require("../models/FarmerListing");

exports.createReview = async (req, res) => {
  try {
    const { orderId, productId, vendorId, quality, timeliness, communication, reviewText } = req.body;
    const customerId = req.user.id;

    // 1. Verify Purchase
    const order = await Order.findOne({
      _id: orderId,
      buyerId: customerId,
      status: "Delivered"
    });

    if (!order) {
      return res.status(403).json({ message: "Only verified delivered purchases can be reviewed." });
    }

    // 2. Prevent Duplicates
    const existingReview = await Review.findOne({ orderId, customerId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this order." });
    }

    // 3. Calculate metrics
    const averageRating = (Number(quality || 0) + Number(timeliness || 0) + Number(communication || 0)) / 3;

    // 4. Save Review
    const newReview = await Review.create({
      orderId,
      productId,
      customerId,
      vendorId,
      rating: { quality, timeliness, communication },
      averageRating: averageRating || 0,
      reviewText,
      isVerifiedPurchase: true
    });

    // 5. Update Vendor Stats
    if (vendorId) {
      const allReviews = await Review.find({ vendorId, moderationStatus: { $ne: "deleted" } });
      const totalReviews = allReviews.length;
      let sumRating = 0;
      allReviews.forEach(r => sumRating += r.averageRating);
      const newGlobalAverage = totalReviews > 0 ? (sumRating / totalReviews) : 0;
      
      await User.findByIdAndUpdate(vendorId, {
        $set: {
          "profile.averageRating": newGlobalAverage,
          "profile.totalReviews": totalReviews
        }
      });
    }

    // 6. Update Product Rating
    if (productId) {
      const productReviews = await Review.find({ productId, moderationStatus: { $ne: "deleted" } });
      const productTotalReviews = productReviews.length;
      let pSumRating = 0;
      productReviews.forEach(r => pSumRating += r.averageRating);
      const newProductAverage = productTotalReviews > 0 ? (pSumRating / productTotalReviews) : 0;
      
      await FarmerListing.findByIdAndUpdate(productId, {
        $set: {
          averageRating: newProductAverage,
          totalReviews: productTotalReviews
        }
      });
    }

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (err) {
    console.error("[reviewController.createReview]", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const reviews = await Review.find({ 
      vendorId, 
      moderationStatus: { $ne: "deleted" } 
    }).populate("customerId", "fullName profile.avatar").sort("-createdAt");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ 
      productId, 
      moderationStatus: { $ne: "deleted" } 
    }).populate("customerId", "fullName profile.avatar").sort("-createdAt");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reportReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required to report." });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.isReported = true;
    review.reportReason = reason;
    review.reportedBy = userId;
    review.moderationStatus = "pending";

    await review.save();

    res.json({ message: "Review reported successfully. Admin will review it." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
