const mongoose = require("mongoose");
const User = require("./models/User");
const Order = require("./models/Order");
const Review = require("./models/Review");
const FarmerListing = require("./models/FarmerListing");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/AgriNetwork";

mongoose.connect(MONGO_URI).then(async () => {
    try {
        console.log("---- REVIEWS ----");
        const reviews = await Review.find({});
        console.log(`Total Reviews: ${reviews.length}`);
        
        let targetVendorId = null;
        if (reviews.length > 0) {
            targetVendorId = reviews[reviews.length - 1].vendorId;
            console.log("Latest review vendorId:", targetVendorId);
            console.log("Latest review rating obj:", reviews[reviews.length - 1].rating);
        }

        console.log("\n---- VENDOR ----");
        if (targetVendorId) {
            const vendor = await User.findById(targetVendorId);
            if (vendor) {
                console.log(`Vendor Name: ${vendor.fullName}`);
                console.log(`Vendor Profile Rating: ${vendor.profile?.averageRating}`);
                console.log(`Vendor Profile TrustScore: ${vendor.profile?.trustScore}`);
                console.log(`Vendor Profile TotalReviews: ${vendor.profile?.totalReviews}`);
            } else {
                console.log("Vendor not found in User collection!");
            }
        }
        
        console.log("\n---- CROPS (FarmerListings) ----");
        const crops = await FarmerListing.find({ sellerId: targetVendorId });
        console.log(`Crops belonging to this vendor: ${crops.length}`);
        if(crops.length > 0) {
            console.log("Sample Crop Name:", crops[0].productName);
            console.log("Crop sellerId:", crops[0].sellerId);
            console.log("Crop vendorId:", crops[0].vendorId);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
