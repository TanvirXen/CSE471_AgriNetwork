const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for standalone testing
  },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  pricingType: { 
    type: String, 
    enum: ['Fixed', 'Negotiable', 'Auction'], 
    default: 'Fixed' 
  },
  price: { type: Number },
  startingBid: { type: Number },
  auctionEndDate: { type: Date },
  stock: { type: String },
  images: [{ type: String }],
  availabilityDate: { type: Date },
  status: { type: String, default: 'pending' },
  isPublic: { type: Boolean, default: true },
  isBoosted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
