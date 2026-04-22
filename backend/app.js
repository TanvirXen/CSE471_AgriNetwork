const express        = require("express");
const cors           = require("cors");
const path           = require("path");
const fileUpload     = require("express-fileupload");

const authRoutes      = require("./routes/authRoutes");
const userRoutes      = require("./routes/userRoutes");
const messageRoutes   = require("./routes/messageRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const escrowRoutes    = require("./routes/escrowRoutes");
const marketRoutes    = require("./routes/marketRoutes");
const paymentRoutes   = require("./routes/paymentRoutes");
const orderRoutes     = require("./routes/orderRoutes");
const deliveryRoutes  = require("./routes/deliveryRoutes");
const reviewRoutes    = require("./routes/reviewRoutes");
const adminRoutes     = require("./routes/adminRoutes");
const listingRoutes   = require("./routes/listingRoutes");
const buyRequestRoutes = require("./routes/buyRequestRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Base route
app.get("/", (req, res) => res.send("AgriNetwork API is running..."));

// ── Primary routes ──
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/messages",  messageRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/escrow",    escrowRoutes);
app.use("/api/market",    marketRoutes);
app.use("/api/payments",  paymentRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/reviews",   reviewRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/listings",  listingRoutes);
app.use("/api/buy-requests", buyRequestRoutes);

// ── URL alias fixes (frontend legacy calls) ──
// Frontend SmartAgroMarket.jsx calls /api/market-insights → forward to /api/market/insights
app.get("/api/market-insights", (req, res, next) => {
  req.url = "/insights";
  marketRoutes(req, res, next);
});

// Frontend SmartAgroMarket.jsx calls /api/crop-plan/analyze → forward to /api/market/crop-plans/analyze
app.post("/api/crop-plan/analyze", (req, res, next) => {
  req.url = "/crop-plans/analyze";
  marketRoutes(req, res, next);
});

module.exports = app;
