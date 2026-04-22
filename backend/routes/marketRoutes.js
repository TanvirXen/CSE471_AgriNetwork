const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/marketController");
const auth     = require("../middleware/auth");

// GET  /api/market/insights              — Live dynamic market insights (no seed needed)
router.get("/insights",                   ctrl.getMarketInsights);

// GET  /api/market/crop-plans            — User's saved crop plans
router.get("/crop-plans",                 auth, ctrl.getCropPlans);

// POST /api/market/crop-plans            — Create AI crop plan (saves to DB if logged in)
router.post("/crop-plans",                auth, ctrl.createCropPlan);

// POST /api/market/crop-plans/analyze    — Alias: same logic, no auth required (frontend uses this)
router.post("/crop-plans/analyze",        ctrl.createCropPlan);

// POST /api/market/seed                  — Dev compat (now a no-op)
router.post("/seed",                      ctrl.seedMarketData);

module.exports = router;
