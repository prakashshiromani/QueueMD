const cloudinary = require('cloudinary').v2;

// Support both CLOUDINARY_URL (recommended) and individual env vars
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = cloudinary;
