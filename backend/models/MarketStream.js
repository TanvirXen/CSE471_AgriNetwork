const mongoose = require('mongoose');

const MarketStreamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    host: {
        type: String,
        required: true,
        trim: true
    },
    viewers: {
        type: String, // String to support formats like '1.2k' as in the mock data, or could be Number
        default: '0'
    },
    image: {
        type: String,
        required: true
    },
    isLive: {
        type: Boolean,
        default: true
    },
    currentBid: {
        type: Number,
        default: 0
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    streamUrl: {
        type: String,
        required: false,
        default: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // fallback mock URL
    },
    chatMessages: [{
        user: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketStream', MarketStreamSchema);
