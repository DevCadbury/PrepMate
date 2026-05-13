const express = require("express");
const multer = require("multer");
const { asyncHandler } = require("../utils/asyncHandler");
const { authenticateToken } = require("../middleware/auth");
const { uploadBuffer, destroyImage, isCloudinaryConfigured } = require("../utils/cloudinary");
const { processImageBuffer } = require("../utils/imageProcessing");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only image uploads are supported"));
    }
    return cb(null, true);
  },
});

// @desc    Upload profile picture (authenticated)
// @route   POST /api/uploads/profile-picture
// @access  Protected
router.post(
  "/profile-picture",
  authenticateToken,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const processedBuffer = await processImageBuffer(req.file.buffer, {
      width: 400,
      height: 400,
      fit: "cover",
      quality: 82,
      maxPixels: Number(process.env.IMAGE_MAX_PIXELS || 25000000),
    });

    const result = await uploadBuffer(processedBuffer, {
      folder: "profile-pictures",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

// @desc    Upload general image (authenticated)
// @route   POST /api/uploads/image
// @access  Protected
router.post(
  "/image",
  authenticateToken,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const processedBuffer = await processImageBuffer(req.file.buffer, {
      width: 1600,
      height: 1600,
      fit: "inside",
      quality: 80,
      maxPixels: Number(process.env.IMAGE_MAX_PIXELS || 25000000),
    });

    const result = await uploadBuffer(processedBuffer, {
      folder: "uploads",
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  })
);

// @desc    Delete image by publicId (authenticated)
// @route   DELETE /api/uploads/image
// @access  Protected
router.delete(
  "/image",
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Image upload service is not configured.",
      });
    }

    const { publicId } = req.body || {};
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required.",
      });
    }

    const result = await destroyImage(publicId);
    res.json({
      success: true,
      data: result,
    });
  })
);

module.exports = router;
