const multer = require("multer");
const AppError = require("../utils/appErrors");

// ===== Storage =====
// Using memory storage for ImageKit uploads
const storage = multer.memoryStorage();

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

// usage in routes:
// const { uploadProfilePicture, uploadPostImages } = require('../config/fileUpload');
// router.post('/upload-profile', uploadProfilePicture, controller);
// router.post('/upload-post-images', uploadPostImages, controller);
//  file: req.file,
//  const images = req.files.map(file => file.filename);
