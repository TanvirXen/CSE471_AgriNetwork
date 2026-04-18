const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const authenticate = require("../middleware/auth");

router.use(authenticate);

router.get("/sessions", chatbotController.listSessions);
router.post("/sessions", chatbotController.createSession);
router.get("/sessions/:sessionId", chatbotController.getSession);
router.post("/sessions/:sessionId/reply", chatbotController.reply);

module.exports = router;
