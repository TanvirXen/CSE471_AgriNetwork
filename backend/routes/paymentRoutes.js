const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

router.post("/wallet/initiate", auth, paymentController.initiateWalletTopUp);

router.all("/sslcommerz/success", paymentController.handleSuccessfulWalletPayment);
router.all("/sslcommerz/fail", paymentController.handleFailedWalletPayment);
router.all("/sslcommerz/cancel", paymentController.handleCancelledWalletPayment);
router.all("/sslcommerz/ipn", paymentController.handleWalletPaymentIpn);

module.exports = router;
