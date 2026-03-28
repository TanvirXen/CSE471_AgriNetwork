const express = require("express");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const marketRoutes = require("./routes/marketRoutes");
const messageRoutes = require("./routes/messageRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");

const cropRoutes = require("./routes/cropRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
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
app.use("/api/messages", messageRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);

module.exports = app;




