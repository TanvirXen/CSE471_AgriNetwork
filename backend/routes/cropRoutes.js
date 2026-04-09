const express = require("express");
const router = express.Router();
const cropController = require("../controllers/cropController");
const uploadMemory = require("../middleware/cloudinaryUpload");

router.post("/", uploadMemory.single("image"), cropController.createCrop);
router.get("/filter", cropController.filterCrops);
router.get("/bulk-deals", cropController.getBulkDeals);
router.get("/harvest", cropController.getHarvestCalendar);
router.get("/spotlight", cropController.getSpotlight);
router.get("/:id/notes", cropController.getNotes);
router.post("/:id/notes", cropController.updateNotes);
router.get("/:id", cropController.getCropById);
router.get("/:id/seller", cropController.getSellerInfo);
router.put("/:id", cropController.updateCrop);
router.delete("/:id", cropController.deleteCrop);

// router.get('/filter', async (req, res) => {
//   try {
//     const crops = await Crop.find({ /* your filter logic */ });
//     res.json(crops);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;



