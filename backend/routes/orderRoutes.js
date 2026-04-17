const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


const upload = require("../middleware/cloudinaryUpload");

router.post("/", orderController.createOrder); 
router.get("/", orderController.getOrders); 
router.put("/:id", orderController.updateOrder); 
router.put("/:id/status", orderController.updateOrderStatus);
router.put("/:id/customer-proof", upload.single("photo"), orderController.submitCustomerProof);
router.put("/:id/cancel", orderController.cancelOrder); 
router.delete("/:id", orderController.deleteOrder); 

module.exports = router;
