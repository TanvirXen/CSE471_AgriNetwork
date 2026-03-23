const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cropPlanRoutes = require("./routes/cropPlanRoutes");
const marketInsightRoutes = require("./routes/marketInsightRoutes");
const escrowRoutes = require("./routes/escrowRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Base Route
app.get("/", (req, res) => {
  res.send("AgriNetwork API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Chaman Module 3 - Smart AgroMarket + Escrow
app.use("/api/crop-plan", cropPlanRoutes);
app.use("/api/market-insights", marketInsightRoutes);
app.use("/api/escrow", escrowRoutes);

module.exports = app;

