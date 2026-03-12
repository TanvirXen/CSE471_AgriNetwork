require("dotenv").config();
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agrinetwork";

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

  socket.on("send_message", (data) => {
    io.to(data.conversationId).emit("receive_message", data);
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
    if (err.message.includes("querySrv ECONNREFUSED")) {
      console.error("💡 TIP: This remains a DNS issue. Your computer cannot resolve the SRV record.");
      console.error("   Try switching your DNS to 8.8.8.8 OR use the 'Standard Connection String' (mongodb://) from Atlas.");
    }
  });
