const Message = require("../models/Message");
const Negotiation = require("../models/Negotiation");
const User = require("../models/User");

// @route   GET /api/messages/conversations
// @desc    Get all conversations for logged-in user
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find unique conversations the user is a part of
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName profile.avatar role")
      .populate("receiver", "fullName profile.avatar role");

    // Group by conversationId and get the latest message
    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      if (!seen.has(msg.conversationId)) {
        seen.add(msg.conversationId);
        const other = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
        conversations.push({
          conversationId: msg.conversationId,
          otherUser: other,
          lastMessage: msg.text || "Sent an offer",
          lastTime: msg.createdAt,
          unread: 0,
        });
      }
    }

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a specific conversation
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate("sender", "fullName profile.avatar role")
      .populate("negotiationId")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/messages
// @desc    Send a message (text or multimedia)
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const conversationId = Message.getConversationId(senderId, receiverId);

    let messageData = {
      conversationId,
      sender: senderId,
      receiver: receiverId,
      type: "text",
      text,
    };

    // Handle file upload
    if (req.files && req.files.media) {
      const media = req.files.media;
      const fileExt = media.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
      const uploadPath = `./uploads/${fileName}`;

      await media.mv(uploadPath);

      messageData.mediaUrl = `/uploads/${fileName}`;
      
      // Determine type based on mimetype
      if (media.mimetype.startsWith("image/")) {
        messageData.type = "image";
      } else if (media.mimetype.startsWith("audio/")) {
        messageData.type = "audio";
      } else {
        messageData.type = "file";
      }
    }

    const message = new Message(messageData);
    await message.save();
    await message.populate("sender", "fullName profile.avatar role");

    res.json({ message, conversationId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/messages/offer
// @desc    Send a price offer or counter-offer
// @access  Private
exports.sendOffer = async (req, res) => {
  try {
    const { receiverId, crop, quantity, offerPrice, marketPrice, unit, note, type } = req.body;
    const senderId = req.user.id;

    const conversationId = Message.getConversationId(senderId, receiverId);

    // Create negotiation record
    const negotiation = new Negotiation({
      conversationId,
      initiator: senderId,
      receiver: receiverId,
      crop,
      quantity,
      offerPrice,
      marketPrice: marketPrice || 0,
      unit: unit || "৳/kg",
      note,
      type: type || "offer",
      status: "Pending",
    });

    await negotiation.save();

    // Create message linked to the negotiation
    const message = new Message({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      type: "negotiation",
      negotiationId: negotiation._id,
    });

    await message.save();
    await message.populate("sender", "fullName profile.avatar role");
    await message.populate("negotiationId");

    res.json({ message, negotiation, conversationId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PATCH /api/messages/offer/:negotiationId
// @desc    Accept or reject an offer
// @access  Private
exports.respondToOffer = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const { negotiationId } = req.params;

    const negotiation = await Negotiation.findById(negotiationId);
    if (!negotiation) {
      return res.status(404).json({ message: "Negotiation not found" });
    }

    negotiation.status = action === "accept" ? "Accepted" : "Rejected";
    await negotiation.save();

    // Create a status message
    const statusMsg = new Message({
      conversationId: negotiation.conversationId,
      sender: req.user.id,
      receiver: negotiation.initiator,
      type: "status",
      text:
        action === "accept"
          ? `🎉 Deal confirmed! Agreed on ${negotiation.offerPrice} ${negotiation.unit} for ${negotiation.quantity || ""} of ${negotiation.crop}.`
          : `Offer was declined. A counter-offer can be sent.`,
      negotiationId: negotiation._id,
    });

    await statusMsg.save();

    res.json({ negotiation, statusMessage: statusMsg });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};
