const express = require('express');
const router = express.Router();
const { getMarketInsights, getProductInsight } = require('../controllers/marketInsightController');

// GET /api/market-insights         (public)
router.get('/', getMarketInsights);

// GET /api/market-insights/:productName  (public)
router.get('/:productName', getProductInsight);

module.exports = router;
