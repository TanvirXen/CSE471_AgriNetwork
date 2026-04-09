require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/AgriTest";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
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

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

console.log("Attempting to connect to MongoDB...");
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
