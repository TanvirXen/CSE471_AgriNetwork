const mongoose = require("mongoose");
const FarmerListing = require("./models/FarmerListing");

require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;
const dummyCrops = [
    {
        sellerId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        title: "Premium BRRI Dhan 28",
        categoryType: "Crop",
        productName: "Rice",
        variety: "BRRI Dhan 28",
        grade: "Premium",
        moisturePercentage: 11,
        sackType: "Jute (50kg)",
        diseaseNotes: "None, healthy crop.",
        qualityNotes: "Machine sorted, double polished.",
        quantity: 5000,
        quantityUnit: "kg",
        pricing: {
            mode: "Fixed",
            unit: "kg",
            unitPrice: 65,
            bulkPricingTiers: [
                { minQty: 1000, pricePerUnit: 60 },
                { minQty: 3000, pricePerUnit: 58 }
            ]
        },
        visibility: "Boosted",
        region: "Dinajpur",
        district: "Dinajpur",
        status: "Active",
        availabilitySchedule: [{ date: new Date("2026-05-15") }],
        media: [{ type: "image", url: "https://res.cloudinary.com/dzda0aqfd/image/upload/v1775738030/images-2_hhoqit.jpg" }]
    },
    {
        sellerId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        title: "Kataribhog Rice A Grade",
        categoryType: "Crop",
        productName: "Rice",
        variety: "Kataribhog",
        grade: "A",
        moisturePercentage: 13,
        sackType: "Plastic (25kg)",
        diseaseNotes: "Minor stem borer observed early season.",
        qualityNotes: "Aromatic, naturally aged.",
        quantity: 2000,
        quantityUnit: "kg",
        pricing: {
            mode: "Fixed",
            unit: "kg",
            unitPrice: 90,
            bulkPricingTiers: [
                { minQty: 500, pricePerUnit: 85 }
            ]
        },
        visibility: "Public",
        region: "Rangpur",
        district: "Rangpur",
        status: "Active",
        availabilitySchedule: [{ date: new Date("2026-06-10") }],
        media: [{ type: "image", url: "https://res.cloudinary.com/dzda0aqfd/image/upload/v1775738037/HWs8eE214R3BeLFvCE9zkxKBiaTSk98jPlBwwmj5_nc7dx0.png" }]
    },
    {
        sellerId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        title: "Tosha Jute Premium Bales",
        categoryType: "Crop",
        productName: "Jute",
        variety: "Tosha Jute",
        grade: "Premium",
        moisturePercentage: 9,
        sackType: "Bales (180kg)",
        diseaseNotes: "Disease free.",
        qualityNotes: "Golden color, long fibers.",
        quantity: 5400,
        quantityUnit: "kg",
        pricing: {
            mode: "Fixed",
            unit: "kg",
            unitPrice: 50,
            bulkPricingTiers: [
                { minQty: 1800, pricePerUnit: 48 }
            ]
        },
        visibility: "Boosted",
        region: "Faridpur",
        district: "Faridpur",
        status: "Active",
        availabilitySchedule: [{ date: new Date("2026-07-20") }],
        media: [{ type: "image", url: "https://res.cloudinary.com/dzda0aqfd/image/upload/v1775738031/IMG_2995_1024x1024.jpg_ogmipc.webp" }]
    },
    {
        sellerId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
        title: "BARI Gom 26 Wheat",
        categoryType: "Crop",
        productName: "Wheat",
        variety: "BARI Gom 26",
        grade: "B",
        moisturePercentage: 15,
        sackType: "Woven Sack (50kg)",
        diseaseNotes: "Slight rust spotted.",
        qualityNotes: "Good for general milling.",
        quantity: 10000,
        quantityUnit: "kg",
        pricing: {
            mode: "Fixed",
            unit: "kg",
            unitPrice: 35,
            bulkPricingTiers: [
                { minQty: 2000, pricePerUnit: 33 },
                { minQty: 5000, pricePerUnit: 30 }
            ]
        },
        visibility: "Public",
        region: "Rajshahi",
        district: "Rajshahi",
        status: "Active",
        availabilitySchedule: [{ date: new Date("2026-04-25") }],
        media: [{ type: "image", url: "https://res.cloudinary.com/dzda0aqfd/image/upload/v1775738031/Wheet-Seed-3_a56o6r.jpg" }]
    }
];

async function insertDummyData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB:", MONGO_URI);
        
        await FarmerListing.deleteMany({});
        console.log("Cleared existing crops.");
        
        await FarmerListing.insertMany(dummyCrops);
        console.log("Dummy crops inserted successfully.");
        
        process.exit(0);
    } catch (err) {
        console.error("Error inserting data:", err);
        process.exit(1);
    }
}

insertDummyData();
