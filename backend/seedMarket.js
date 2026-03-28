require("dotenv").config();
const mongoose = require("mongoose");
const MarketProduct = require("./models/MarketProduct");
const MarketStream = require("./models/MarketStream");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/agrinetwork";

const STREAMS_DATA = [
    { title: "Fresh Hilsha Catch - LIVE", host: "Padma Fisheries", viewers: "850", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600", isActive: true },
    { title: "Organic Mango Farm Tour", host: "Rajshahi Farm", viewers: "1.2k", image: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=600", isActive: true }
];

const PRODUCTS_DATA = [
    // FISH
    { name: "Premium Hilsha Fish", category: "fish", segment: "direct farm", price: 1560, quality: "A", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=500", isLive: true },
    { name: "Giant Tiger Prawn", category: "fish", segment: "bulk", price: 1250, quality: "A", image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Native Rui Fish", category: "fish", segment: "seasonal", price: 450, quality: "B", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Rohu_at_Giant_Hypermarket_Kota_Damansara_20230203_105829.jpg", isLive: false },
    { name: "Organic Vetki", category: "fish", segment: "organic", price: 950, quality: "A", image: "https://www.bbassets.com/media/uploads/p/xl/40055148-2_1-fresho-bhetki-fish-fry-cut.jpg", isLive: false },

    // CROPS
    { name: "Premium Basmati Rice", category: "crops", segment: "organic", price: 185, quality: "A", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Ripe Rajshahi Mango", category: "crops", segment: "seasonal", price: 220, quality: "A", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=500", isLive: true },
    { name: "Raw Golden Jute", category: "crops", segment: "bulk", price: 3200, quality: "B", image: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Fresh Cauliflower", category: "crops", segment: "direct farm", price: 45, quality: "A", image: "https://snaped.fns.usda.gov/sites/default/files/styles/crop_ratio_7_5/public/seasonal-produce/2018-05/cauliflower.jpg.webp?h=c8b8df1c&itok=bkbqZWhp", isLive: false },

    // POULTRY
    { name: "Free Range Desi Chicken", category: "poultry", segment: "organic", price: 620, quality: "A", image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Farm Fresh Layer Eggs", category: "poultry", segment: "bulk", price: 155, quality: "A", image: "https://riversfamilyfarm.com/wp-content/uploads/2023/12/how-and-when-to-clean-farm-fresh-eggs-feature.jpg", isLive: false },
    { name: "Native Duck", category: "poultry", segment: "direct farm", price: 890, quality: "A", image: "https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Quail Eggs", category: "poultry", segment: "seasonal", price: 400, quality: "A", image: "https://forgetmenotquailfarm.com/wp-content/uploads/2024/10/how-to-collect-and-store-quail-eggs3.jpg", isLive: false },

    // LIVESTOCK
    { name: "Black Bengal Goat", category: "livestock", segment: "organic", price: 18500, quality: "A", image: "https://pranikhamar.in/wp-content/uploads/2020/09/black.jpg", isLive: false },
    { name: "Holstein Friesian Cow", category: "livestock", segment: "bulk", price: 175000, quality: "A", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU2CWWGLfKWcRtx5PDEGm_RcWOnpxG7HoRKA&s", isLive: true },
    { name: "Native Buffalo Calf", category: "livestock", segment: "direct farm", price: 52000, quality: "B", image: "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Lamb Sheep", category: "livestock", segment: "seasonal", price: 12000, quality: "B", image: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=500", isLive: false }
];

const seedDatabase = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        const obfuscatedUri = MONGO_URI.replace(/:([^:@]{1,})@/, ":****@");
        console.log(`Connection String: ${obfuscatedUri}`);

        await mongoose.connect(MONGO_URI, {
            serverApi: {
              version: '1',
              strict: true,
              deprecationErrors: true,
            }
        });
        console.log("✅ Successfully connected to MongoDB!");

        console.log("Clearing existing data...");
        await MarketProduct.deleteMany({});
        await MarketStream.deleteMany({});

        console.log("Seeding MarketStreams...");
        await MarketStream.insertMany(STREAMS_DATA);

        console.log("Seeding MarketProducts...");
        await MarketProduct.insertMany(PRODUCTS_DATA);

        console.log("✅ Database seeded successfully!");
    } catch (error) {
        console.error("❌ Seeding error:", error);
    } finally {
        mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
};

seedDatabase();
