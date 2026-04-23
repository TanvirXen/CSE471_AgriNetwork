const express = require("express");
const router = express.Router();
const riderController = require("../controllers/riderController");

// Get nearby available riders
router.get("/nearby", riderController.getNearbyRiders);

module.exports = router;
