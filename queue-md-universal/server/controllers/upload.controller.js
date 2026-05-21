const cloudinary = require('../config/cloudinary');
const { getCorrectedTimestamp } = require('../utils/timeSync');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { facilityId, facilityType } = req.user;
    const folderType = req.body.folderType || 'general';

    // SaaS Isolation: QueueMD/clinic/64f8a9b2c1d/logos
    const cloudinaryFolder = `QueueMD/${facilityType}/${facilityId}/${folderType}`;

    // Convert buffer to base64 data URI for upload (not stored in DB — only URL is saved)
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: cloudinaryFolder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      timestamp: getCorrectedTimestamp()
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
  }
};

