const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { analyzeCrops, getCropPlanHistory } = require('../controllers/cropPlanController');

// POST /api/crop-plan/analyze  (auth optional for demo; strictly auth in prod)
router.post('/analyze', analyzeCrops);

// GET  /api/crop-plan/history  (auth required)
router.get('/history', auth, getCropPlanHistory);

module.exports = router;
