const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authenticate = require("../middleware/auth");

// Get all conversations for current user
router.get("/conversations", authenticate, messageController.getConversations);

// Get messages in a conversation
router.get("/:conversationId", authenticate, messageController.getMessages);

// Send a text message
router.post("/", authenticate, messageController.sendMessage);

// Send a price offer
router.post("/offer", authenticate, messageController.sendOffer);

// Accept or reject an offer
router.patch("/offer/:negotiationId", authenticate, messageController.respondToOffer);

module.exports = router;
