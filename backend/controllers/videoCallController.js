const VideoCallSession = require("../models/VideoCallSession");
const Message = require("../models/Message");
const User = require("../models/User");

const buildRoomId = () =>
  `call_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const serializeCall = async (call) => {
  await call.populate("createdBy", "fullName profile.avatar role");
  await call.populate("participants.userId", "fullName profile.avatar role");

  return {
    id: call._id,
    roomId: call.roomId,
    conversationId: call.conversationId,
    purpose: call.purpose,
    provider: call.provider,
    callStatus: call.callStatus,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    createdBy: call.createdBy,
    participants: call.participants.map((participant) => ({
      userId: participant.userId,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
    })),
  };
};

exports.startCall = async (req, res) => {
  try {
    const callerId = req.user.id;
    const { receiverId, conversationId, purpose } = req.body || {};

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required." });
    }

    const receiver = await User.findById(receiverId).select("_id fullName profile.avatar role");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    const resolvedConversationId =
      conversationId || Message.getConversationId(callerId, receiverId);

    const call = await VideoCallSession.create({
      createdBy: callerId,
      participants: [
        { userId: callerId, joinedAt: new Date() },
        { userId: receiverId },
      ],
      conversationId: resolvedConversationId,
      provider: "WebRTC",
      roomId: buildRoomId(),
      purpose: purpose || "Negotiation",
      startedAt: new Date(),
      callStatus: "Ongoing",
    });

    return res.status(201).json({
      call: await serializeCall(call),
    });
  } catch (err) {
    console.error("Start video call error:", err.message);
    return res.status(500).json({ message: "Failed to start video call." });
  }
};

exports.answerCall = async (req, res) => {
  try {
    const call = await VideoCallSession.findById(req.params.callId);
    if (!call) {
      return res.status(404).json({ message: "Call session not found." });
    }

    const participant = call.participants.find(
      (item) => item.userId.toString() === req.user.id
    );

    if (!participant) {
      return res.status(403).json({ message: "You are not a participant in this call." });
    }

    if (!participant.joinedAt) {
      participant.joinedAt = new Date();
    }

    call.callStatus = "Ongoing";
    if (!call.startedAt) {
      call.startedAt = new Date();
    }

    await call.save();

    return res.json({
      call: await serializeCall(call),
    });
  } catch (err) {
    console.error("Answer video call error:", err.message);
    return res.status(500).json({ message: "Failed to answer video call." });
  }
};

exports.endCall = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const call = await VideoCallSession.findById(req.params.callId);

    if (!call) {
      return res.status(404).json({ message: "Call session not found." });
    }

    const participant = call.participants.find(
      (item) => item.userId.toString() === req.user.id
    );

    if (!participant) {
      return res.status(403).json({ message: "You are not a participant in this call." });
    }

    participant.leftAt = new Date();
    call.endedAt = new Date();

    if (reason === "declined") {
      call.callStatus = "Cancelled";
    } else if (reason === "missed") {
      call.callStatus = "Missed";
    } else {
      call.callStatus = "Completed";
    }

    await call.save();

    return res.json({
      call: await serializeCall(call),
    });
  } catch (err) {
    console.error("End video call error:", err.message);
    return res.status(500).json({ message: "Failed to end video call." });
  }
};
