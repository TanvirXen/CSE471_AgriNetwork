const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const upload = require("../middleware/cloudinaryUpload");

router.post("/", auth, orderController.createOrder); 
router.get("/", auth, orderController.getOrders); 
router.put("/:id", auth, orderController.updateOrder); 
router.put("/:id/status", auth, orderController.updateOrderStatus);
router.put("/:id/customer-proof", auth, upload.single("photo"), orderController.submitCustomerProof);
router.put("/:id/cancel", auth, orderController.cancelOrder); 
router.delete("/:id", auth, orderController.deleteOrder); 

module.exports = router;
