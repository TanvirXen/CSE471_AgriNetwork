const express = require('express');
const router = express.Router();
const { getProducts, addProduct, getStreams, addStream } = require('../controllers/marketController');

// Product routes
router.route('/products')
    .get(getProducts)
    .post(addProduct);

// Stream routes
router.route('/streams')
    .get(getStreams)
    .post(addStream);

module.exports = router;
