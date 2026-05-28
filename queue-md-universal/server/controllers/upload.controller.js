const cloudinary = require('../config/cloudinary');
const { getCorrectedTimestamp } = require('../utils/timeSync');
const upload = require('../middleware/multer');
const logger = require('../utils/logger');
const sharp = require('sharp');
const { getSignedUrl } = require('../utils/cloudinaryHelper');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // 🔒 SECURITY: Magic bytes validation — verify file content matches declared MIME type (L-05)
    const isValidFile = upload.validateMagicBytes(req.file.buffer, req.file.mimetype);
    if (!isValidFile) {
      logger.warn(`🚨 SECURITY: File upload rejected — magic bytes mismatch for ${req.file.mimetype} from user ${req.user?.id}`);
      return res.status(400).json({ success: false, message: 'Invalid file content. File type mismatch detected.' });
    }

    // 🔒 SECURITY: Strip EXIF metadata from uploaded images using Sharp (Item 4)
    let processedBuffer = req.file.buffer;
    if (req.file.mimetype.startsWith('image/')) {
      try {
        processedBuffer = await sharp(req.file.buffer)
          .rotate() // keeps original orientation but strips raw EXIF tags
          .toBuffer();
        logger.info(`[SHARP] Stripped EXIF metadata successfully from image upload`);
      } catch (sharpError) {
        logger.error(`[SHARP] Failed to strip EXIF: ${sharpError.message}`);
        return res.status(400).json({ success: false, message: 'Failed to process and sanitize image' });
      }
    }

    const { facilityId, facilityType } = req.user;
    const folderType = req.body.folderType || 'general';

    // SaaS Isolation: QueueMD/clinic/64f8a9b2c1d/logos
    const cloudinaryFolder = `QueueMD/${facilityType}/${facilityId}/${folderType}`;

    // Convert processed buffer to base64 data URI for upload
    const b64 = processedBuffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: cloudinaryFolder,
      resource_type: 'auto',
      type: 'private', // 🔒 SECURITY: Store as private asset (Item 4)
      timestamp: getCorrectedTimestamp()
    });

    // 🔒 SECURITY: Generate signed URL valid for 1 hour
    const signedUrl = getSignedUrl(result.secure_url, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: signedUrl,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    logger.error(`Cloudinary Upload Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
  }
};
