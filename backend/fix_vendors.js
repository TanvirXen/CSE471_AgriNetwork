const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config({ path: __dirname + '/.env' }); // Make sure it reads the correct .env

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/AgriNetwork", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected for Fixing Vendors"))
  .catch((err) => console.log(err));

const fixVendors = async () => {
  try {
    const vendors = await User.find({ role: { $in: ["Vendor", "Farmer", "Wholesaler"] } });
    
    let count = 0;
    for (let vendor of vendors) {
      // If coordinates are missing or [0,0]
      if (!vendor.currentLocation || !vendor.currentLocation.coordinates || (vendor.currentLocation.coordinates[0] === 0 && vendor.currentLocation.coordinates[1] === 0)) {
        
        // Random location near Dhaka
        const lat = 23.8103 + (Math.random() - 0.5) * 0.1;
        const lng = 90.4125 + (Math.random() - 0.5) * 0.1;

        vendor.currentLocation = {
          type: "Point",
          coordinates: [lng, lat]
        };
        
        // Ensure they have at least one address
        if (!vendor.addresses || vendor.addresses.length === 0) {
           vendor.addresses = [{
             label: "Farm",
             contactName: vendor.fullName,
             phone: vendor.phone,
             district: "Dhaka",
             fullAddress: "AgriNetwork Default Farm, Dhaka",
             coordinates: {
               type: "Point",
               coordinates: [lng, lat]
             },
             isDefault: true
           }];
        }

        await vendor.save();
        count++;
      }
    }
    
    console.log(`Successfully assigned coordinates to ${count} vendors.`);
    process.exit(0);
  } catch (error) {
    console.error("Error with fixing vendor data:", error);
    process.exit(1);
  }
};

fixVendors();
