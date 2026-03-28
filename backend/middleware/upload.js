const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory exists
const uploadDir = "uploads/nids/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // userId - fieldname - timestamp
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${file.fieldname}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
  },
});

module.exports = upload;
