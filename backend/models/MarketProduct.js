const mongoose = require('mongoose');

const MarketProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['crops', 'fish', 'poultry', 'livestock']
    },
    segment: {
        type: String,
        required: true,
        enum: ['organic', 'bulk', 'seasonal', 'direct farm']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quality: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C']
    },
    image: {
        type: String,
        required: true
    },
    isLive: {
        type: Boolean,
        default: false
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now, assuming we might not enforce it strictly in mock data insertion
    }
}, {
    timestamps: true
});

// Indexes for faster filtering
MarketProductSchema.index({ category: 1, segment: 1 });
MarketProductSchema.index({ name: 'text' });

module.exports = mongoose.model('MarketProduct', MarketProductSchema);
