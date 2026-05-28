// server/utils/cloudinaryHelper.js
const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

/**
 * Extracts the Cloudinary public_id from a full Cloudinary secure URL.
 *
 * @param {string} url - The full Cloudinary URL
 * @returns {string|null} The public_id or null if not parsed
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    // Support both 'private' and standard 'upload' delivery types
    let deliveryIndex = parts.indexOf('private');
    if (deliveryIndex === -1) {
      deliveryIndex = parts.indexOf('upload');
    }
    
    if (deliveryIndex === -1) return null;

    // Slice all parts after /private/ or /upload/
    let pathParts = parts.slice(deliveryIndex + 1);
    
    // If the next tag is a version string (e.g. v1718293849), skip it
    if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
      pathParts = pathParts.slice(1);
    }

    const fullPath = pathParts.join('/');
    
    // Remove the file extension (e.g. .jpg, .pdf)
    const dotIndex = fullPath.lastIndexOf('.');
    return dotIndex !== -1 ? fullPath.substring(0, dotIndex) : fullPath;
  } catch (err) {
    logger.error(`[CLOUDINARY] Failed to parse publicId from URL: ${err.message}`);
    return null;
  }
};

/**
 * 🔒 SECURITY: Generate Short-Lived Signed URL for Private Assets (Item 4)
 * Returns a signed URL valid for 1 hour.
 *
 * @param {string} url - The original unauthenticated Cloudinary URL or publicId
 * @param {string} mimetype - The file mimetype (to differentiate images from PDFs)
 * @returns {string} The short-lived signed URL
 */
exports.getSignedUrl = (url, mimetype = 'image/jpeg') => {
  if (!url) return '';
  
  // If it's already a local/different URL, return as-is
  if (!url.includes('cloudinary.com')) return url;

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return url;

  try {
    const isPdf = mimetype === 'application/pdf' || url.endsWith('.pdf');
    
    // Generate signed URL
    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'private',
      resource_type: isPdf ? 'image' : 'image', // Cloudinary treats PDF uploads inside image folder as image
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      secure: true
    });
  } catch (err) {
    logger.error(`[CLOUDINARY] Error generating signed URL: ${err.message}`);
    return url; // Fallback to raw URL
  }
};
