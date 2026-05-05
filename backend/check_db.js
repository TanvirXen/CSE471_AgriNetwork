const mongoose = require('mongoose');
const FarmerListing = require('./models/FarmerListing');
mongoose.connect('mongodb://localhost:27017/AgriNetwork', { useNewUrlParser: true, useUnifiedTopology: true }).then(async () => {
    const crops = await FarmerListing.find({}, 'productName averageRating totalReviews trustScore');
    console.log("Crops DB State:");
    crops.forEach(c => console.log(`${c.productName}: Rating ${c.averageRating}, Trust ${c.trustScore}, Reviews ${c.totalReviews}`));
    process.exit(0);
});
