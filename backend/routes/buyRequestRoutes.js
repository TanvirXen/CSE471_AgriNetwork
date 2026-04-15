const express = require('express');
const router = express.Router();
const { createBuyRequest, getMyBuyRequests, deleteBuyRequest } = require('../controllers/buyRequestController');
const auth = require('../middleware/auth');

// @route   POST api/buy-requests
// @desc    Post a new procurement demand
router.post('/', auth, createBuyRequest);

// @route   GET api/buy-requests
// @desc    Get user's procurement demands
router.get('/', auth, getMyBuyRequests);

// @route   DELETE api/buy-requests/:id
// @desc    Delete a procurement demand
router.delete('/:id', auth, deleteBuyRequest);

module.exports = router;
