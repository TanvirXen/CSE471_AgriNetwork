const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const auth = require("../middleware/auth");

router.post("/quote", auth, deliveryController.quoteDeliveryFee);
router.post("/:orderId/start", auth, deliveryController.startDelivery);
router.post("/:orderId/complete", auth, deliveryController.completeDelivery);
router.get("/:orderId", auth, deliveryController.getDeliveryDetails);

module.exports = router;
