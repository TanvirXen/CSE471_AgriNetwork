const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");

router.post("/quote", deliveryController.quoteDeliveryFee);
router.post("/:orderId/start", deliveryController.startDelivery);
router.post("/:orderId/complete", deliveryController.completeDelivery);
router.get("/:orderId", deliveryController.getDeliveryDetails);

module.exports = router;
