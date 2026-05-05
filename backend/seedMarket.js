require("dotenv").config();
const mongoose = require("mongoose");
const MarketProduct = require("./models/MarketProduct");
const MarketStream = require("./models/MarketStream");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/AgriNetwork";

const STREAMS_DATA = [
    { 
        _id: "69d90867838e9609a1c45f28",
        title: "Fresh Hilsa Catch - LIVE", 
        host: "Padma Fisheries", 
        viewers: "850", 
        image: "https://dailyasianage.com/library/1692742982_9.jpg", 
        isLive: true,
        streamUrl: "https://www.youtube.com/embed/UhvaWogKQ1A",
        chatMessages: [
            { user: "Farmer_Rahim", text: "How much for a 10kg pack?" },
            { user: "Buyer_Karim", text: "Looks very fresh indeed." },
            { user: "Padma Fisheries", text: "We just caught these 10 minutes ago! Bidding starts securely!" },
            { user: "System Bid", text: "৳2,450 from User819" },
            { user: "FishLover", text: "Wow, the size is impressive." }
        ]
    },
    { 
        _id: "69d90867838e9609a1c45f2e",
        title: "Organic Mango Farm Tour", 
        host: "Rajshahi Farm", 
        viewers: "1.2k", 
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxEy62j9RltWBLFNI5zrsrsuwiJUrPhl_6Bw&s", 
        isLive: true,
        streamUrl: "https://www.youtube.com/embed/gr0wr4Q8u48",
        chatMessages: [
            { user: "FruitLover99", text: "Are these chemically treated?" },
            { user: "Rajshahi Farm", text: "No, 100% organic and natural! See for yourself!" },
            { user: "Buyer_Ali", text: "I'd like to order 50kg for my store." },
            { user: "System Bid", text: "৳4,500 bulk offer from LocalMart" }
        ]
    }
];

const PRODUCTS_DATA = [
    // FISH
    { name: "Ilish", category: "fish", segment: "seasonal", price: 1200, quality: "A", image: "https://dailyasianage.com/library/1692742982_9.jpg", isLive: true },
    { name: "Rui", category: "fish", segment: "organic", price: 400, quality: "A", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Rohu_at_Giant_Hypermarket_Kota_Damansara_20230203_105829.jpg", isLive: false },
    { name: "Pangas", category: "fish", segment: "bulk", price: 150, quality: "B", image: "https://www.banglakutir.com/app-contents/upload/1/products/1645348712_1_1_1120710182.jpeg", isLive: false },
    { name: "Boal", category: "fish", segment: "direct farm", price: 600, quality: "A", image: "https://thumbs.dreamstime.com/b/south-asian-boal-fish-wooden-background-36438042.jpg", isLive: false },

    // CROPS
    { name: "Nazirshail Rice", category: "crops", segment: "bulk", price: 80, quality: "A", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Deshi Mosur Dal", category: "crops", segment: "organic", price: 120, quality: "A", image: "https://lalchal.com/wp-content/uploads/2023/04/mosur-4-scaled.jpg", isLive: false },
    { name: "Potatoes", category: "crops", segment: "seasonal", price: 25, quality: "B", image: "https://healthyfamilyproject.com/wp-content/uploads/2020/05/Potatoes-background.jpg", isLive: false },
    { name: "Onion", category: "crops", segment: "direct farm", price: 60, quality: "A", image: "https://plantix.net/en/library/assets/custom/crop-images/onion.jpeg", isLive: false },

    // FRUITS
    { name: "Kathal", category: "fruits", segment: "seasonal", price: 150, quality: "A", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSH6wqFdseamKmmYYfAXgQHiz1AY5UcGiDyWw&s", isLive: false },
    { name: "Fajli Am", category: "fruits", segment: "direct farm", price: 90, quality: "A", image: "https://ashanursery.com/wp-content/uploads/2025/05/WhatsApp-Image-2025-05-20-at-9.59.19-AM.jpeg", isLive: true },
    { name: "Litchi", category: "fruits", segment: "bulk", price: 300, quality: "B", image: "https://ssorganiclitchi.in/wp-content/uploads/2025/05/Litchi-1-1.jpg", isLive: false },
    { name: "Peyara", category: "fruits", segment: "organic", price: 80, quality: "A", image: "https://m.media-amazon.com/images/I/31MzWSj0bML._AC_UF1000,1000_QL80_.jpg", isLive: false },

    // LIVESTOCK
    { name: "Deshi Murgi", category: "livestock", segment: "direct farm", price: 450, quality: "A", image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=500", isLive: false },
    { name: "Cow", category: "livestock", segment: "bulk", price: 85000, quality: "A", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTU2CWWGLfKWcRtx5PDEGm_RcWOnpxG7HoRKA&s", isLive: true },
    { name: "Goat", category: "livestock", segment: "organic", price: 15000, quality: "B", image: "https://pranikhamar.in/wp-content/uploads/2020/09/black.jpg", isLive: false },
    { name: "Duck", category: "livestock", segment: "seasonal", price: 500, quality: "A", image: "https://nutrenaworld.com/wp-content/uploads/2024/01/poultry_blog_why-keep-ducks_820x525.jpg", isLive: false }
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
