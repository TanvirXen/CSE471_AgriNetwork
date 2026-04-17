const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const authenticate = require("../middleware/auth");

// @route   GET /api/market/insights
// @desc    Get market trends
router.get("/insights", marketController.getMarketInsights);

// @route   GET /api/market/crop-plans
// @desc    Get user's plans
router.get("/crop-plans", authenticate, marketController.getCropPlans);

// @route   POST /api/market/crop-plans
// @desc    Create AI crop plan
router.post("/crop-plans", authenticate, marketController.createCropPlan);

// @route   POST /api/market/seed
// @desc    Seed insights
router.post("/seed", marketController.seedMarketData);

module.exports = router;
