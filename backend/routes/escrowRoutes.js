const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/escrowController");
const auth     = require("../middleware/auth");

// POST /api/escrow          — Create new escrow (buyer)
router.post("/",              auth, ctrl.createEscrow);

// GET  /api/escrow/my       — Get all user's escrows
router.get("/my",             auth, ctrl.getMyEscrows);


// GET  /api/escrow/:id      — Single escrow detail
router.get("/:id",            auth, ctrl.getEscrowById);

// PUT  /api/escrow/:id/confirm — Confirm delivery
router.put("/:id/confirm",    auth, ctrl.confirmDelivery);

// PUT  /api/escrow/:id/dispute — Raise dispute
router.put("/:id/dispute",    auth, ctrl.raiseDispute);

// POST /api/escrow/seed     — Dev seed
router.post("/seed",          ctrl.seedEscrows);

module.exports = router;
