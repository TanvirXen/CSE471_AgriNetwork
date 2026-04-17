const express = require("express");
const router = express.Router();
const escrowController = require("../controllers/escrowController");
const authenticate = require("../middleware/auth");

// @route   GET /api/escrow/my
// @desc    Get user's escrows
router.get("/my", authenticate, escrowController.getMyEscrows);

// @route   GET /api/escrow/:id
// @desc    Get specific escrow
router.get("/:id", authenticate, escrowController.getEscrowById);

// @route   PUT /api/escrow/:id/confirm
// @desc    Confirm delivery
router.put("/:id/confirm", authenticate, escrowController.confirmDelivery);

// @route   PUT /api/escrow/:id/dispute
// @desc    Raise dispute
router.put("/:id/dispute", authenticate, escrowController.raiseDispute);

// @route   POST /api/escrow/seed
// @desc    Seed demo data
router.post("/seed", escrowController.seedEscrows);

module.exports = router;
