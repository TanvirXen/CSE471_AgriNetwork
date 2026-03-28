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
        const streams = await MarketStream.find({ isActive: true }).sort({ createdAt: -1 });
        
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
        const { title, host, viewers, image } = req.body;

        const newStream = await MarketStream.create({
            title, host, viewers, image
        });

        res.status(201).json({
            success: true,
            data: newStream
        });
    } catch (error) {
         console.error("Error adding market stream:", error);
         res.status(500).json({ success: false, message: 'Server error while adding stream' });
    }
};
