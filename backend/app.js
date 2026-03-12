const express = require("express");
const userController = require("./controllers/userController");
const listingController = require("./controllers/listingController");
const orderController = require("./controllers/orderController");

const app = express();
app.use(express.json());

app.get("/api/users", userController.getUsers);
app.post("/api/users", userController.createUser);

app.get("/api/listings", listingController.getListings);
app.post("/api/listings", listingController.createListing);

app.get("/api/orders", orderController.getOrders);
app.post("/api/orders", orderController.createOrder);

module.exports = app;
