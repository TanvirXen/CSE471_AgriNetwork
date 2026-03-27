const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


router.post("/", orderController.createOrder); 
router.get("/", orderController.getOrders); 
router.put("/:id", orderController.updateOrder); 
router.put("/:id/cancel", orderController.cancelOrder); 
router.delete("/:id", orderController.deleteOrder); 

module.exports = router;
