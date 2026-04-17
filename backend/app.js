const express = require("express");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const marketRoutes = require("./routes/marketRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Base Route
app.get("/", (req, res) => {
  res.send("AgriNetwork API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/market", marketRoutes);

module.exports = app;

