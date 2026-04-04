const multer = require("multer");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/appErrors");

// ===== Storage =====
// Using memory storage for ImageKit uploads
const storage = multer.memoryStorage();
const categoryStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "categories");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `category-${uniqueSuffix}${ext}`);
  },
});

// ===== File Filter =====
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError("Only image files (jpg, png, webp) are allowed", 400), false);
  }

  cb(null, true);
};

//
// ================= PROFILE PICTURE =================
//
exports.uploadProfilePicture = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
}).single("profilePicture");

//
// ================= POST IMAGES =================
//
exports.uploadPostImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
}).array("images", 10);

//
// ================= CATEGORY IMAGE =================
//
exports.uploadCategoryImage = multer({
  storage: categoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
}).single("image");

// usage in routes:
// const { uploadProfilePicture, uploadPostImages } = require('../config/fileUpload');
// router.post('/upload-profile', uploadProfilePicture, controller);
// router.post('/upload-post-images', uploadPostImages, controller);
//  file: req.file,
//  const images = req.files.map(file => file.filename);
