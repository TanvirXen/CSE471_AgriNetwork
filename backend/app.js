const express = require("express");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const marketRoutes = require("./routes/marketRoutes");
const messageRoutes = require("./routes/messageRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

const cropRoutes = require("./routes/cropRoutes");
const orderRoutes = require("./routes/orderRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const riderRoutes = require("./routes/riderRoutes");

const app = express();
const messageUploadMiddleware = fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
});

app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Base Route
app.get("/", (req, res) => {
  res.send("AgriNetwork API is running...");
});

// Health route for reverse proxy checks
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/messages", messageUploadMiddleware, messageRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", messageUploadMiddleware, deliveryRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));


module.exports = app;




