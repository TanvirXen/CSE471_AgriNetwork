const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createEscrow,
  getMyEscrows,
  getEscrowById,
  fundEscrow,
  confirmDelivery,
  raiseDispute,
  resolveDispute,
  cancelEscrow,
} = require('../controllers/escrowController');

// Create escrow after order
router.post('/', auth, createEscrow);

// Get all escrows for current user (as buyer or seller)
router.get('/my', auth, getMyEscrows);

// Get single escrow by ID
router.get('/:id', auth, getEscrowById);

// Fund escrow (called by payment teammate)
router.put('/:id/fund', auth, fundEscrow);

// Buyer confirms delivery → release funds to seller
router.put('/:id/confirm', auth, confirmDelivery);

// Buyer/seller raises dispute
router.put('/:id/dispute', auth, raiseDispute);

// Admin resolves dispute
router.put('/:id/resolve', auth, resolveDispute);

// Cancel escrow (only when PendingFunding)
router.put('/:id/cancel', auth, cancelEscrow);

module.exports = router;
