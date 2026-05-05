const mongoose = require('mongoose');
const User = require('./models/User');
const Review = require('./models/Review');
mongoose.connect('mongodb://localhost:27017/AgriNetwork', { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
    console.log("Connected to DB.");
    const reviews = await Review.find().lean();
    console.log("REVIEWS:", JSON.stringify(reviews, null, 2));
    
    if (reviews.length > 0) {
        const vendor = await User.findById(reviews[0].vendorId).lean();
        console.log("VENDOR FOR REVIEW 0:", vendor ? JSON.stringify(vendor.profile, null, 2) : "NOT FOUND");
    }

    const listing = await mongoose.model('FarmerListing', new mongoose.Schema({}, {strict: false}), 'CropMarketplace').findOne().lean();
    console.log("SAMPLE LISTING SELLER ID:", listing ? listing.sellerId : "N/A");
    if (listing && listing.sellerId) {
        const vendor2 = await User.findById(listing.sellerId).lean();
        console.log("SELLER PROFILE:", vendor2 ? JSON.stringify(vendor2.profile, null, 2) : "NOT FOUND");
    }

    process.exit(0);
});
