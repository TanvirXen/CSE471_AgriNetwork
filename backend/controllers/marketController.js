const MarketProduct = require('../models/MarketProduct');
const MarketStream = require('../models/MarketStream');

// @desc    Get all market products (with optional filtering)
// @route   GET /api/market/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { category, segment, search } = req.query;
        let query = {};

        if (category && category !== 'all') {
            // Case-insensitive exact match
            query.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        if (segment && segment !== 'all') {
            query.segment = { $regex: new RegExp(`^${segment}$`, 'i') };
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await MarketProduct.find(query).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error("Error fetching market products:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching products' });
    }
};

// @desc    Add a new market product
// @route   POST /api/market/products
// @access  Private (Assume authenticated in a real scenario)
exports.addProduct = async (req, res) => {
    try {
        const { name, category, segment, price, quality, image, isLive } = req.body;

        if (!name || !category || !segment || !price || !quality || !image) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newProduct = await MarketProduct.create({
            name,
            category: category.toLowerCase(),
            segment: segment.toLowerCase(),
            price,
            quality,
            image,
            isLive: isLive || false
            // sellerId: req.user._id // Omitted for mock testing without auth middleware
        });

        res.status(201).json({
            success: true,
            data: newProduct
        });
    } catch (error) {
        console.error("Error adding market product:", error);
        res.status(500).json({ success: false, message: 'Server error while adding product' });
    }
};

// @desc    Get active market streams
// @route   GET /api/market/streams
// @access  Public
exports.getStreams = async (req, res) => {
    try {
        const streams = await MarketStream.find({ isLive: true }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: streams.length,
            data: streams
        });
    } catch (error) {
        console.error("Error fetching market streams:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching streams' });
    }
};

// @desc    Add a new market stream (For seeding/testing)
// @route   POST /api/market/streams
// @access  Private
exports.addStream = async (req, res) => {
    try {
        const { title, host, viewers, image, vendorId, isLive, streamUrl } = req.body;

        let newStream;
        if (vendorId) {
            // Find or create MarketStream for this exact vendor
            newStream = await MarketStream.findOneAndUpdate(
                { vendorId },
                { title, host, viewers: viewers || "0", image, isLive: isLive !== undefined ? isLive : true, streamUrl },
                { new: true, upsert: true }
            );
        } else {
            // Fallback for mock seeds without vendors
            newStream = await MarketStream.create({
                title, host, viewers: viewers || "0", image, vendorId, isLive: isLive !== undefined ? isLive : true, streamUrl
            });
        }

        res.status(201).json({
            success: true,
            data: newStream
        });
    } catch (error) {
         console.error("Error adding market stream:", error);
         res.status(500).json({ success: false, message: 'Server error while adding stream' });
    }
};

// @desc    Get single market stream by ID
// @route   GET /api/market/streams/:id
// @access  Public
exports.getStreamById = async (req, res) => {
    try {
        const stream = await MarketStream.findById(req.params.id);
        
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        res.status(200).json({
            success: true,
            data: stream
        });
    } catch (error) {
        console.error("Error fetching market stream by ID:", error);
        
        // Handle invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }
        
        res.status(500).json({ success: false, message: 'Server error while fetching stream' });
    }
};

// @desc    Add chat message to stream
// @route   POST /api/market/streams/:id/chat
// @access  Public
exports.addChatMessage = async (req, res) => {
    try {
        const { user, text, bidAmount } = req.body;
        
        if (!user || !text) {
            return res.status(400).json({ success: false, message: 'Please provide user and text fields' });
        }

        const stream = await MarketStream.findById(req.params.id);
        
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        if (bidAmount && !isNaN(bidAmount)) {
            const parsedBid = Number(bidAmount);
            if (parsedBid > (stream.currentBid || 0)) {
                stream.currentBid = parsedBid;
            }
        }

        // Add the message
        stream.chatMessages.push({
            user,
            text,
            timestamp: new Date()
        });

        // Save to DB
        await stream.save();

        res.status(200).json({
            success: true,
            data: stream
        });
    } catch (error) {
        console.error("Error saving chat message:", error);
        
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }
        res.status(500).json({ success: false, message: 'Server error while saving chat message' });
    }
};

// @desc    End a live market stream
// @route   POST /api/market/streams/:id/end
// @access  Public
exports.endStream = async (req, res) => {
    try {
        const stream = await MarketStream.findById(req.params.id);
        
        if (!stream) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        stream.isLive = false;
        await stream.save();

        res.status(200).json({
            success: true,
            message: 'Stream ended successfully',
            data: stream
        });
    } catch (error) {
        console.error("Error ending stream:", error);
        res.status(500).json({ success: false, message: 'Server error while ending stream' });
    }
};
