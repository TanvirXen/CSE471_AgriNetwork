const ChatbotSession = require("../models/ChatbotSession");
const {
  generateAdvisorReply,
  generateChatTitle,
} = require("../services/geminiAdvisorService");

const DEFAULT_GREETING =
  "Assalamu alaikum. I am your AI agriculture advisor for Bangladesh. Ask me about seasonal crop planning, pest and disease decisions, or market strategy.";

const buildDefaultTitle = (date = new Date()) =>
  `Chat ${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })}`;

const normalizeSessionTitle = (title) => {
  const cleanTitle = (title || "").replace(/\s+/g, " ").trim();
  return cleanTitle ? cleanTitle.slice(0, 60) : "New Chat";
};

const toPreview = (content = "") => {
  const text = content.replace(/\s+/g, " ").trim();
  return text.length > 100 ? `${text.slice(0, 97)}...` : text;
};

const serializeMessage = (message, index) => ({
  id: `${index + 1}`,
  role: message.role === "assistant" ? "ai" : message.role,
  text: message.content,
  time: new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  timestamp: message.timestamp,
});

const serializeSessionSummary = (session) => {
  const lastMessage = session.messages[session.messages.length - 1];

  return {
    id: session._id,
    title: session.sessionTitle || buildDefaultTitle(session.createdAt),
    updatedAt: session.updatedAt,
    createdAt: session.createdAt,
    lastMessagePreview: lastMessage ? toPreview(lastMessage.content) : "",
    messageCount: session.messages.length,
  };
};

const serializeSessionDetail = (session) => ({
  id: session._id,
  title: session.sessionTitle || buildDefaultTitle(session.createdAt),
  updatedAt: session.updatedAt,
  createdAt: session.createdAt,
  messages: session.messages.map(serializeMessage),
});

const buildHistoryForModel = (messages) =>
  messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      text: message.content,
    }));

exports.listSessions = async (req, res) => {
  try {
    const sessions = await ChatbotSession.find({
      userId: req.user.id,
      sessionStatus: "Active",
    })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      sessions: sessions.map(serializeSessionSummary),
    });
  } catch (err) {
    console.error("Chatbot list sessions error:", err.message);
    return res.status(500).json({ message: "Failed to load chat history." });
  }
};

exports.createSession = async (req, res) => {
  try {
    const session = await ChatbotSession.create({
      userId: req.user.id,
      sessionTitle: buildDefaultTitle(),
      messages: [
        {
          role: "assistant",
          content: DEFAULT_GREETING,
          timestamp: new Date(),
        },
      ],
      dataSource: "AI",
      topicTags: [],
      sessionStatus: "Active",
    });

    return res.status(201).json({
      session: serializeSessionDetail(session),
    });
  } catch (err) {
    console.error("Chatbot create session error:", err.message);
    return res.status(500).json({ message: "Failed to create chat." });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await ChatbotSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
      sessionStatus: "Active",
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found." });
    }

    return res.json({
      session: serializeSessionDetail(session),
    });
  } catch (err) {
    console.error("Chatbot get session error:", err.message);
    return res.status(500).json({ message: "Failed to load chat session." });
  }
};

exports.reply = async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "A non-empty message is required." });
  }

  try {
    const session = await ChatbotSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
      sessionStatus: "Active",
    });

    if (!session) {
      return res.status(404).json({ message: "Chat session not found." });
    }

    const trimmedMessage = message.trim();
    const userTimestamp = new Date();

    session.messages.push({
      role: "user",
      content: trimmedMessage,
      timestamp: userTimestamp,
    });

    if (
      !session.sessionTitle ||
      session.sessionTitle === "New Chat" ||
      session.sessionTitle.startsWith("Chat ")
    ) {
      session.sessionTitle = normalizeSessionTitle(await generateChatTitle(trimmedMessage));
    }

    let reply;
    let degraded = false;

    try {
      reply = await generateAdvisorReply({
        message: trimmedMessage,
        history: buildHistoryForModel(session.messages),
      });
    } catch (err) {
      console.error("Chatbot model error:", err.message);

      if (err.message.includes("GEMINI_API_KEY is missing")) {
        reply = "AI advisor is not configured right now. Please contact support.";
        degraded = true;
      } else {
        reply = "AI advisor is temporarily unavailable. Please try again.";
        degraded = true;
      }
    }

    session.messages.push({
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    });

    await session.save();

    return res.json({
      session: serializeSessionDetail(session),
      reply,
      degraded,
    });
  } catch (err) {
    console.error("Chatbot reply error:", err.message);

    return res.status(500).json({
      message: "AI advisor is temporarily unavailable. Please try again.",
    });
  }
};
