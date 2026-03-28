const { generateAdvisorReply } = require("../services/geminiAdvisorService");

exports.reply = async (req, res) => {
  const { message, history } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "A non-empty message is required." });
  }

  try {
    const reply = await generateAdvisorReply({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });

    return res.json({ reply });
  } catch (err) {
    console.error("Chatbot reply error:", err.message);

    if (err.message.includes("GEMINI_API_KEY is missing")) {
      return res.status(503).json({
        message: "AI advisor is not configured. Please contact support.",
      });
    }

    return res.status(500).json({
      message: "AI advisor is temporarily unavailable. Please try again.",
    });
  }
};
