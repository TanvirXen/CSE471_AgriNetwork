const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { buildCorsOriginHandler } = require("./utils/frontendOrigins");

const PORT = process.env.PORT || 5000;
const DEFAULT_DB_NAME = "AgriNetwork";

const ensureDatabaseName = (mongoUri) => {
  if (!mongoUri) return mongoUri;

  try {
    const parsedUri = new URL(mongoUri);

    if (!parsedUri.pathname || parsedUri.pathname === "/") {
      parsedUri.pathname = `/${DEFAULT_DB_NAME}`;
      return parsedUri.toString();
    }
  } catch (_err) {
    // Keep the original URI so mongoose can surface any real connection error.
  }

  return mongoUri;
};

const MONGO_URI = ensureDatabaseName(process.env.MONGO_URI);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: buildCorsOriginHandler(),
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on("join_call_room", (data = {}, ack) => {
    if (!data?.roomId) {
      if (typeof ack === "function") {
        ack({ ok: false, message: "roomId is required" });
      }
      return;
    }

    socket.join(data.roomId);
    const participantCount = io.sockets.adapter.rooms.get(data.roomId)?.size || 0;

    socket.to(data.roomId).emit("video_call_participant_joined", {
      roomId: data.roomId,
      userId: data.userId,
      participantCount,
    });

    if (typeof ack === "function") {
      ack({ ok: true, participantCount });
    }
  });

  socket.on("leave_call_room", (data = {}) => {
    if (!data?.roomId) return;
    socket.leave(data.roomId);
  });

  socket.on("send_message", (data) => {
    // Emit to the conversation room
    io.to(data.conversationId).emit("receive_message", data);
    
    // Also emit to the recipient's personal room for sidebar updates/notifications
    if (data.receiverId) {
      io.to(data.receiverId).emit("new_notification", data);
    }
  });

  socket.on("accept_offer", (data) => {
    io.to(data.conversationId).emit("offer_accepted", data);
  });

  socket.on("reject_offer", (data) => {
    io.to(data.conversationId).emit("offer_rejected", data);
  });

  socket.on("video_call_invite", (data) => {
    if (data?.targetUserId) {
      io.to(data.targetUserId).emit("video_call_invite", data);
    }
  });

  socket.on("video_call_offer", (data) => {
    if (data?.roomId) {
      socket.to(data.roomId).emit("video_call_offer", data);
    }
  });

  socket.on("video_call_answered", (data) => {
    if (data?.targetUserId) {
      io.to(data.targetUserId).emit("video_call_answered", data);
    }
  });

  socket.on("video_call_answer", (data) => {
    if (data?.roomId) {
      socket.to(data.roomId).emit("video_call_answer", data);
    }
  });

  socket.on("video_call_declined", (data) => {
    if (data?.targetUserId) {
      io.to(data.targetUserId).emit("video_call_declined", data);
    }
  });

  socket.on("video_call_ice_candidate", (data) => {
    if (data?.roomId) {
      socket.to(data.roomId).emit("video_call_ice_candidate", data);
    } else if (data?.targetUserId) {
      io.to(data.targetUserId).emit("video_call_ice_candidate", data);
    }
  });

  socket.on("video_call_ended", (data) => {
    if (data?.roomId) {
      socket.to(data.roomId).emit("video_call_ended", data);
    } else if (data?.targetUserId) {
      io.to(data.targetUserId).emit("video_call_ended", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

console.log("Attempting to connect to MongoDB...");
if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing from backend/.env");
}

const obfuscatedUri = MONGO_URI.replace(/:([^:@]{1,})@/, ":****@");
console.log(`Connection String: ${obfuscatedUri}`);

mongoose
  .connect(MONGO_URI, {
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    }
  })
  .then(() => {
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    if (err.message.includes("querySrv") || err.message.includes("ECONNREFUSED")) {
      console.error("\n🚨 THIS IS A SRV DNS ISSUE 🚨");
      console.error("Your internet/DNS cannot resolve '+srv' strings.");
      console.error("FIX: Go to MongoDB Atlas -> Connect -> Drivers -> Node.js -> SELECT VERSION '2.2.12 or later'");
      console.error("Then copy the string starting with 'mongodb://' and paste it in your .env\n");
    }
  });
