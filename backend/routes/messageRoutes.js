const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const videoCallController = require("../controllers/videoCallController");
const authenticate = require("../middleware/auth");

// Get all conversations for current user
router.get("/conversations", authenticate, messageController.getConversations);

// Get messages in a conversation
router.get("/:conversationId", authenticate, messageController.getMessages);

// Send a text message
router.post("/", authenticate, messageController.sendMessage);

// Video calling
router.post("/calls/start", authenticate, videoCallController.startCall);
router.post("/calls/:callId/answer", authenticate, videoCallController.answerCall);
router.post("/calls/:callId/end", authenticate, videoCallController.endCall);

// Send a price offer
router.post("/offer", authenticate, messageController.sendOffer);

// Accept or reject an offer
router.patch("/offer/:negotiationId", authenticate, messageController.respondToOffer);

module.exports = router;
