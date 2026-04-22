const Review = require("../models/Review");

exports.getReportedReviews = async (req, res) => {
  try {
    const reportedReviews = await Review.find({
      isReported: true,
      moderationStatus: "pending"
    })
      .populate("customerId", "fullName email")
      .populate("vendorId", "fullName email")
      .populate("reportedBy", "fullName email")
      .sort("-updatedAt");

    res.json(reportedReviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.ignoreReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Ignore the report but keep the review active
    review.isReported = false;
    review.moderationStatus = "ignored";
    review.reportReason = ""; // Optional: clear reason
    await review.save();

    res.json({ message: "Report ignored successfully.", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Soft delete
    review.moderationStatus = "deleted";
    await review.save();

    res.json({ message: "Review deleted successfully.", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
