const cloudinary = require("cloudinary").v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadBuffer = (buffer, options = {}) => {
  if (!isConfigured) {
    const error = new Error("Cloudinary is not configured");
    error.code = "CLOUDINARY_NOT_CONFIGURED";
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      }
    );

    stream.end(buffer);
  });
};

const destroyImage = async (publicId) => {
  if (!isConfigured) {
    const error = new Error("Cloudinary is not configured");
    error.code = "CLOUDINARY_NOT_CONFIGURED";
    throw error;
  }

  if (!publicId) {
    const error = new Error("Public ID is required");
    error.code = "PUBLIC_ID_REQUIRED";
    throw error;
  }

  return cloudinary.uploader.destroy(publicId, { invalidate: true });
};

module.exports = {
  cloudinary,
  uploadBuffer,
  destroyImage,
  isCloudinaryConfigured: () => isConfigured,
};
