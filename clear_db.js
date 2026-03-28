const mongoose = require('mongoose');
const MarketListing = require('./backend/models/MarketListing');
require('dotenv').config();

async function clearAndSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AgriNetwork');
    console.log('Connected to MongoDB');
    
    await MarketListing.deleteMany({});
    console.log('Cleared MarketListing collection');
    
    // Trigger seed from server
    // Actually I can just import the data here or call the endpoint
    // But since I've already updated the controller, I'll just call the endpoint via curl
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearAndSeed();
