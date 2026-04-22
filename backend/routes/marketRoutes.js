const express = require("express");
const authenticate = require("../middleware/auth");
const marketController = require("../controllers/marketController");

const router = express.Router();

router.route("/products")
    .get(marketController.getProducts)
    .post(marketController.addProduct);

router.route("/streams")
    .get(marketController.getStreams)
    .post(marketController.addStream);

router.route("/streams/:id")
    .get(marketController.getStreamById);

router.route("/streams/:id/chat")
    .post(marketController.addChatMessage);

router.route("/streams/:id/end")
    .post(marketController.endStream);

router.get("/insights", marketController.getMarketInsights);
router.get("/crop-plans", authenticate, marketController.getCropPlans);
router.post("/crop-plans", authenticate, marketController.createCropPlan);
router.post("/seed", marketController.seedMarketData);

module.exports = router;
