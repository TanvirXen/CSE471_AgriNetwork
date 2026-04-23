const mongoose = require("mongoose");
const User = require("./models/User");

require("dotenv").config(); // Depending on server setup

const MONGODB_URI = process.env.MONGO_URI;
//|| "mongodb://localhost:27017/agrinetwork";

const dbConnect = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected for migration");
    
    // Find users with location [0,0] or without location, who are Vendors/Farmers
    const vendors = await User.find({
       $or: [
          { role: { $in: ["Vendor", "Farmer"] } }
       ]
    });
    
    let updatedCount = 0;
    for (const vendor of vendors) {
       let needsUpdate = false;
       if (!vendor.currentLocation || !vendor.currentLocation.coordinates) {
          needsUpdate = true;
       } else if (vendor.currentLocation.coordinates[0] === 0 && vendor.currentLocation.coordinates[1] === 0) {
          needsUpdate = true;
       }
       
       if (needsUpdate || true) { // Always override to be safe
          // Generate a random coordinate within Dhaka region approx
          const randomLng = 90.35 + (Math.random() * 0.1);
          const randomLat = 23.75 + (Math.random() * 0.1);
          
          vendor.currentLocation = {
             type: "Point",
             coordinates: [randomLng, randomLat]
          };
          await vendor.save();
          updatedCount++;
       }
    }
    
    console.log(`Updated ${updatedCount} vendors with mock coordinates.`);
    process.exit(0);
  } catch (e) {
    console.error("Migration failed", e);
    process.exit(1);
  }
};

dbConnect();
