const CropPlan = require("../models/CropPlan");
const MarketInsight = require("../models/MarketInsight");
const MarketProduct = require("../models/MarketProduct");
const MarketStream = require("../models/MarketStream");

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

// @route   GET /api/market/insights
// @desc    Get market insights and trends
// @access  Public
exports.getMarketInsights = async (req, res) => {
    try {
        const { region, category, season } = req.query;
        const filter = {};

        if (region) filter.region = region;
        if (category) filter.categoryId = category;
        if (season) filter.season = season;

        const insights = await MarketInsight.find(filter)
            .populate("categoryId", "name")
            .sort({ createdAt: -1 });

        res.json(insights);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// @route   GET /api/market/crop-plans
// @desc    Get all crop plans for the user
// @access  Private
exports.getCropPlans = async (req, res) => {
    try {
        const plans = await CropPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// @route   POST /api/market/crop-plans
// @desc    Create a new AI-based crop plan
// @access  Private
exports.createCropPlan = async (req, res) => {
    try {
        const {
            landArea,
            landUnit,
            region,
            district,
            season,
            soilType,
            irrigationAvailable,
            budget,
        } = req.body;

        const parsedLandArea = Number(landArea);
        const parsedBudget = Number(budget);

        const recommendations = [
            {
                cropName: "Boro Rice",
                variety: "BRRI dhan28",
                recommendationScore: 92,
                expectedYield: parsedLandArea * 2.5,
                expectedMarketPrice: 28000,
                profitabilityScore: 85,
                reason: `Ideal soil and upcoming favorable monsoon season in ${district || region}`,
            },
            {
                cropName: "Mustard",
                variety: "BARI Sarisha-14",
                recommendationScore: 78,
                expectedYield: parsedLandArea * 0.8,
                expectedMarketPrice: 45000,
                profitabilityScore: 72,
                reason: `Low water consumption and high market demand predicted for ${season}`,
            },
        ];

        const newPlan = new CropPlan({
            userId: req.user.id,
            landArea: parsedLandArea,
            landUnit,
            region,
            district,
            season,
            soilType,
            irrigationAvailable: Boolean(irrigationAvailable),
            budget: parsedBudget,
            recommendations,
            generatedBy: "AI",
            modelVersion: "AgriBrain-v1.2",
        });

        await newPlan.save();
        res.status(201).json(newPlan);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};

// @route   POST /api/market/seed
// @desc    Seed market insights data
// @access  Public (Dev only)
exports.seedMarketData = async (req, res) => {
    try {
        const sampleInsights = [
            {
                productName: "Tomato",
                variety: "Premium",
                region: "Rajshahi",
                season: "Winter",
                demandLevel: "High",
                supplyLevel: "Medium",
                priceTrend: "Up",
                forecastSummary: "Due to unseasonal rain, supply is expected to dip, driving prices higher.",
                recommendation: "Hold stock for 2 weeks or harvest early to capture peak prices.",
                confidenceScore: 88,
                priceHistory: [
                    { date: new Date(Date.now() - 86400000 * 7), averagePrice: 45 },
                    { date: new Date(Date.now() - 86400000), averagePrice: 52 }
                ]
            },
            {
                productName: "Potato",
                variety: "Diamond",
                region: "Bogura",
                season: "Winter",
                demandLevel: "Medium",
                supplyLevel: "High",
                priceTrend: "Stable",
                forecastSummary: "Bumper harvest expected in Northern regions.",
                recommendation: "Focus on cold storage to avoid glut prices.",
                confidenceScore: 94,
                priceHistory: [
                    { date: new Date(Date.now() - 86400000 * 7), averagePrice: 22 },
                    { date: new Date(Date.now() - 86400000), averagePrice: 23 }
                ]
            }
        ];

        await MarketInsight.deleteMany({});
        const created = await MarketInsight.insertMany(sampleInsights);

        res.json({ message: "Market insights seeded", count: created.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};
