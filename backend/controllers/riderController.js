const Rider = require("../models/Rider");

exports.getNearbyRiders = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 50000 } = req.query; // maxDistance in meters (default 50km)
    
    if (!lng || !lat) {
      return res.status(400).json({ message: "Longitude and latitude are required" });
    }

    const riders = await Rider.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: "Available"
    }).limit(10); // get top 10 closest

    res.json(riders);
  } catch (err) {
    console.error("Error fetching nearby riders:", err);
    res.status(500).json({ message: err.message });
  }
};
