const mongoose = require("mongoose");
const FarmerListing = require("./models/FarmerListing");
require("dotenv").config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await FarmerListing.updateMany({}, {
            $set: { vendorId: new mongoose.Types.ObjectId("69e1d81b38bfa1b145b27de3") }
        });
        console.log(`Updated ${result.modifiedCount} products with vendorId.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
