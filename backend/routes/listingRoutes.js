const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createListing, getMyListings, deleteListing } = require('../controllers/listingController');
const auth = require('../middleware/auth');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Define routes
// @route   POST api/listings
router.post('/', auth, upload.single('productImage'), createListing);

// @route   GET api/listings
router.get('/', auth, getMyListings);

// @route   DELETE api/listings/:id
router.delete('/:id', auth, deleteListing);

module.exports = router;
