const express = require('express');
const router = express.Router();
const { getProducts, addProduct, getStreams, addStream, getStreamById, addChatMessage, endStream } = require('../controllers/marketController');

// Product routes
router.route('/products')
    .get(getProducts)
    .post(addProduct);

// Stream routes
router.route('/streams')
    .get(getStreams)
    .post(addStream);

// Single stream route
router.route('/streams/:id')
    .get(getStreamById);

// Stream chat
router.route('/streams/:id/chat')
    .post(addChatMessage);

// End stream
router.route('/streams/:id/end')
    .post(endStream);

module.exports = router;
