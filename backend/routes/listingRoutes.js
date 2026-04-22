const express = require('express');
const router = express.Router();
const { createListing, getMyListings, deleteListing, getAllListings } = require('../controllers/listingController');
const auth = require('../middleware/auth');

// Define routes
// @route   POST api/listings
router.post('/', auth, createListing);

// @route   GET api/listings (My Listings)
router.get('/', auth, getMyListings);

// @route   GET api/listings/all (Marketplace)
router.get('/all', getAllListings);

// @route   DELETE api/listings/:id
router.delete('/:id', auth, deleteListing);

module.exports = router;
