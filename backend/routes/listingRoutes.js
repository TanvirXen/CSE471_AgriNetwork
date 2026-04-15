const express = require('express');
const router = express.Router();
const { createListing, getMyListings, deleteListing } = require('../controllers/listingController');
const auth = require('../middleware/auth');

// Define routes
// @route   POST api/listings
router.post('/', auth, createListing);

// @route   GET api/listings
router.get('/', auth, getMyListings);

// @route   DELETE api/listings/:id
router.delete('/:id', auth, deleteListing);

module.exports = router;
