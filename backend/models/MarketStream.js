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
    isActive: {
        type: Boolean,
        default: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketStream', MarketStreamSchema);
