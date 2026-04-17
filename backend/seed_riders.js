const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Rider = require("./models/Rider");

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/AgriTest", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected for Seeding Riders"))
  .catch((err) => console.log(err));

const ridersData = [
  // Dhaka Area
  { name: "Rahim Ali", phone: "01711111111", vehicleType: "Bike", location: { type: "Point", coordinates: [90.4125, 23.8103] }, status: "Available" },
  { name: "Rafiq Miah", phone: "01711111112", vehicleType: "Van", location: { type: "Point", coordinates: [90.4200, 23.8200] }, status: "Available" },
  { name: "Karim Uddin", phone: "01711111113", vehicleType: "Truck", location: { type: "Point", coordinates: [90.3900, 23.8000] }, status: "Available" },
  { name: "Abdur Rahman", phone: "01711111114", vehicleType: "Truck", location: { type: "Point", coordinates: [90.3800, 23.7500] }, status: "Available" },
  { name: "Noman Siddique", phone: "01711111115", vehicleType: "Bike", location: { type: "Point", coordinates: [90.4400, 23.7900] }, status: "Available" },
  { name: "Rakib Hossain", phone: "01711111116", vehicleType: "Van", location: { type: "Point", coordinates: [90.3700, 23.8300] }, status: "Available" },

  // Chattogram Area
  { name: "Jamal Hasan", phone: "01811111111", vehicleType: "Truck", location: { type: "Point", coordinates: [91.8317, 22.3569] }, status: "Available" },
  { name: "Bashir Khan", phone: "01811111112", vehicleType: "Bike", location: { type: "Point", coordinates: [91.8200, 22.3600] }, status: "Available" },
  { name: "Nurul Amin", phone: "01811111113", vehicleType: "Truck", location: { type: "Point", coordinates: [91.8400, 22.3300] }, status: "Available" },
  { name: "Arifur Rahman", phone: "01811111114", vehicleType: "Van", location: { type: "Point", coordinates: [91.8100, 22.3800] }, status: "Available" },

  // Bogra Area
  { name: "Habib Molla", phone: "01911111111", vehicleType: "Van", location: { type: "Point", coordinates: [89.3789, 24.8481] }, status: "Available" },
  { name: "Mizanur Rahman", phone: "01911111112", vehicleType: "Bike", location: { type: "Point", coordinates: [89.3600, 24.8300] }, status: "Available" },
  { name: "Sohel Rana", phone: "01911111113", vehicleType: "Truck", location: { type: "Point", coordinates: [89.3900, 24.8600] }, status: "Available" },

  // Rajshahi Area
  { name: "Mominul Islam", phone: "01511111111", vehicleType: "Bike", location: { type: "Point", coordinates: [88.6011, 24.3636] }, status: "Available" },
  { name: "Sujon Ali", phone: "01511111112", vehicleType: "Van", location: { type: "Point", coordinates: [88.5800, 24.3500] }, status: "Available" },
  { name: "Taposh Kumar", phone: "01511111113", vehicleType: "Truck", location: { type: "Point", coordinates: [88.6200, 24.3800] }, status: "Available" },

  // Khulna Area
  { name: "Shakil Ahmed", phone: "01611111111", vehicleType: "Truck", location: { type: "Point", coordinates: [89.5403, 22.8456] }, status: "Available" },
  { name: "Imran Hossen", phone: "01611111112", vehicleType: "Bike", location: { type: "Point", coordinates: [89.5200, 22.8300] }, status: "Available" },
  { name: "Liton Das", phone: "01611111113", vehicleType: "Truck", location: { type: "Point", coordinates: [89.5600, 22.8600] }, status: "Available" },

  // Sylhet Area
  { name: "Faysal Mahmud", phone: "01311111111", vehicleType: "Van", location: { type: "Point", coordinates: [91.8687, 24.8949] }, status: "Available" },
  { name: "Tareq Zia", phone: "01311111112", vehicleType: "Bike", location: { type: "Point", coordinates: [91.8500, 24.8800] }, status: "Available" },
  { name: "Sabbir Hossain", phone: "01311111113", vehicleType: "Truck", location: { type: "Point", coordinates: [91.8800, 24.9100] }, status: "Available" },

  // Barisal Area
  { name: "Kamrul Hasan", phone: "01411111111", vehicleType: "Bike", location: { type: "Point", coordinates: [90.3547, 22.7010] }, status: "Available" },
  { name: "Zahirul Islam", phone: "01411111112", vehicleType: "Van", location: { type: "Point", coordinates: [90.3400, 22.6800] }, status: "Available" },
  { name: "Ruhul Amin", phone: "01411111113", vehicleType: "Truck", location: { type: "Point", coordinates: [90.3700, 22.7200] }, status: "Available" },
  
  // Rangpur Area
  { name: "Asaduzzaman Mia", phone: "01722222221", vehicleType: "Truck", location: { type: "Point", coordinates: [89.2500, 25.7500] }, status: "Available" },
  { name: "Faruk Hossain", phone: "01722222222", vehicleType: "Bike", location: { type: "Point", coordinates: [89.2300, 25.7300] }, status: "Available" },
  
  // Cumilla Area
  { name: "Shohag Kazi", phone: "01822222221", vehicleType: "Truck", location: { type: "Point", coordinates: [91.1800, 23.4600] }, status: "Available" },
  { name: "Belal Ahmed", phone: "01822222222", vehicleType: "Van", location: { type: "Point", coordinates: [91.1600, 23.4400] }, status: "Available" },
];

const seedRiders = async () => {
  try {
    await Rider.deleteMany();
    await Rider.insertMany(ridersData);
    console.log("Dummy riders inserted successfully!");
    process.exit();
  } catch (error) {
    console.error("Error with seeding data:", error);
    process.exit(1);
  }
};

seedRiders();
