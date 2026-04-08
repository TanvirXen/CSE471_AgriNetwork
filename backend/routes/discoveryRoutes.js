const express = require("express");
const router = express.Router();
const discoveryController = require("../controllers/discoveryController");
const authenticate = require("../middleware/auth");

// Seed sample data (demo only)
router.get("/seed", discoveryController.seedListings);

// Get all listings (public, with filter params)
router.get("/listings", discoveryController.getListings);

// Get single listing
router.get("/listings/:id", discoveryController.getListing);

// Create new listing (authenticated)
router.post("/listings", authenticate, discoveryController.createListing);

// Update listing
router.patch("/listings/:id", authenticate, discoveryController.updateListing);

// Delete listing
router.delete("/listings/:id", authenticate, discoveryController.deleteListing);

module.exports = router;
