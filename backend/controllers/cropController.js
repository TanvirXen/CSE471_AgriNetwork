const FarmerListing = require("../models/FarmerListing");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CREATE CROP (POST)
exports.createCrop = async (req, res) => {
  try {
    const cropData = req.body;
    
    // Parse JSON strings from form-data if present
    if (typeof cropData.pricing === 'string') {
        try { cropData.pricing = JSON.parse(cropData.pricing); } catch(e){}
    }
    if (typeof cropData.availabilitySchedule === 'string') {
        try { cropData.availabilitySchedule = JSON.parse(cropData.availabilitySchedule); } catch(e){}
    }

    if (req.file) {
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "CropMarketplace" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          const { Readable } = require('stream');
          const readable = new Readable();
          readable._read = () => {};
          readable.push(req.file.buffer);
          readable.push(null);
          readable.pipe(stream);
        });
      };
      
      const cldRes = await uploadStream();
      cropData.media = [{ type: "image", url: cldRes.secure_url }];
    } else if (!cropData.media) {
      cropData.media = [];
    }

    const crop = new FarmerListing(cropData);
    const savedCrop = await crop.save();
    res.status(201).json(savedCrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// FILTER CROP (GET)
exports.filterCrops = async (req, res) => {
  try {
    const { variety, grade, moisturePercentage, sackType } = req.query;

    let filter = {};
    if (variety) filter.variety = variety;
    if (grade) filter.grade = grade;
    if (sackType) filter.sackType = sackType;
    if (moisturePercentage) filter.moisturePercentage = moisturePercentage;

    const crops = await FarmerListing.find(filter)
      .populate("sellerId", "fullName phone profile")
      .populate("vendorId", "fullName phone profile");

    // Self-healing block for legacy dummy crops
    const Review = require("../models/Review");
    await Promise.all(crops.map(async (doc) => {
      let currentReviews = typeof doc.totalReviews === 'number' ? doc.totalReviews : 0;
      if (currentReviews === 0) {
        const existingReviews = await Review.find({ productId: doc._id, moderationStatus: { $ne: "deleted" } });
        if (existingReviews.length > 0) {
          currentReviews = existingReviews.length;
          let sum = 0;
          existingReviews.forEach(r => sum += r.averageRating);
          let currentRating = sum / currentReviews;
          let currentTrust = Math.min(100, currentRating * Math.log(currentReviews + 1) * 10);
          
          doc.averageRating = currentRating;
          doc.totalReviews = currentReviews;
          doc.trustScore = currentTrust;
          
          await FarmerListing.findByIdAndUpdate(doc._id, {
            $set: { averageRating: currentRating, totalReviews: currentReviews, trustScore: currentTrust }
          });
        }
      }
    }));

    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BULK DEALS
exports.getBulkDeals = async (req, res) => {
  try {
    const deals = await FarmerListing.find({
      "pricing.bulkPricingTiers": { $exists: true, $not: { $size: 0 } }
    }).limit(10);

    const responseData = deals.map(deal => ({
      id: deal._id,
      cropName: deal.productName,
      description: deal.description || "Premium bulk deal available directly from farmers.",
      isHot: deal.visibility === "Boosted",
      tiers: deal.pricing.bulkPricingTiers.map(t => ({ minQuantity: t.minQty, unit: deal.pricing.unit, pricePerUnit: t.pricePerUnit })),
      sellerName: "Verified Seller"
    }));

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HARVEST CALENDAR
exports.getHarvestCalendar = async (req, res) => {
  try {
    const { month, region } = req.query;

    // Parse month parameter if provided
    let targetMonthIndex = -1;
    if (month) {
      targetMonthIndex = parseInt(month) - 1; // if number input (1-12)
      if (isNaN(targetMonthIndex)) {
        targetMonthIndex = new Date(`${month} 1, 2000`).getMonth(); // if string like "Apr"
      }
      if (targetMonthIndex < 0 || targetMonthIndex > 11) {
        return res.status(400).json({ message: "Invalid month parameter" });
      }
    }

    const filter = {};
    if (region) filter.region = region;

    const crops = await FarmerListing.find(filter);

    const matchingCrops = crops.filter(crop => {
      if (!crop.availabilitySchedule) return false;

      // Extract schedule safely
      let schedule = Array.isArray(crop.availabilitySchedule) ? crop.availabilitySchedule : [];
      schedule = schedule.map(slot => {
        if (typeof slot === "string") {
          try { return JSON.parse(slot); } catch { return null; }
        }
        return slot;
      }).filter(Boolean);

      // If no month was specified, return all
      if (targetMonthIndex === -1) return true;

      // Otherwise, only include crops that have a schedule date in the target month
      return schedule.some(slot => {
        if (!slot.date) return false;
        return new Date(slot.date).getMonth() === targetMonthIndex;
      });
    });

    const responseData = matchingCrops.map(c => {
      // Safely extract the dates array
      let schedule = Array.isArray(c.availabilitySchedule) ? c.availabilitySchedule : [];
      let dates = schedule.map(slot => {
        if (typeof slot === "string") {
          try { slot = JSON.parse(slot); } catch { }
        }
        return slot?.date ? new Date(slot.date).toISOString().split('T')[0] : null;
      }).filter(Boolean);

      return {
        id: c._id,
        name: c.productName || "Unnamed Crop",
        image: c.media && c.media.length > 0 ? c.media[0].url : 'https://placehold.co/400x300?text=No+Image',
        dates: dates,
        expectedYield: `${c.quantity || 0} ${c.quantityUnit || 'kg'}`,
        region: c.region || "All Regions",
        status: c.status || "Unknown",
        price: c.pricing?.unitPrice || 0,
        unit: c.pricing?.unit || 'kg',
        minimumOrderQty: c.pricing?.minimumOrderQty || 1,
        bulkDeals: (c.pricing?.bulkPricingTiers || []).map(t => ({ minQty: t.minQty, price: t.pricePerUnit })),
        diseaseNotes: c.diseaseNotes || 'None',
        qualityNotes: c.qualityNotes || 'N/A',
        moisture: c.moisturePercentage ? `${c.moisturePercentage}%` : 'N/A'
      };
    });

    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// SPOTLIGHT
exports.getSpotlight = async (req, res) => {
    try {
      const crops = await FarmerListing.find({ isActive: true }).populate("sellerId", "fullName phone profile");
  
      // group by region
      const regionMap = {};
  
      crops.forEach(crop => {
        if (!regionMap[crop.region]) {
          regionMap[crop.region] = [];
        }
        regionMap[crop.region].push(crop);
      });
  
      // pick top crop per region (by quantity for now)
      const spotlight = Object.keys(regionMap).map(region => {
        const sorted = regionMap[region].sort((a, b) => b.quantity - a.quantity);
        const topCrop = sorted[0];
  
        return {
          region: region,
          name: topCrop.productName,
          image: topCrop.media?.[0]?.url || null,
          quantity: `${topCrop.quantity} ${topCrop.quantityUnit}`,
          price: topCrop.pricing?.unitPrice || 0,
          isHighDemand: true // force true for now
        };
      });
  
      res.json(spotlight);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// SELLER NOTES
exports.getNotes = async (req, res) => {
  try {
    const crop = await FarmerListing.findById(req.params.id);
    if (!crop) return res.status(404).json({ message: "Crop not found" });

    res.json({
      diseaseInfo: crop.diseaseNotes,
      qualityNotes: crop.qualityNotes,
      lastUpdated: crop.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateNotes = async (req, res) => {
  try {
    const { diseaseInfo, qualityNotes } = req.body;
    const crop = await FarmerListing.findByIdAndUpdate(
      req.params.id,
      { diseaseNotes: diseaseInfo, qualityNotes },
      { new: true }
    );
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    res.json({
      diseaseInfo: crop.diseaseNotes,
      qualityNotes: crop.qualityNotes,
      lastUpdated: crop.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE CROP
exports.getCropById = async (req, res) => {
  try {
    const crop = await FarmerListing.findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },   
        { new: true }
      ).populate("sellerId", "fullName phone profile").populate("vendorId", "fullName phone profile");

    let currentRating = typeof crop.averageRating === 'number' ? crop.averageRating : 0;
    let currentReviews = typeof crop.totalReviews === 'number' ? crop.totalReviews : 0;
    let currentTrust = typeof crop.trustScore === 'number' ? crop.trustScore : 0;

    if (currentReviews === 0) {
      const Review = require("../models/Review");
      const existingReviews = await Review.find({ productId: crop._id, moderationStatus: { $ne: "deleted" } });
      if (existingReviews.length > 0) {
        currentReviews = existingReviews.length;
        let sum = 0;
        existingReviews.forEach(r => sum += r.averageRating);
        currentRating = sum / currentReviews;
        currentTrust = Math.min(100, currentRating * Math.log(currentReviews + 1) * 10);
        
        // Sync to DB
        await FarmerListing.findByIdAndUpdate(crop._id, {
          $set: { averageRating: currentRating, totalReviews: currentReviews, trustScore: currentTrust }
        });
      }
    }

    const formattedCrop = {
      id: crop._id,
      name: crop.productName || 'Unnamed Crop',
      variety: crop.variety || 'Unknown Variety',
      region: crop.region || 'Unknown Region',
      price: crop.pricing?.unitPrice || 0,
      unit: crop.pricing?.unit || 'kg',
      moisture: crop.moisturePercentage ? `${crop.moisturePercentage}%` : 'N/A',
      grade: crop.grade || 'N/A',
      sackType: crop.sackType || 'N/A',
      diseaseNotes: crop.diseaseNotes || 'None reported.',
      qualityNotes: crop.qualityNotes || 'No quality notes provided.',
      minimumOrderQty: crop.pricing?.minimumOrderQty || 1,
      isSpotlight: crop.visibility === 'Boosted',
      bulkDeals: (crop.pricing?.bulkPricingTiers || []).map(t => ({
        minQty: t.minQty,
        price: t.pricePerUnit
      })),
      harvestDate: 'N/A',
      averageRating: currentRating,
      totalReviews: currentReviews,
      trustScore: currentTrust,
      image: crop.media && crop.media.length > 0 ? crop.media[0].url : 'https://placehold.co/400x300?text=No+Image',
      seller: (crop.sellerId || crop.vendorId) ? {
        _id: crop.sellerId?._id || crop.vendorId?._id,
        name: crop.sellerId?.fullName || crop.vendorId?.fullName,
        phone: crop.sellerId?.phone || crop.vendorId?.phone,
        averageRating: crop.sellerId?.profile?.averageRating || crop.vendorId?.profile?.averageRating || 0,
        trustScore: crop.sellerId?.profile?.trustScore || crop.vendorId?.profile?.trustScore || 0,
        totalReviews: crop.sellerId?.profile?.totalReviews || crop.vendorId?.profile?.totalReviews || 0
      } : { name: "Verified Seller", phone: "Contact via platform" }
    };

    res.json(formattedCrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SELLER INFO
exports.getSellerInfo = async (req, res) => {
  try {
    const crop = await FarmerListing.findById(req.params.id).populate("sellerId", "fullName phone");
    if (!crop) return res.status(404).json({ message: "Crop not found" });
    if (!crop.sellerId) return res.status(404).json({ message: "Seller not found for this crop." });

    res.json({
      name: crop.sellerId.fullName,
      phone: crop.sellerId.phone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE (PUT)
exports.updateCrop = async (req, res) => {
  try {
    const cropId = req.params.id;
    const updatedData = req.body;

    const updatedCrop = await FarmerListing.findByIdAndUpdate(
      cropId,
      updatedData,
      { new: true }
    );

    if (!updatedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    res.json(updatedCrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE CROP

exports.deleteCrop = async (req, res) => {
  try {
    const cropId = req.params.id;
    const deletedCrop = await FarmerListing.findByIdAndDelete(cropId);

    if (!deletedCrop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    res.json({ message: "Crop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
