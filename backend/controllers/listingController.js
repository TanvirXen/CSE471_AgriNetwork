const { FarmerListing } = require("../models");

exports.getListings = async (req, res) => {
  try {
    const listings = await FarmerListing.find();
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    const listing = new FarmerListing(req.body);
    await listing.save();
    res.status(201).json(listing);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
