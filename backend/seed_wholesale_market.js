const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const FarmerListing = require("./models/FarmerListing");
const User = require("./models/User");
const Category = require("./models/Category");

mongoose.connect("mongodb+srv://tanvirishtiaq5:ahVBHv1yDNWMbW3v@cluster0.e2bw5nd.mongodb.net/AgriNetwork?appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function runSeed() {
  try {
    console.log("Locating baseline data...");
    
    let seller = await User.findOne({ role: "Farmer" });
    if (!seller) {
      console.log("No Farmer user found, creating dummy verified supplier...");
      seller = await User.create({
        name: "Rahim Chowdhury",
        email: "rahim" + Date.now() + "@farms.com",
        phone: "01788" + Math.floor(100000 + Math.random() * 900000),
        role: "Farmer",
        passwordHash: "dummyhash123",
        isVerified: true,
        address: {
            division: "Rajshahi",
            district: "Naogaon",
            fullAddress: "Village 123, Naogaon",
            contactName: "Rahim Chowdhury",
            phone: "01788112233"
        }
      });
    }

    let category = await Category.findOne({ categoryType: "Crop" });
    if (!category) {
      console.log("No Crop category found, creating default...");
      category = await Category.create({
        name: "Rice & Grains",
        slug: "rice-and-grains",
        categoryType: "Crop",
        isActive: true
      });
    }

    console.log("Clearing old dummy listings to prevent duplicates...");
    await FarmerListing.deleteMany({});
    
    console.log("Injecting Wholesale Listings...");

    const dummyListings = [
      {
        sellerId: seller._id,
        categoryId: category._id,
        categoryType: "Crop",
        productName: "Kataribhog Rice",
        quantity: 500,
        title: "Kataribhog Premium Rice (Bulk Sacks)",
        description: "Freshly harvested premium Kataribhog rice sourced directly from the Naogaon region. Known for its distinct aroma and fine grains, this rice is perfectly suited for bulk restaurant supply and premium wholesale packaging. Undergoes rigorous 3-stage sorting and cleaning processes ensuring zero stone contamination and optimal moisture control.",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=800",
        pricing: {
            mode: "Fixed",
            unit: "sacks",
            unitPrice: 2800,
            minimumOrderQty: 10,
            bulkPricingTiers: [{ minQty: 50, pricePerUnit: 2650 }]
        },
        moisture: "12%",
        grade: "Premium",
        region: "Naogaon",
        variety: "Kataribhog",
        sackType: "Jute (50kg)",
        qualityNotes: "Sorted electronically. Max 2% broken grains. No dust or foreign particles.",
        diseaseNotes: "Zero disease history. Stored in climate-controlled warehouses.",
        isSpotlight: true,
        status: "Active"
      },
      {
        sellerId: seller._id,
        categoryId: category._id,
        categoryType: "Crop",
        productName: "Parboiled Rice",
        quantity: 200,
        title: "BRRI Dhan 28 Parboiled Rice",
        description: "High-yield BRRI Dhan 28 parboiled rice, a staple dietary grain known for its robust texture and excellent shelf-life. Ideal for heavy-duty catering services and industrial meal programs. Sourced from fertile Rajshahi lands, dried under optimal conditions yielding a perfect 13% moisture level for long-term storage.",
        image: "https://images.unsplash.com/photo-1536998007255-66735e2978aa?auto=format&fit=crop&q=80&w=800",
        pricing: {
            mode: "Fixed",
            unit: "tons",
            unitPrice: 42000,
            minimumOrderQty: 2,
            bulkPricingTiers: [{ minQty: 10, pricePerUnit: 40500 }]
        },
        moisture: "13%",
        grade: "A",
        region: "Rajshahi",
        variety: "BRRI Dhan 28",
        sackType: "Plastic (25kg)",
        qualityNotes: "Standard grade. Parboiled efficiently. Up to 5% broken grain allowance.",
        diseaseNotes: "Treated. Safe from post-harvest fungus.",
        status: "Active"
      },
      {
        sellerId: seller._id,
        categoryId: category._id,
        categoryType: "Crop",
        productName: "Raw Jute",
        quantity: 5000,
        title: "Organic Tosha Jute (Raw Bales)",
        description: "Premium golden Tosha Jute extracted post-monsoon, providing unmatched fiber strength and luster. Perfect for industrial textile manufacturing and premium eco-friendly packaging. Cultivated organically without harsh chemical fertilizers, ensuring raw tensile endurance and sustainable harvesting profiles.",
        image: "https://images.unsplash.com/photo-1530510118671-8cc462ffbaab?auto=format&fit=crop&q=80&w=800",
        pricing: {
            mode: "Fixed",
            unit: "bales",
            unitPrice: 15500,
            minimumOrderQty: 5,
            bulkPricingTiers: [{ minQty: 20, pricePerUnit: 14800 }]
        },
        moisture: "10%",
        grade: "Premium",
        region: "Faridpur",
        variety: "Tosha Jute",
        sackType: "Bales (180kg)",
        qualityNotes: "Export quality Golden fiber. Length exceeds standard baseline. Fully sun-dried.",
        diseaseNotes: "Resistant to stem rot. No pesticides detected.",
        isSpotlight: true,
        status: "Active"
      }
    ];

    await FarmerListing.insertMany(dummyListings);
    console.log("Successfully seeded", dummyListings.length, "Wholesale items!");

    mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("Seeding Error:", err);
    mongoose.connection.close();
    process.exit(1);
  }
}

runSeed();
