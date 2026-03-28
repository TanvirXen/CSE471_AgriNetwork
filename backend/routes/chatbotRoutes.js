const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

router.post("/reply", chatbotController.reply);

module.exports = router;
