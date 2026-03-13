const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const marketRoutes = require("./routes/marketRoutes");

const app = express();
const path = require("path");

app.use(cors());
app.use(express.json());

// Serve uploads as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Base Route
app.get("/", (req, res) => {
  res.send("AgriNetwork API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/market", marketRoutes);


module.exports = app;
