const sharp = require("sharp");

const ALLOWED_IMAGE_FORMATS = ["jpeg", "png", "webp"];

const processImageBuffer = async (buffer, options = {}) => {
  const {
    width,
    height,
    fit = "cover",
    quality = 80,
    maxPixels = 25_000_000,
  } = options;

  const image = sharp(buffer, { failOnError: true }).rotate();
  const metadata = await image.metadata();

  if (!metadata.format || !ALLOWED_IMAGE_FORMATS.includes(metadata.format)) {
    const error = new Error("Unsupported image format");
    error.code = "UNSUPPORTED_IMAGE_FORMAT";
    throw error;
  }

  if (!metadata.width || !metadata.height) {
    const error = new Error("Invalid image dimensions");
    error.code = "INVALID_IMAGE";
    throw error;
  }

  if (metadata.width * metadata.height > maxPixels) {
    const error = new Error("Image dimensions are too large");
    error.code = "IMAGE_TOO_LARGE";
    throw error;
  }

  let pipeline = image;
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      position: "center",
    });
  }

  if (metadata.format === "png") {
    return pipeline.png({ quality }).toBuffer();
  }

  return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
};

module.exports = {
  processImageBuffer,
  ALLOWED_IMAGE_FORMATS,
};
